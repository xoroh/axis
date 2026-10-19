# Time model

Source of truth: `packages/axis/src/time.ts` in `@xoroh/axis`
(the `.` entry and the `./models` subpath export the same names).

RN-free time-value behavior: the value is always 24-hour internally
(`TimePickerValue`: `hours` 0–23, `minutes` 0–59), whatever the
picker renders. Display localizes; state never drifts. The model
never throws on caller input — unparseable text is `null`, garbage
steps fall back to `1`.

## API

| Export | Kind | Behavior |
|---|---|---|
| `normalizeTimeValue(value?, step?)` | function | Clamps to whole hours (0–23) and snaps minutes down onto the step grid. Missing values read as midnight. A step that does not divide 60 falls back to minute accuracy (visible in the data, not hidden). |
| `minutesForStep(step)` | function | Minute offsets for a step (0-based). Invalid steps yield all 60 minutes. |
| `formatTimeValue(value, format)` | function | Renders a 12h `{ hours, period }` or 24h `{ hours, period }` view of the 24-hour state. Presentation only — never stored. |
| `formatTimeParts(value, format?, locale?)` | function | Display-ready parts: localized digits plus, in 12h mode, the locale's day-period name (`AM`/`PM` for en-US). `period` is `null` in 24h mode. |
| `toTwentyFourHour(twelveHour, period)` | function | Converts a 12-hour choice back into 24-hour state. Round-trips `formatTimeValue` output. |
| `addTimeMinutes(value?, deltaMinutes, step?)` | function | Clocks arithmetic: steps forward/backward, wraps past midnight in both directions, then snaps down onto the step grid. |
| Types | — | `TimePickerValue`, `TimePickerFormat` (`"12h" \| "24h"`), `TimeParts`, `NumberFormatSpec` (`locale?`, `format?: Intl.NumberFormatOptions`). |

## Usage: stepping and localized display

```tsx
import {
  addTimeMinutes,
  formatTimeParts,
  normalizeTimeValue,
  type TimePickerValue,
} from "@xoroh/axis/models";

let state: TimePickerValue = normalizeTimeValue({ hours: 9, minutes: 30 });

// Stepper: +15 minutes, snapped to the grid.
state = addTimeMinutes(state, 15, 15); // 9:45

// Display: localized digits and day period.
const shown = formatTimeParts(state, "12h", "en-US");
// shown: { hours: "9", minutes: "45", period: "PM" }
```

Parsing back through the same locale is the number model's job
(`parseNumberValue` in `packages/axis/src/number.ts`); the time
model consumes plain `{ hours, minutes }` values.
