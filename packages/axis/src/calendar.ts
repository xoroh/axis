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

/** Month-name length for `resolveCalendarMonthNames`. */
export type CalendarMonthNameStyle = "long" | "short" | "narrow";

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
 * Twelve month names for a locale, in calendar order.
 * Formatted at UTC noon mid-month so neither DST edges nor month ends
 * can shift the read. Falls back to English on missing `Intl` —
 * never throws.
 */
export function resolveCalendarMonthNames(
  locale: string = "en-US",
  style: CalendarMonthNameStyle = "long",
): string[] {
  const fallback = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  try {
    const format = new Intl.DateTimeFormat(locale, {
      month: style,
      timeZone: "UTC",
    });
    return Array.from({ length: 12 }, (_, monthIndex) =>
      format.format(new Date(Date.UTC(2026, monthIndex, 15, 12))),
    );
  } catch {
    return fallback;
  }
}

/**
 * Locale-aware week start (0 = Sunday … 6 = Saturday).
 *
 * An explicit Unicode `-u-fw-` extension wins over everything else.
 * Otherwise prefers live `Intl.Locale` week info — `getWeekInfo()` or
 * the `weekInfo` property when either exists (`firstDay` numbers days
 * 1 = Monday … 7 = Sunday). Otherwise falls back to an embedded
 * region table (CLDR supplemental weekData, firstDay only):
 * Saturday-start and Friday-start regions are listed; the listed
 * Sunday-start regions return 0; every other or unknown region
 * returns 1 (Monday, the CLDR `001` root default). The region resolves
 * via `Intl.Locale.maximize()` when available, then a bare-language
 * likely-region map (CLDR likelySubtags), then a plain BCP-47 subtag
 * parse as the last resort. Never throws.
 */
export function resolveLocaleFirstDay(
  locale: string = "en-US",
): FirstDayOfWeek {
  const override = fwExtensionFirstDay(locale);
  if (override !== undefined) return override;
  const live = liveWeekInfoFirstDay(locale);
  if (live !== undefined) return live;
  return tableFirstDay(regionOfLocale(locale));
}

/**
 * Unicode `-u-fw-` day override (`mon` … `sun`), e.g.
 * `en-GB-u-fw-sun`. An explicit author choice beats locale data.
 * Returns `undefined` when the tag carries no `fw` value.
 */
function fwExtensionFirstDay(locale: string): FirstDayOfWeek | undefined {
  const subtags = String(locale).toLowerCase().replace(/_/g, "-").split("-");
  const uIndex = subtags.indexOf("u");
  if (uIndex === -1) return undefined;
  // The Unicode extension runs to the next singleton (or the end);
  // inside it, `fw` is a key whose value names the first day.
  const section: string[] = [];
  for (let i = uIndex + 1; i < subtags.length; i++) {
    const sub = subtags[i];
    if (sub === undefined || sub.length < 2) break;
    section.push(sub);
  }
  const keyIndex = section.indexOf("fw");
  const value = keyIndex === -1 ? undefined : section[keyIndex + 1];
  switch (value) {
    case "mon":
      return 1;
    case "tue":
      return 2;
    case "wed":
      return 3;
    case "thu":
      return 4;
    case "fri":
      return 5;
    case "sat":
      return 6;
    case "sun":
      return 0;
    default:
      return undefined;
  }
}

