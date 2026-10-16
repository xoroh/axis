import { describe, expect, it } from "vitest";
import {
  createFocusTrapModel,
  nextTrapIndex,
  resolveAutofocus,
} from "./focusTrap";

describe("nextTrapIndex", () => {
  it("moves within the stops", () => {
    expect(nextTrapIndex(0, 3, "next", true)).toBe(1);
    expect(nextTrapIndex(1, 3, "previous", true)).toBe(0);
    expect(nextTrapIndex(1, 3, "first", true)).toBe(0);
    expect(nextTrapIndex(1, 3, "last", true)).toBe(2);
  });

  // A modal loops: Tab from the last stop wraps to the first, Shift+Tab from
  // the first wraps to the last. That wrap IS the trap.
  it("wraps at the ends when looping", () => {
    expect(nextTrapIndex(2, 3, "next", true)).toBe(0);
    expect(nextTrapIndex(0, 3, "previous", true)).toBe(2);
  });

  it("clamps at the ends when not looping", () => {
    expect(nextTrapIndex(2, 3, "next", false)).toBe(2);
    expect(nextTrapIndex(0, 3, "previous", false)).toBe(0);
  });

  it("reports -1 with no stops and clamps a stale index", () => {
    expect(nextTrapIndex(0, 0, "next", true)).toBe(-1);
    // The stop list shrank while open: clamp onto the last stop.
    expect(nextTrapIndex(9, 3, "next", true)).toBe(0);
  });
});

describe("resolveAutofocus", () => {
  it("honours an explicit in-range index", () => {
    expect(resolveAutofocus(3, 2)).toEqual({ type: "focus-stop", index: 2 });
  });

  it("falls back to the first stop", () => {
    expect(resolveAutofocus(3)).toEqual({ type: "focus-stop", index: 0 });
    expect(resolveAutofocus(3, 9)).toEqual({ type: "focus-stop", index: 0 });
  });

  it("emits no event for an empty trap", () => {
    expect(resolveAutofocus(0)).toEqual({ type: "none" });
  });
});

describe("createFocusTrapModel", () => {
  it("moves and reports the current stop", () => {
    const trap = createFocusTrapModel({ count: 3 });
    expect(trap.getCurrent()).toBe(0);
    expect(trap.move("next")).toBe(1);
    expect(trap.move("previous")).toBe(0);
    expect(trap.loops()).toBe(true);
  });

  it("starts with no current stop when empty", () => {
    const trap = createFocusTrapModel({ count: 0 });
    expect(trap.getCurrent()).toBe(-1);
    expect(trap.autofocus()).toEqual({ type: "none" });
  });

  it("describes autofocus as an event, not a focus call", () => {
    const trap = createFocusTrapModel({ count: 2 });
    expect(trap.autofocus(1)).toEqual({ type: "focus-stop", index: 1 });
  });
});
