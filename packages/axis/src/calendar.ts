/**
 * Calendar behavior — month-grid date logic as pure functions.
 *
 * No React, no React Native: month-grid generation, roving-focus key
 * mapping, min/max + `isDateDisabled`, single + range selection,
 * locale weekday names, `firstDayOfWeek`, and `dir` live here. Moved
 * from the removed `Calendar` component (ADR-012) without rewriting
 * the date math — state ownership (controlled/uncontrolled value and
 * month) stays with consumers via `useControllableState`.
 *
 * Date math uses plain `Date` UTC construction only
 * (`new Date(Date.UTC(y, m, d))`; no date library). Nothing here
 * throws on caller input: invalid strings parse to `null`, invalid
 * month keys build an empty grid.
 */

export type CalendarDateParts = {
  year: number;
  monthIndex: number;
  day: number;
};

export type CalendarMonthParts = {
  year: number;
  monthIndex: number;
};

/** 0 = Sunday … 6 = Saturday (matches `getUTCDay`). */
export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CalendarDirection = "ltr" | "rtl";

export type CalendarSelectionMode = "single" | "range";

/** Inclusive range, ordered (`start <= end`). `null` for none. */
export type CalendarRange = { start: string; end: string } | null;

export type CalendarRangePosition = "start" | "end" | "inside" | null;

export type CalendarCell = {
  /** ISO `yyyy-mm-dd`. */
  iso: string;
  /** Day of month. */
  day: number;
  disabled: boolean;
  selected: boolean;
  range: CalendarRangePosition;
};

export type CalendarGrid = {
  /** Week rows of seven: day cells with `null` leading/trailing blanks. */
  weeks: Array<Array<CalendarCell | null>>;
  /** Seven weekday names, rotated to `firstDayOfWeek`. */
  weekdayNames: string[];
};

export type CalendarKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown";

export type CalendarGridOptions = {
  /** 0 = Sunday … 6 = Saturday. Default `0` (the removed component's grid). */
  firstDayOfWeek?: FirstDayOfWeek;
  /** BCP 47 locale for weekday names. Default `"en-US"`. */
  locale?: string;
  /** Earliest selectable date (ISO). Earlier days are disabled. */
  minDate?: string;
  /** Latest selectable date (ISO). Later days are disabled. */
  maxDate?: string;
  /** Extra per-day disable predicate. */
  isDateDisabled?: (iso: string) => boolean;
  /** Whole-grid terminal flag. Default `false`. */
  disabled?: boolean;
  /** Selected date (ISO) for single mode. */
  selected?: string | null;
  /** Active range for range mode. */
  range?: CalendarRange;
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

/** Sunday-first short names, matching `getUTCDay` order (the Intl fallback). */
const FALLBACK_WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Strict ISO date parse with a UTC round-trip guard (`2026-02-30`
 * constructs to March, so the mismatch rejects it). Returns `null`
 * for anything invalid — never throws.
 */
export function parseCalendarDate(
  value: string | null | undefined,
): CalendarDateParts | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE_PATTERN.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, monthIndex: month - 1, day };
}

/** Strict month-key parse. Returns `null` for anything invalid — never throws. */
export function parseCalendarMonth(
  value: string | null | undefined,
): CalendarMonthParts | null {
  if (typeof value !== "string") return null;
  const match = MONTH_PATTERN.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, monthIndex: month - 1 };
}