/** `firstDay` from live `Intl.Locale` week info, or `undefined`. */
function liveWeekInfoFirstDay(locale: string): FirstDayOfWeek | undefined {
  try {
    const Ctor = Intl.Locale as
      | (new (
          tag: string,
        ) => {
          getWeekInfo?: () => { firstDay?: unknown };
          weekInfo?: { firstDay?: unknown };
        })
      | undefined;
    if (typeof Ctor !== "function") return undefined;
    const loc = new Ctor(locale);
    const fromMethod =
      typeof loc.getWeekInfo === "function" ? loc.getWeekInfo() : undefined;
    const info = fromMethod ?? loc.weekInfo;
    const firstDay =
      info !== null && typeof info === "object"
        ? (info as { firstDay?: unknown }).firstDay
        : undefined;
    if (
      typeof firstDay === "number" &&
      Number.isInteger(firstDay) &&
      firstDay >= 1 &&
      firstDay <= 7
    ) {
      return (((firstDay % 7) + 7) % 7) as FirstDayOfWeek;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Region tables (CLDR v48, supplemental weekData firstDay).
 * Saturday lists every firstDay-sat region; Friday lists every
 * firstDay-fri region (Maldives only); Sunday lists every
 * firstDay-sun region except the `GB-alt-variant` alias. Unlisted
 * regions fall to Monday (the CLDR `001` root default).
 */

/** Saturday-start regions (CLDR weekData firstDay). */
const SATURDAY_START = new Set([
  "AF",
  "BH",
  "DJ",
  "DZ",
  "EG",
  "IQ",
  "IR",
  "JO",
  "KW",
  "LY",
  "OM",
  "QA",
  "SD",
  "SY",
]);

/** Friday-start regions (CLDR weekData firstDay: Maldives only). */
const FRIDAY_START = new Set(["MV"]);

/** Sunday-start regions (CLDR weekData firstDay). */
const SUNDAY_START = new Set([
  "AG",
  "AS",
  "BD",
  "BR",
  "BS",
  "BT",
  "BW",
  "BZ",
  "CA",
  "CO",
  "DM",
  "DO",
  "ET",
  "GT",
  "GU",
  "HK",
  "HN",
  "ID",
  "IL",
  "IN",
  "IS",
  "JM",
  "JP",
  "KE",
  "KH",
  "KR",
  "LA",
  "MH",
  "MM",
  "MO",
  "MT",
  "MX",
  "MZ",
  "NI",
  "NP",
  "PA",
  "PE",
  "PH",
  "PK",
  "PR",
  "PT",
  "PY",
  "SA",
  "SG",
  "SV",
  "TH",
  "TT",
  "TW",
  "UM",
  "US",
  "VE",
  "VI",
  "WS",
  "YE",
  "ZA",
  "ZW",
]);

function tableFirstDay(region: string | undefined): FirstDayOfWeek {
  if (region !== undefined) {
    if (SATURDAY_START.has(region)) return 6;
    if (FRIDAY_START.has(region)) return 5;
    if (SUNDAY_START.has(region)) return 0;
  }
  return 1;
}

/**
 * Likely region for a locale tag: `Intl.Locale.maximize()` when
 * available, then the bare-language likely-region map (CLDR
 * likelySubtags), then the first 2-letter or 3-digit BCP-47 subtag
 * after the language (uppercased). `undefined` when none is found.
 */
const LIKELY_REGION: Record<string, string> = {
  ar: "EG",
  en: "US",
  es: "ES",
  fa: "IR",
  he: "IL",
  hi: "IN",
  id: "ID",
  ja: "JP",
  ko: "KR",
  pt: "BR",
  th: "TH",
  zh: "CN",
};

function regionOfLocale(locale: string): string | undefined {
  try {
    const Ctor = Intl.Locale as
      | (new (
          tag: string,
        ) => {
          maximize?: () => { region?: unknown };
        })
      | undefined;
    if (typeof Ctor === "function") {
      const region = new Ctor(locale).maximize?.().region;
      if (typeof region === "string" && region !== "") {
        return region.toUpperCase();
      }
    }
  } catch {
    // Invalid tag or no maximize — fall through to the parses below.
  }
  const parts = String(locale).replace(/_/g, "-").split("-");
  const language = parts[0]?.toLowerCase();
  if (parts.length === 1 && language !== undefined) {
    const likely = LIKELY_REGION[language];
    if (likely !== undefined) return likely;
  }
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (
      part !== undefined &&
      (/^[A-Za-z]{2}$/.test(part) || /^[0-9]{3}$/.test(part))
    ) {
      return part.toUpperCase();
    }
  }
  return undefined;
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
 * Day arithmetic in UTC — the DST-safe primitive. Local-time mutation
 * (`setDate`/`setHours`) skips or repeats days across DST transitions;
 * UTC construction has no DST, so month ends and DST weekends resolve
 * exactly. Never throws: callers validate first.
 */
function shiftCalendarDay(
  year: number,
  monthIndex: number,
  day: number,
  deltaDays: number,
): CalendarDateParts {
  const shifted = new Date(Date.UTC(year, monthIndex, day + deltaDays));
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

/**
 * Roving-focus key mapping: the next focused ISO date for a grid key.
 * Arrows move within the week (`±1`) and across rows (`±7`), crossing
 * month (and year) boundaries through DST-safe UTC arithmetic — no
 * clamping at month ends, so grids that paint outside days stay
 * reachable. `dir` swaps Left/Right. Home/End jump to the visual row
 * edges and stay grid-local (clamped to the visible month).
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
    case "ArrowRight": {
      const step = key === "ArrowLeft" ? -1 : 1;
      const next = shiftCalendarDay(
        year,
        monthIndex,
        day,
        dir === "rtl" ? -step : step,
      );
      return toCalendarDate(next.year, next.monthIndex, next.day);
    }
    case "ArrowUp":
    case "ArrowDown": {
      const next = shiftCalendarDay(
        year,
        monthIndex,
        day,
        key === "ArrowUp" ? -7 : 7,
      );
      return toCalendarDate(next.year, next.monthIndex, next.day);
    }
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
