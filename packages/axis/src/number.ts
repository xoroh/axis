/**
 * Number field behavior — locale-aware parse/format and step math as
 * pure functions. No React, no React Native.
 *
 * The value is always a plain `number` (or `null` for empty) whatever
 * the input renders. Formatting is display-only: typing parses back
 * through the same locale, so a formatted value never drifts from the
 * state it represents. Nothing here throws on caller input.
 */

export type NumberFormatSpec = {
  /** BCP 47 locale for grouping/decimal separators. Defaults to runtime locale. */
  locale?: string;
  /** `Intl.NumberFormat` options for display. */
  format?: Intl.NumberFormatOptions;
};

/**
 * Format a value for display. `null` renders empty. Falls back to
 * `String(value)` when `Intl` is unavailable — never throws.
 */
export function formatNumberValue(
  value: number | null,
  spec: NumberFormatSpec = {},
): string {
  if (value === null || !Number.isFinite(value)) return "";
  const { locale, format } = spec;
  try {
    return new Intl.NumberFormat(locale, format).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Parse display text back to a number through the same locale:
 * grouping separators are stripped, the locale decimal separator is
 * mapped to `.`. Returns `null` for empty or unparseable text —
 * never throws.
 */
export function parseNumberValue(
  text: string | null | undefined,
  spec: NumberFormatSpec = {},
): number | null {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (trimmed === "") return null;
  let decimal = ".";
  let grouping = ",";
  try {
    const parts = new Intl.NumberFormat(
      spec.locale,
      spec.format !== undefined
        ? { ...spec.format, useGrouping: true }
        : undefined,
    ).formatToParts(12345.6);
    for (const part of parts) {
      if (part.type === "decimal") decimal = part.value;
      if (part.type === "group") grouping = part.value;
    }
  } catch {
    // Intl unavailable: fall back to '.' decimal and ',' grouping.
  }
  // Strip grouping (and spaces, a common grouping in fr-style locales),
  // then normalize the decimal separator for parseFloat.
  const compact = trimmed.split(" ").join("").split(" ").join("");
  const noGrouping =
    grouping === "" ? compact : compact.split(grouping).join("");
  const normalized =
    decimal === "." ? noGrouping : noGrouping.split(decimal).join(".");
  // Reject anything parseFloat would partially accept ("12abc" → 12):
  // the whole normalized text must be numeric.
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(normalized)) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Clamp into `[min, max]`; undefined bounds are open. */
export function clampNumberValue(
  value: number,
  min?: number,
  max?: number,
): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

/**
 * Step from a value by `direction`, snapping to the step grid when
 * `snapOnStep` is set, then clamping to `[min, max]`.
 */
export function stepNumberValue(
  value: number,
  direction: 1 | -1,
  options: {
    step?: number;
    snapOnStep?: boolean;
    min?: number;
    max?: number;
  } = {},
): number {
  const { step = 1, snapOnStep = false, min, max } = options;
  const effective = step > 0 && Number.isFinite(step) ? step : 1;
  const raw = value + direction * effective;
  const snapped =
    snapOnStep && effective > 0 ? Math.round(raw / effective) * effective : raw;
  // Counteract binary float dust from snapping (0.3 → 0.30000000000000004).
  const clean =
    snapOnStep && effective > 0 ? Number(snapped.toPrecision(12)) : snapped;
  return clampNumberValue(clean, min, max);
}
