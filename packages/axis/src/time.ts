/**
 * Time picker value normalisation — the substantive contract, as pure logic.
 *
 * The value is ALWAYS 24-hour internally, whatever the picker renders. Choosing
 * "3 PM" reports `hours: 15`; re-opening in 24-hour mode shows `15`. A picker
 * that kept 12-hour state would drift the moment a consumer persisted it, and
 * the drift would be invisible until someone compared two records.
 *
 * `step` is the minute granularity and must divide 60. A step that does not
 * falls back to 1 rather than silently producing minutes no control could have
 * produced — and the reported value is then minute-accurate, so the fallback is
 * visible in the data rather than hidden in the rendering.
 */

export type TimePickerValue = {
  /** 0–23. Always 24-hour internally, whatever is rendered. */
  hours: number;
  /** 0–59. */
  minutes: number;
};

export type TimePickerFormat = "12h" | "24h";

/**
 * Minute options for a step, as 0-based offsets from the hour.
 *
 * A valid step is a POSITIVE INTEGER that divides 60. The integer requirement
 * matters on its own: 60/1.5 is exactly 40, so a divisibility test alone
 * accepts 1.5 and yields fractional minutes (0, 1.5, 3.0…) that no picker can
 * display. Falls back to 1 rather than shipping 18:75.
 */
export function minutesForStep(step: number): readonly number[] {
  const valid =
    Number.isInteger(step) && step > 0 && Number.isInteger(60 / step);
  if (!valid) {
    return Array.from({ length: 60 }, (_, i) => i);
  }
  return Array.from({ length: 60 / step }, (_, i) => i * step);
}

/** Clamp to a whole hour: hours into 0–23, minutes onto the step grid. */
export function normalizeTimeValue(
  value: Partial<TimePickerValue> | undefined,
  step = 1,
): TimePickerValue {
  const options = minutesForStep(step);
  const hours = Number.isFinite(value?.hours)
    ? Math.min(Math.max(Math.trunc(value?.hours ?? 0), 0), 23)
    : 0;
  const rawMinutes = Number.isFinite(value?.minutes)
    ? Math.trunc(value?.minutes ?? 0)
    : 0;
  // Snap DOWN onto the grid rather than up: "3:45" with a 15-minute step
  // becomes 3:30, not 4:00 — advancing the value the user did not ask for is
  // worse than dropping the remainder they cannot select anyway.
  let minutes = 0;
  for (const option of options) {
    if (option <= rawMinutes) minutes = option;
  }
  return { hours, minutes };
}

/** The value `format` renders, derived from the 24-hour state. Never stored. */
export function formatTimeValue(
  value: TimePickerValue,
  format: TimePickerFormat,
): { hours: number; period: "AM" | "PM" } {
  const normalised = normalizeTimeValue(value);
  if (format === "24h") {
    return {
      hours: normalised.hours,
      period: normalised.hours < 12 ? "AM" : "PM",
    };
  }
  const twelve = normalised.hours % 12 === 0 ? 12 : normalised.hours % 12;
  return { hours: twelve, period: normalised.hours < 12 ? "AM" : "PM" };
}

/** Convert a 12-hour choice back into the 24-hour state it represents. */
export function toTwentyFourHour(
  twelveHour: number,
  period: "AM" | "PM",
): number {
  const base = twelveHour % 12;
  return period === "PM" ? base + 12 : base;
}
