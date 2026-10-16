import { describe, expect, it } from "vitest";
import {
  formatTimeValue,
  minutesForStep,
  normalizeTimeValue,
  toTwentyFourHour,
} from "./time";

/**
 * The value is ALWAYS 24-hour internally. These tests exist because that is the
 * property a consumer persists, and a 12-hour picker that drifts is invisible
 * until two records are compared.
 */
describe("normalizeTimeValue", () => {
  it("keeps hours in 0–23", async () => {
    expect(normalizeTimeValue({ hours: 7, minutes: 30 })).toEqual({
      hours: 7,
      minutes: 30,
    });
    expect(normalizeTimeValue({ hours: 99 }).hours).toBe(23);
    expect(normalizeTimeValue({ hours: -4 }).hours).toBe(0);
  });

  it("truncates fractional hours and minutes", async () => {
    expect(normalizeTimeValue({ hours: 7.9, minutes: 30.7 })).toEqual({
      hours: 7,
      minutes: 30,
    });
  });

  it("snaps minutes DOWN onto the step grid", async () => {
    // 3:50 with a 15-minute step becomes 3:45, not 4:00. Snapping UP would move
    // the value the user did not ask for. (3:45 is itself ON the grid, so it
    // must survive unchanged — my first draft asserted 30 and was wrong.)
    expect(normalizeTimeValue({ hours: 3, minutes: 50 }, 15)).toEqual({
      hours: 3,
      minutes: 45,
    });
    expect(normalizeTimeValue({ hours: 3, minutes: 45 }, 15)).toEqual({
      hours: 3,
      minutes: 45,
    });
    expect(normalizeTimeValue({ hours: 3, minutes: 14 }, 15)).toEqual({
      hours: 3,
      minutes: 0,
    });
  });

  it("clamps minutes into 0–59", async () => {
    expect(normalizeTimeValue({ hours: 1, minutes: 99 }).minutes).toBe(59);
    expect(normalizeTimeValue({ hours: 1, minutes: -30 }).minutes).toBe(0);
  });

  /**
   * The fallback has to be VISIBLE in the data: with step 7 the reported value
   * is minute-accurate, so a consumer can tell it was not hour-accurate.
   */
  it("falls back to minute accuracy when step does not divide 60", async () => {
    expect(minutesForStep(7)).toHaveLength(60);
    // 3:45 is reachable when the step is 1, and unreachable at 7.
    expect(normalizeTimeValue({ hours: 3, minutes: 45 }, 7).minutes).toBe(45);
  });

  it("falls back for a nonsensical step", async () => {
    for (const bad of [0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(minutesForStep(bad)).toHaveLength(60);
    }
  });

  it("treats an absent value as midnight", async () => {
    expect(normalizeTimeValue(undefined)).toEqual({ hours: 0, minutes: 0 });
    expect(normalizeTimeValue({})).toEqual({ hours: 0, minutes: 0 });
  });
});

describe("minutesForStep", () => {
  it("produces every minute when step is 1", async () => {
    expect(minutesForStep(1)).toHaveLength(60);
    expect(minutesForStep(1)[59]).toBe(59);
  });

  it("produces the step grid when step divides 60", async () => {
    expect(minutesForStep(15)).toEqual([0, 15, 30, 45]);
    expect(minutesForStep(30)).toEqual([0, 30]);
    expect(minutesForStep(5)).toHaveLength(12);
  });
});

describe("12-hour is presentation, not state", () => {
  it("renders 15 as 3 PM", async () => {
    expect(formatTimeValue({ hours: 15, minutes: 0 }, "12h")).toEqual({
      hours: 3,
      period: "PM",
    });
  });

  it("renders midnight and noon correctly", async () => {
    expect(formatTimeValue({ hours: 0, minutes: 0 }, "12h")).toEqual({
      hours: 12,
      period: "AM",
    });
    expect(formatTimeValue({ hours: 12, minutes: 0 }, "12h")).toEqual({
      hours: 12,
      period: "PM",
    });
  });

  it("leaves the state 24-hour in 24h mode", async () => {
    expect(formatTimeValue({ hours: 15, minutes: 0 }, "24h").hours).toBe(15);
    expect(formatTimeValue({ hours: 3, minutes: 0 }, "24h").hours).toBe(3);
  });

  it("round-trips a 12-hour choice back to 24-hour state", async () => {
    for (const [twelve, period, twentyFour] of [
      [3, "PM", 15],
      [3, "AM", 3],
      [12, "AM", 0],
      [12, "PM", 12],
      [11, "PM", 23],
    ] as const) {
      expect(toTwentyFourHour(twelve, period)).toBe(twentyFour);
    }
  });

  /** The property that matters: render 12h, read back the same state. */
  it("survives a 12h render/read round trip unchanged", async () => {
    const state = normalizeTimeValue({ hours: 15, minutes: 30 });
    const shown = formatTimeValue(state, "12h");
    expect(toTwentyFourHour(shown.hours, shown.period)).toBe(state.hours);
    expect(normalizeTimeValue(state).minutes).toBe(30);
  });
});
