# Calendar model

Source of truth: `packages/axis/src/calendar.ts` in `@xoroh/axis`
(the `.` entry and the `./models` subpath export the same names).

RN-free month-grid date logic: month-grid generation, roving-focus
key mapping, min/max + `isDateDisabled`, single + range selection,
locale weekday/month names, locale week start, and `firstDayOfWeek`
/ `dir` handling. State ownership stays with the consumer (typically
`useControllableState` for the selected value and visible month);
this model never holds state, never touches React Native, and never
throws on caller input — invalid strings parse to `null`, invalid
month keys build an empty grid.

Date math uses plain `Date` UTC construction only (`new Date(
Date.UTC(y, m, d))`; no date library, no local-time mutation), so
DST transitions and month ends resolve exactly.

## API

| Export | Kind | Behavior |
|---|---|---|
| `parseCalendarDate(value)` | function | Strict ISO `yyyy-mm-dd` parse with a UTC round-trip guard (`2026-02-30` is rejected). `null` when invalid. |
| `parseCalendarMonth(value)` | function | Strict `yyyy-mm` parse. `null` when invalid. |
| `toCalendarDate(y, monthIndex, day)` | function | Formats an ISO date (zero-padded). |
| `toCalendarMonth(y, monthIndex)` | function | Formats a month key. |
| `daysInCalendarMonth(y, monthIndex)` | function | Month length via UTC overflow. |
| `shiftCalendarMonth(y, monthIndex, ±1)` | function | Month arithmetic without date construction (year rollover included). |
| `leadingBlankCount(y, monthIndex, firstDayOfWeek?)` | function | Leading blanks before the 1st, rotated to `firstDayOfWeek` (default Sunday). |
| `buildCalendarGrid(monthKey, options?)` | function | Week rows of seven (`CalendarCell \| null`, `null` = blank) plus rotated `weekdayNames`. Carries per-cell `disabled`, `selected`, and `range` (`"start" \| "inside" \| "end" \| null`). |
| `resolveCalendarFocus(iso, key, options?)` | function | Roving-focus mapping for `ArrowLeft/Right/Up/Down`, `Home`/`End`, `PageUp`/`PageDown`. Arrows cross month and year boundaries through DST-safe UTC arithmetic; `dir` swaps Left/Right; Home/End stay grid-local. `null` when invalid. |
| `resolveCalendarSelection(iso, options?)` | function | Single mode selects; range mode anchors on the first tap, completes ordered on the second, re-anchors on a tap with a complete range. Taps on disabled dates are a no-op (`null`). |
| `isCalendarDateDisabled(iso, options?)` | function | Whole-grid `disabled`, outside `[minDate, maxDate]`, or rejected by `isDateDisabled`. Invalid bounds are ignored. |
| `resolveCalendarWeekdayNames(locale?, firstDayOfWeek?)` | function | Seven short weekday names via `Intl`, rotated to `firstDayOfWeek` (English fallback when `Intl` is unavailable). |
| `resolveCalendarMonthNames(locale?, style?)` | function | Twelve month names in calendar order (`"long"` default; `"short"`, `"narrow"`). Formatted at UTC noon mid-month. English fallback when `Intl` is unavailable. |
| `resolveLocaleFirstDay(locale?)` | function | Locale-aware week start (0 = Sunday … 6 = Saturday). Prefers live `Intl.Locale` week info (`getWeekInfo()` or the `weekInfo` property); otherwise an embedded CLDR region table (Saturday-start and Friday-start regions listed, listed Sunday-start regions → 0, everything else → Monday, the CLDR root default). Region via `Intl.Locale.maximize()` when available, else a BCP-47 subtag parse. Never throws. Runtimes without week info (older Hermes, minimal-ICU Node) still resolve correctly through the table. |
| Types | — | `CalendarDateParts`, `CalendarMonthParts`, `CalendarCell`, `CalendarGrid`, `CalendarRange`, `CalendarRangePosition`, `CalendarKey`, `CalendarGridOptions`, `CalendarSelection`, `CalendarSelectionMode`, `CalendarDirection`, `FirstDayOfWeek`, `CalendarMonthNameStyle`. |

`CalendarGridOptions`: `firstDayOfWeek?` (default `0`), `locale?`
(default `"en-US"`), `minDate?`, `maxDate?`, `isDateDisabled?`,
`disabled?` (default `false`), `selected?`, `range?`.

## Usage: a host design system's DatePicker driving the model

The model owns the math; the design system owns state, styling, and
the host. A host `DatePicker` keeps the selected value and the
visible month in `useControllableState`, derives the grid, and maps
taps and keys back into state:

```tsx
import { useMemo, useState } from "react";
import {
  buildCalendarGrid,
  resolveCalendarFocus,
  resolveCalendarSelection,
  shiftCalendarMonth,
  toCalendarMonth,
  type CalendarKey,
  type CalendarRange,
} from "@xoroh/axis/models";

function KernDatePicker({ value, onValueChange }: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(
    toCalendarMonth(now.getUTCFullYear(), now.getUTCMonth()),
  );
  const [range, setRange] = useState<CalendarRange>(null);
  const grid = useMemo(
    () => buildCalendarGrid(month, { range, minDate: "2026-01-01" }),
    [month, range],
  );

  const tapDay = (iso: string) => {
    const selection = resolveCalendarSelection(iso, {
      mode: "range",
      range,
      minDate: "2026-01-01",
    });
    if (selection === null) return; // disabled day: no-op by contract
    setRange(selection.range);
    onValueChange(selection.value);
  };

  const moveFocus = (from: string, key: CalendarKey) => {
    const next = resolveCalendarFocus(from, key, { dir: "ltr" });
    if (next === null) return;
    // Move focus to the `next` cell; on Enter, tapDay(next).
  };

  const goMonth = (delta: 1 | -1) => {
    const parts = { year: 2026, monthIndex: 0 }; // parse `month` in real code
    const next = shiftCalendarMonth(parts.year, parts.monthIndex, delta);
    setMonth(toCalendarMonth(next.year, next.monthIndex));
  };

  return { grid, tapDay, moveFocus, goMonth };
}
```

Week start follows the locale: pass
`firstDayOfWeek: resolveLocaleFirstDay(locale)` (from `navigator.language`
or the app locale) into `buildCalendarGrid` instead of hard-coding Sunday.