export function toCalendarDate(
  year: number,
  monthIndex: number,
  day: number,
): string {
  return `${String(year).padStart(4, "0")}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function toCalendarMonth(year: number, monthIndex: number): string {
  return `${String(year).padStart(4, "0")}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/** Month length via UTC overflow: day 0 of the next month is the last day of this one. */
export function daysInCalendarMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Month arithmetic without date construction — plain year/month rollover. */
export function shiftCalendarMonth(
  year: number,
  monthIndex: number,
  delta: 1 | -1,
): CalendarMonthParts {
  const total = year * 12 + monthIndex + delta;
  const nextYear = Math.floor(total / 12);
  return { year: nextYear, monthIndex: total - nextYear * 12 };
}

/** Leading blanks before the 1st, rotated to `firstDayOfWeek`. */
export function leadingBlankCount(
  year: number,
  monthIndex: number,
  firstDayOfWeek: FirstDayOfWeek = 0,
): number {
  const sundayFirst = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  return (sundayFirst - firstDayOfWeek + 7) % 7;
}

/**
 * Seven short weekday names starting at `firstDayOfWeek`, via `Intl`
 * (`short` weekday over a known Sunday-start week). Falls back to the
 * Sunday-first `Su…Sa` labels when `Intl` is unavailable — never throws.
 */
export function resolveCalendarWeekdayNames(
  locale: string = "en-US",
  firstDayOfWeek: FirstDayOfWeek = 0,
): string[] {
  let names = FALLBACK_WEEKDAY_NAMES;
  try {
    const format = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    });
    names = Array.from({ length: 7 }, (_, i) =>
      format.format(new Date(Date.UTC(2026, 5, 7 + i))),
    );
  } catch {
    names = FALLBACK_WEEKDAY_NAMES;
  }
  return [...names.slice(firstDayOfWeek), ...names.slice(0, firstDayOfWeek)];
}

function validBound(value: string | undefined): string | null {
  return parseCalendarDate(value) !== null && typeof value === "string"
    ? value
    : null;
}

/**
 * Whether an ISO date is unselectable: whole-grid `disabled`, outside
 * `[minDate, maxDate]`, or rejected by `isDateDisabled`. Invalid bounds
 * are ignored (never throw on caller input).
 */
export function isCalendarDateDisabled(
  iso: string,
  options: Pick<
    CalendarGridOptions,
    "minDate" | "maxDate" | "isDateDisabled" | "disabled"
  > = {},
): boolean {
  const { minDate, maxDate, isDateDisabled, disabled = false } = options;
  if (disabled) return true;
  const min = validBound(minDate);
  const max = validBound(maxDate);
  if (min !== null && iso < min) return true;
  if (max !== null && iso > max) return true;
  return isDateDisabled?.(iso) === true;
}

/**
 * Month grid for a month key: week rows of seven with `null` leading
 * blanks, day cells carrying selection, range, and disabled state.
 * An invalid month key builds an empty grid — never throws.
 */
