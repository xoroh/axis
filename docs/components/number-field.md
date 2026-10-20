## Number Field

Numeric entry with steppers and drag-scrub, in Base UI compound
parts: `NumberFieldRoot` (state) + `NumberFieldGroup` (input flanked
by steppers) + `NumberFieldInput` (text entry) +
`NumberFieldDecrement` / `NumberFieldIncrement` (press-and-hold
steppers with auto-repeat) + `NumberFieldScrubArea` (drag to scrub).

Source of truth: `NumberFieldRootProps` and friends in `@xoroh/axis`
(`packages/axis/src/components/NumberField.tsx`); the locale math
lives in the `number` model (`packages/axis/src/number.ts`).

State follows the controlled + uncontrolled pattern throughout:
`value?: number | null` (`null` = empty; wins over
`defaultValue?`), `onValueChange?` (fires with the next value on
typing or stepping), `onValueCommitted?` (fires with the current
value on input blur, stepper release after stepping, or scrub-drag
release after stepping). `min?`, `max?` (stepped and scrubbed
results clamp; typed text reformats and clamps on blur),
`step?: number` (default 1; values `<= 0` fall back to 1),
`snapOnStep?: boolean` (default `false`; stepped results snap to
the step grid), `disabled?` (terminal: no entry, no stepping, no
callbacks; announced as disabled), `readOnly?` (terminal like
`disabled` but never announced as disabled — without Form the
distinction is announcement only), `locale?` (defaults to runtime
locale), `format?: Intl.NumberFormatOptions` (display formatting;
typing parses back through the same locale). Invalid text parses
to `null`. All optional.

Base UI parts with no native counterpart are omitted, each with
its reason (never silently): `smallStep` / `largeStep` (alt/shift +
arrows have no touch equivalent), `allowWheelScrub` (mouse wheel),
`required` / `name` / `form` / `inputRef` / `id` (form submission —
Axis has no Form yet; each part owns its own ref), `step="any"`
(no native step validation; behaviorally identical to `1`),
`ScrubAreaCursor` / `teleportDistance` (no Pointer Lock or cursor
on touch), `onValueChange`/`onValueCommitted` `eventDetails`
objects (the Axis contract keeps event objects off the boundary).
`data-*` attributes are deliberately absent on native — state flows
through `render`/`style` functions instead (contract §11, parity
D1). See `docs/BASE_UI_PARITY.md` for the per-family parity record.

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `NumberFieldRoot` | `NumberField.Root` | State owner (renders no element). |
| `NumberFieldGroup` | `NumberField.Group` | Adjustable host: steppers flank the input; `increment`/`decrement` accessibility actions step. |
| `NumberFieldInput` | `NumberField.Input` | Text entry (Axis `Input` + blur commit). |
| `NumberFieldDecrement` | `NumberField.Decrement` | Stepper with press-and-hold auto-repeat (400 ms delay, 100 ms interval). Children are caller visuals (default `-`); the accessible name defaults to `"Decrement"`. |
| `NumberFieldIncrement` | `NumberField.Increment` | Stepper with press-and-hold auto-repeat. Children are caller visuals (default `+`); the accessible name defaults to `"Increment"`. |
| `NumberFieldScrubArea` | `NumberField.ScrubArea` | Drag-scrub host (`direction?` default `"horizontal"`; `pixelSensitivity?` default 2 px per step). No keyboard/cursor chrome. |

There is no monolith: the removed `<NumberField … />` migrates to
the compound (see CHANGELOG).

### Props

