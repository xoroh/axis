import { describe, expect, it } from "vitest";
import {
  clampSliderValue,
  nearestSliderThumbIndex,
  normalizeSliderValues,
  resolveSliderCommit,
  sliderRatioFromLocation,
  sliderValueFromRatio,
  sliderValuePercent,
  snapSliderValue,
} from "./slider";

describe("slider math model", () => {
  it("clamps into range and collapses degenerate ranges to min", () => {
    expect(clampSliderValue(50, 0, 100)).toBe(50);
    expect(clampSliderValue(-5, 0, 100)).toBe(0);
    expect(clampSliderValue(250, 0, 100)).toBe(100);
    expect(clampSliderValue(30, 100, 0)).toBe(100);
    expect(clampSliderValue(Number.NaN, 0, 100)).toBe(0);
  });

  it("snaps to step multiples, continuous when step <= 0", () => {
    expect(snapSliderValue(47, 0, 10)).toBe(50);
    expect(snapSliderValue(44, 0, 10)).toBe(40);
    expect(snapSliderValue(47, 0, 0)).toBe(47);
    expect(snapSliderValue(47, 0, -5)).toBe(47);
    expect(snapSliderValue(12, 5, 10)).toBe(15);
  });

  it("reports percent along the range, 0 when degenerate", () => {
    expect(sliderValuePercent(70, 0, 100)).toBe(70);
    expect(sliderValuePercent(-5, 0, 100)).toBe(0);
    expect(sliderValuePercent(50, 100, 0)).toBe(0);
  });

  it("normalizes single and array values, clamped but unsnapped", () => {
    expect(normalizeSliderValues(70, 0, 100)).toEqual([70]);
    expect(normalizeSliderValues([25, 75], 0, 100)).toEqual([25, 75]);
    expect(normalizeSliderValues(undefined, 0, 100)).toEqual([0]);
    expect(normalizeSliderValues([], 0, 100)).toEqual([0]);
    expect(normalizeSliderValues([Number.NaN, 250], 0, 100)).toEqual([0, 100]);
    // Snapping happens on commit, not on read: display stays raw.
    expect(normalizeSliderValues(47, 0, 100)).toEqual([47]);
  });

  it("maps track locations to ratios, inverted for vertical", () => {
    expect(sliderRatioFromLocation(30, 100, "horizontal")).toBeCloseTo(0.3);
    expect(sliderRatioFromLocation(30, 100, "vertical")).toBeCloseTo(0.7);
    expect(sliderRatioFromLocation(-10, 100, "horizontal")).toBe(0);
    expect(sliderRatioFromLocation(10, 0, "horizontal")).toBe(0);
    expect(sliderValueFromRatio(0.3, 0, 100)).toBeCloseTo(30);
  });

  it("picks the nearest thumb, ties to the lower index", () => {
    expect(nearestSliderThumbIndex([25, 75], 60)).toBe(1);
    expect(nearestSliderThumbIndex([25, 75], 50)).toBe(0);
    expect(nearestSliderThumbIndex([50], 90)).toBe(0);
  });

  it("commits single values clamped and snapped", () => {
    expect(
      resolveSliderCommit([60], 0, 47, {
        min: 0,
        max: 100,
        step: 10,
        minStepsBetweenValues: 0,
      }),
    ).toEqual([50]);
    expect(
      resolveSliderCommit([60], 0, 250, {
        min: 0,
        max: 100,
        step: 0,
        minStepsBetweenValues: 0,
      }),
    ).toEqual([100]);
  });

  it("enforces the minimum gap between range values", () => {
    const options = { min: 0, max: 100, step: 1, minStepsBetweenValues: 10 };
    // Dragging past the neighbour clamps at the gap instead of crossing.
    expect(resolveSliderCommit([20, 80], 0, 95, options)).toEqual([70, 80]);
    expect(resolveSliderCommit([20, 80], 1, 5, options)).toEqual([20, 30]);
    // No gap configured: neighbours may touch but never cross.
    const free = { min: 0, max: 100, step: 0, minStepsBetweenValues: 0 };
    expect(resolveSliderCommit([20, 80], 0, 95, free)).toEqual([80, 80]);
    // Out-of-range indexes pin to the nearest end.
    expect(resolveSliderCommit([20, 80], 9, 50, options)).toEqual([20, 50]);
  });
});