export function buildCalendarGrid(
  monthKey: string,
  options: CalendarGridOptions = {},
): CalendarGrid {
  const {
    firstDayOfWeek = 0,
    locale = "en-US",
    selected = null,
    range = null,
  } = options;
  const weekdayNames = resolveCalendarWeekdayNames(locale, firstDayOfWeek);
  const parts = parseCalendarMonth(monthKey);
  if (parts === null) return { weeks: [], weekdayNames };
  const dayCount = daysInCalendarMonth(parts.year, parts.monthIndex);
  const blanks = leadingBlankCount(
    parts.year,
    parts.monthIndex,
    firstDayOfWeek,
  );
  const cells: Array<CalendarCell | null> = [];
  for (let i = 0; i < blanks; i += 1) cells.push(null);
  for (let day = 1; day <= dayCount; day += 1) {
    const iso = toCalendarDate(parts.year, parts.monthIndex, day);
    const disabled = isCalendarDateDisabled(iso, options);
    const inRange = range !== null && iso >= range.start && iso <= range.end;
    cells.push({
      iso,
      day,
      disabled,
      selected: selected !== null && iso === selected,
      range:
        range === null || !inRange
          ? null
          : iso === range.start && iso === range.end
            ? "start"
            : iso === range.start
              ? "start"
              : iso === range.end
                ? "end"
                : "inside",
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<CalendarCell | null>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return { weeks, weekdayNames };
}

function clampDay(year: number, monthIndex: number, day: number): number {
  return Math.min(Math.max(1, day), daysInCalendarMonth(year, monthIndex));
}

/**
 * Roving-focus key mapping: the next focused ISO date for a grid key.
 * Arrows move within the week (`±1`, row `±7`); `dir` swaps Left/Right.
 * Home/End jump to the visual row edges (honoring `firstDayOfWeek`);
 * PageUp/PageDown move the same day across months (clamped to the
 * month length). Returns `null` for invalid input — never throws.
 */
export function resolveCalendarFocus(
  currentISO: string | null | undefined,
  key: CalendarKey,
  options: {
    firstDayOfWeek?: FirstDayOfWeek;
    dir?: CalendarDirection;
  } = {},
): string | null {
  const { firstDayOfWeek = 0, dir = "ltr" } = options;
  const parts = parseCalendarDate(currentISO);
  if (parts === null) return null;
  const { year, monthIndex, day } = parts;
  switch (key) {
    case "ArrowLeft":
      return toCalendarDate(
        year,
        monthIndex,
        clampDay(year, monthIndex, day + (dir === "rtl" ? 1 : -1)),
      );
    case "ArrowRight":
      return toCalendarDate(
        year,
        monthIndex,
        clampDay(year, monthIndex, day + (dir === "rtl" ? -1 : 1)),
      );
    case "ArrowUp":
      return toCalendarDate(
        year,
        monthIndex,
        clampDay(year, monthIndex, day - 7),
      );
    case "ArrowDown":
      return toCalendarDate(
        year,
        monthIndex,
        clampDay(year, monthIndex, day + 7),
      );
    case "Home":
    case "End": {
      // Visual row edges: the row starts `offset` days after the
      // month's first cell alignment.
      const blanks = leadingBlankCount(year, monthIndex, firstDayOfWeek);
      const rowStart = day - ((day - 1 + blanks) % 7);
      const rowEnd = Math.min(
        rowStart + 6,
        daysInCalendarMonth(year, monthIndex),
      );
      const target = key === "Home" ? rowStart : rowEnd;
      return toCalendarDate(
        year,
        monthIndex,
        clampDay(year, monthIndex, target),
      );
    }
    case "PageUp":
    case "PageDown": {
      const next = shiftCalendarMonth(
        year,
        monthIndex,
        key === "PageUp" ? -1 : 1,
      );
      return toCalendarDate(
        next.year,
        next.monthIndex,
        clampDay(next.year, next.monthIndex, day),
      );
    }
  }
}

export type CalendarSelection = {
  /** Single-mode value (and the latest tapped date in range mode). */
  value: string | null;
  /** Range-mode range (`null` until two taps complete it). */
  range: CalendarRange;
};

/**
 * Selection resolution for a tapped ISO date. Single mode selects it.
 * Range mode: the first tap anchors `start`, the second tap completes
 * the ordered range, a tap with a complete range re-anchors. A tap on a
 * disabled date is a no-op (`null`) — never throws.
 */
export function resolveCalendarSelection(
  iso: string,
  options: {
    mode?: CalendarSelectionMode;
    value?: string | null;
    range?: CalendarRange;
  } & Pick<
    CalendarGridOptions,
    "minDate" | "maxDate" | "isDateDisabled" | "disabled"
  > = {},
): CalendarSelection | null {
  const { mode = "single", range = null } = options;
  if (parseCalendarDate(iso) === null) return null;
  if (isCalendarDateDisabled(iso, options)) return null;
  if (mode === "single") return { value: iso, range };
  if (range === null || range.start !== range.end) {
    // No anchor yet, or a completed range: the tap (re-)anchors.
    return { value: iso, range: { start: iso, end: iso } };
  }
  const start = range.start <= iso ? range.start : iso;
  const end = range.start <= iso ? iso : range.start;
  return { value: iso, range: { start, end } };
}