#### `NumberFieldRoot`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `number \| null` | no | — | Controlled numeric value (`null` = empty). Wins over `defaultValue`. |
| `defaultValue` | `number \| null` | no | `null` | Uncontrolled initial value. |
| `onValueChange` | `(value: number \| null) => void` | no | — | Fires with the next value on every committed change. |
| `onValueCommitted` | `(value: number \| null) => void` | no | — | Fires with the current value on blur, stepper release after stepping, or scrub release after stepping. |
| `min` | `number` | no | — | Minimum value; stepped/scrubbed results clamp here. |
| `max` | `number` | no | — | Maximum value; stepped/scrubbed results clamp here. |
| `step` | `number` | no | `1` | Step increment; `<= 0` falls back to `1`. |
| `snapOnStep` | `boolean` | no | `false` | Snap stepped results to the step grid. |
| `disabled` | `boolean` | no | `false` | Terminal: no entry, stepping, or callbacks; announced as disabled. |
| `readOnly` | `boolean` | no | `false` | Terminal like `disabled`, never announced as disabled. |
| `locale` | `string` | no | runtime | BCP 47 locale for display and parsing. |
| `format` | `Intl.NumberFormatOptions` | no | — | Display formatting options. |
| `children` | `ReactNode` | no | — | Field content: group, scrub area, or both in any arrangement. |

`NumberFieldState`: `{ value: number | null; inputValue: string; disabled: boolean; readOnly: boolean; scrubbing: boolean }` —
the formatted text mirror, terminal flags, and whether a scrub drag
is in progress. Every part takes the same state object in its
`render`/`style` functions.

`NumberFieldGroup` takes `style?`, `render?`, `testID?`, `ref?` (plus
`children?`); the adjustable role, increment/decrement actions, and
step wiring stay on the part. `NumberFieldInput` takes
`placeholder?`, `accessibilityLabel?`, `testID?`, `style?`,
`render?`, `ref?`. `NumberFieldDecrement`/`NumberFieldIncrement`
take `children?` (caller visuals), `accessibilityLabel?` (defaults
`"Decrement"`/`"Increment"`), `testID?`, `style?`, `render?`,
`ref?`. `NumberFieldScrubArea` takes `direction?` (default
`"horizontal"`), `pixelSensitivity?` (default 2), `children?`,
`testID?`, `style?`, `render?`, `ref?`.

### Examples

Minimal compound stepper:

```tsx
import { Text } from "react-native";
import {
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
} from "@xoroh/axis";

function Quantity() {
  return (
    <NumberFieldRoot defaultValue={42}>
      <NumberFieldGroup>
        <NumberFieldDecrement>
          <Text>-</Text>
        </NumberFieldDecrement>
        <NumberFieldInput aria-label="Quantity" />
        <NumberFieldIncrement>
          <Text>+</Text>
        </NumberFieldIncrement>
      </NumberFieldGroup>
    </NumberFieldRoot>
  );
}
```

Controlled with commit handling and locale formatting:

```tsx
import { useState } from "react";
import { NumberFieldGroup, NumberFieldInput, NumberFieldRoot } from "@xoroh/axis";

function Price() {
  const [value, setValue] = useState<number | null>(19.99);
  return (
    <NumberFieldRoot
      value={value}
      onValueChange={setValue}
      onValueCommitted={(v) => console.log(v)}
      min={0}
      locale="de-DE"
    >
      <NumberFieldGroup>
        <NumberFieldInput aria-label="Price" />
      </NumberFieldGroup>
    </NumberFieldRoot>
  );
}
```

Drag-scrub strip:

```tsx
import { Text } from "react-native";
import { NumberFieldRoot, NumberFieldScrubArea } from "@xoroh/axis";

function Scrubber() {
  return (
    <NumberFieldRoot defaultValue={0} min={0} max={100}>
      <NumberFieldScrubArea direction="horizontal" pixelSensitivity={4}>
        <Text>Scrub horizontally to change</Text>
      </NumberFieldScrubArea>
    </NumberFieldRoot>
  );
}
```

### Accessibility

- The group is an accessibility element carrying the `adjustable`
  role with `increment` and `decrement` actions, so screen-reader
  users step without locating the buttons — gesture parity for the
  steppers and the scrub area alike.
- Steppers are `button`-role hosts with caller-overridable
  accessible names (defaults `"Decrement"` / `"Increment"`); the
  terminal group announces `disabled`, while `readOnly` never does.
- Typing parses through the field locale; blur reformats and
  commits, so the announced value always matches the stored one.

### Composition

Every part takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function) and
value-or-function `style` over the shared state object; the root
renders no element and owns state via context. Verified by the
number-field RNTL suites (38 tests — `docs/COVERAGE.md`) plus the
number model suite. Renders in
`apps/example/src/demos/entry.tsx`.
