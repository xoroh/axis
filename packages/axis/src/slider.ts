/**
 * Slider behavior — range math as pure functions.
 *
 * No React, no React Native: clamping, step snapping, percent
 * mapping, single/range normalization, grant-target resolution, and
 * commit transforms (including `minStepsBetweenValues` gap
 * enforcement for range sliders). The compound `Slider` parts own
 * state via `useControllableState` and gestures via `PanResponder`;
 * every number they commit flows through here first. Nothing here
 * throws on caller input: degenerate ranges collapse, garbage
 * resolves to the nearest sane value.
 */

export type SliderOrientation = "horizontal" | "vertical";

/** Options shared by the commit path. */
export type SliderCommitOptions = {
  min: number;
  max: number;
  /** Snap increment. Values `<= 0` (or non-finite) mean continuous. */
  step: number;
  /**
   * Minimum gap between values in a range slider, in `step` units.
   * When `step <= 0` the gap applies in raw value units. Default `0`.
   */
  minStepsBetweenValues: number;
};

/** Clamp `value` into `[min, max]`. Degenerate `min > max` collapses to the single point `min`. */
export function clampSliderValue(
  value: number,
  min: number,
  max: number,
): number {
  const hi = max > min ? max : min;
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), hi);
}

/**
 * Snap `value` (assumed clamped) to the nearest `min + k * step`.
 * Values `<= 0` (or non-finite `step`) mean continuous — returned unchanged.
 */
export function snapSliderValue(
  value: number,
  min: number,
  step: number,
): number {
  if (!Number.isFinite(step) || step <= 0) return value;
  return min + Math.round((value - min) / step) * step;
}

/** Percentage (0–100) of `value` along `[min, max]`. Degenerate ranges report `0`. */
export function sliderValuePercent(
  value: number,
  min: number,
  max: number,
): number {
  const hi = max > min ? max : min;
  const range = hi - min;
  if (range <= 0) return 0;
  return ((clampSliderValue(value, min, max) - min) / range) * 100;
}

/**
 * Normalize a caller `value` (single or array) into a clamped
 * array of at least one entry. Non-finite entries fall back to
 * `min`. Snapping is deliberately NOT applied here: the displayed
 * value stays clamped-but-raw until a commit snaps it (a slider
 * that jumps on mount is a worse experience than one that snaps
 * on first commit). Never throws; empty arrays resolve to
 * `[min]`.
 */
export function normalizeSliderValues(
  value: number | readonly number[] | undefined,
  min: number,
  max: number,
): number[] {
  const list = Array.isArray(value) ? [...value] : [value];
  if (list.length === 0) return [min];
  return list.map((v) =>
    clampSliderValue(
      typeof v === "number" && Number.isFinite(v) ? v : min,
      min,
      max,
    ),
  );
}

/**
 * Ratio (0–1) of a touch location along the track extent. Vertical
 * sliders invert (track top is `max`).
 */
export function sliderRatioFromLocation(
  location: number,
  extent: number,
  orientation: SliderOrientation,
): number {
  if (!(extent > 0)) return 0;
  const ratio = location / extent;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  return orientation === "vertical" ? 1 - clamped : clamped;
}

/** Value at a track ratio. */
export function sliderValueFromRatio(
  ratio: number,
  min: number,
  max: number,
): number {
  const hi = max > min ? max : min;
  return min + Math.min(Math.max(ratio, 0), 1) * (hi - min);
}

/** Index of the entry nearest to `target` (ties go to the lower index). */
export function nearestSliderThumbIndex(
  values: readonly number[],
  target: number,
): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < values.length; i++) {
    const distance = Math.abs((values[i] ?? 0) - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/**
 * Commit transform: replace `values[index]` with `next` (clamped +
 * snapped), then enforce the `minStepsBetweenValues` gap against
 * neighbours (range sliders only — single values pass through).
 * Returns a new array; inputs are never mutated.
 */
export function resolveSliderCommit(
  values: readonly number[],
  index: number,
  next: number,
  options: SliderCommitOptions,
): number[] {
  const { min, max, step, minStepsBetweenValues } = options;
  const clamped = clampSliderValue(next, min, max);
  const snapped = clampSliderValue(
    snapSliderValue(clamped, min, step),
    min,
    max,
  );
  if (values.length < 2) return [snapped];
  const gapSteps = Math.max(0, minStepsBetweenValues);
  const gap = step > 0 && Number.isFinite(step) ? gapSteps * step : gapSteps;
  const updated = [...values];
  const at = Math.min(Math.max(index, 0), updated.length - 1);
  updated[at] = snapped;
  // Clamp against neighbours so thumbs never cross and always keep
  // the minimum gap (push-cascade stays unimplemented by design —
  // the dragged thumb stops at the gap instead of shoving siblings).
  const lower = at > 0 ? (updated[at - 1] ?? min) + gap : min;
  const upper = at < updated.length - 1 ? (updated[at + 1] ?? max) - gap : max;
  const lo = Math.min(lower, upper);
  const hi = Math.max(lower, upper);
  updated[at] = Math.min(Math.max(snapped, lo), hi);
  return updated;
}
