## Slider

Range input with compound parts: a `SliderRoot` owning the
value domain, with `SliderLabel` (accessible name text) and
`SliderValue` (current value text) composed around a
`SliderControl` (the interactive surface: drag gestures,
track-press jumps, measurement) containing a `SliderTrack`
(the range container), `SliderIndicator` (the data-driven fill
from the lowest to the highest value), and one `SliderThumb`
per value (adjustable, increment/decrement actions). No default
visuals — every visual value is caller-provided; only
state-driven geometry (fill width, thumb position) is
structural. State follows the controlled + uncontrolled
pattern throughout: `value` (plus `onValueChange`) for
controlled use, `defaultValue` for uncontrolled (default
`[min]`).

Single value or range: `value` accepts a number or an array;
one `SliderThumb` per array entry (`index` selects). Commits
clamp into `[min, max]`, snap to `step` when `step > 0`
(continuous otherwise — the Axis default `0`, a documented
deviation from Base UI's `1`), and enforce the
`minStepsBetweenValues` gap between range entries (the dragged
thumb stops at the gap; no push cascade). Dragging reports
through `onValueChange`; release, track-press settle, and
accessibility actions additionally report through
`onValueCommitted`.

No animation: the fill tracks state synchronously (the Dialog
precedent). No `loopFocus`/roving tabindex (no roving layer);
the thumbs are independently focusable adjustable elements.
The RN math (clamp, snap, percent, range handling) lives in
`./models` (`slider.ts`) with unit tests.

Source of truth: `SliderRootProps`, `SliderRootState`,
`SliderLabelProps`, `SliderLabelState`, `SliderValueProps`,
`SliderValueState`, `SliderControlProps`,
`SliderControlState`, `SliderTrackProps`,
`SliderTrackState`, `SliderIndicatorProps`,
`SliderIndicatorState`, `SliderThumbProps`,
`SliderThumbState` in `@xoroh/axis`
(`packages/axis/src/components/Slider.tsx`); math in
`packages/axis/src/slider.ts`.

### Install

`@xoroh/axis` is not on npm yet (version `0.0.0`; releases are
owner-gated — `docs/RELEASING.md`). Install from source with the
repo's pack-vendor script, the same flow Kern uses to vendor Axis:

```sh
git clone https://github.com/xoroh/axis.git
cd axis
bun install --frozen-lockfile
node scripts/pack-vendor.mjs --out /tmp/axis-vendor
# prints /tmp/axis-vendor/axis-<short-sha>.tgz + sha512
```

Then add the printed tarball to your app (peers `react >= 18`,
`react-native >=0.86 <0.89`):

```sh
bun add /tmp/axis-vendor/axis-<short-sha>.tgz react react-native
```

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `SliderRoot` | `Slider.Root` | State owner (`value`/`defaultValue`/`onValueChange`/`onValueCommitted`, `min`/`max`/`step`/`largeStep`/`minStepsBetweenValues`, `orientation`, `thumbAlignment`, terminal `disabled`). Renders the root container. |
| `SliderLabel` | `Slider.Label` | Accessible-name text. |
| `SliderValue` | `Slider.Value` | Current-value text (node or function of values). |
| `SliderControl` | `Slider.Control` | Interactive surface: drag gestures, track-press jumps, measurement. |
| `SliderTrack` | `Slider.Track` | Range container. |
| `SliderIndicator` | `Slider.Indicator` | Data-driven fill (from the lowest to the highest value). |
| `SliderThumb` | `Slider.Thumb` | Draggable handle per value index (`adjustable` role, `increment`/`decrement` actions). |

Omitted Base UI pieces are documented deviations, not
oversights: no `name`/`form`/`inputRef`/`id`/`tabIndex`
(no `Form` owner, no DOM inputs — native forms are
caller-owned); no `getAriaLabel`/`getAriaValueText`
(no `Intl` layer — caller text and `accessibilityLabel`
instead); no `locale`/`format` (no `Intl` — caller formats
through `SliderValue` function children); no
`thumbCollisionBehavior`/`loopFocus` (no roving layer; dragged
thumbs clamp at the gap instead of pushing); `step` defaults
`0` (continuous) where Base UI defaults `1`; no `keepMounted`
(D3); no `data-*` attributes (D1); no transition attributes
(D9) — all recorded in `docs/BASE_UI_PARITY.md` (§ Slider —
aligned).

### Props

#### `SliderRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `number \| readonly number[]` | no | — | Controlled value (single or range). Wins over `defaultValue` when defined. |
| `defaultValue` | `number \| readonly number[]` | no | `[min]` | Uncontrolled initial value. |
| `onValueChange` | `(value: number \| readonly number[]) => void` | no | — | Fires with the next value on every commit. Reported in the same shape: a number for a single value, an array for a range (a one-element array stays an array). |
| `onValueCommitted` | `(value: number \| readonly number[]) => void` | no | — | Fires with the committed value when a gesture ends (release/terminate after a press), on track-press settle, and on every accessibility action. Same shape as `onValueChange`. |
| `min` | `number` | no | `0` | Range lower bound. |
| `max` | `number` | no | `100` | Range upper bound. `min > max` collapses the range to the single point `min` (no throw). |
| `step` | `number` | no | `0` | Snap increment. Values `<= 0` are continuous. Documented deviation from Base UI's default `1`: Axis preserves continuous-by-default. |
| `largeStep` | `number` | no | `10` | Consumed by keyboard handling on web: Shift + arrows and PageUp/PageDown move by `largeStep` (increment/decrement actions use `step`). |
| `minStepsBetweenValues` | `number` | no | `0` | Minimum gap between range values, in `step` units (raw value units when `step <= 0`). The dragged thumb stops at the gap instead of crossing or pushing its neighbour. |
| `orientation` | `"horizontal" \| "vertical"` | no | `"horizontal"` | Reading direction of the track. Vertical drags map track-bottom to `min` and track-top to `max`. Reading direction itself comes from the nearest `DirectionProvider` (native-locale fallback) — never a Slider prop (Base UI parity; see `docs/components/direction-provider.md`). |
| `thumbAlignment` | `"center" \| "edge"` | no | `"center"` | Thumb alignment against the control edge. `"center"` centers the thumb on the value point; `"edge"` pins the thumb fully inside the track, touching the correct edge at the bounds (computed as `translate(-percent%)` — no measurement needed). |
| `disabled` | `boolean` | no | `false` | Terminal: no gesture commits, no action commits, no callbacks, announced as disabled. |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StateStyle<SliderRootState, StyleProp<ViewStyle>>` | no | — | Root container style: a value or a function of slider state. |
| `children` | `ReactNode` | no | — | Slider content (`SliderLabel`, `SliderValue`, `SliderControl`). |
| `render` | `RenderProp<SliderRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root container host element. |

`SliderRootState`: `{ values: number[]; disabled: boolean; dragging: boolean; activeThumbIndex: number; orientation: "horizontal" | "vertical"; min: number; max: number; step: number; largeStep: number; minStepsBetweenValues: number }`.

#### `SliderLabel`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the label text. |
| `style` | `StyleProp<TextStyle>` | no | — | Label text style, caller-provided. |
| `children` | `ReactNode` | no | — | Label content. |
| `render` | `RenderProp<SliderLabelState, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `SliderValue`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the value text. |
| `style` | `StyleProp<TextStyle>` | no | — | Value text style, caller-provided. |
| `children` | `ReactNode \| ((values: number[]) => ReactNode)` | no | — | Value content: a node, or a function of the current values for caller formatting (no `Intl` layer). |
| `render` | `RenderProp<SliderValueState, SlotProps>` | no | — | Element or function substitution; the function form receives the values. |

`SliderValueState`: `{ values: number[] }`.

#### `SliderControl`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the control host. |
| `style` | `StateStyle<SliderControlState, StyleProp<ViewStyle>>` | no | — | Control container style: a value or a function of control state. |
| `children` | `ReactNode` | no | — | Control content (`SliderTrack`). |
| `render` | `RenderProp<SliderControlState, SlotProps>` | no | — | Element or function substitution; measurement and gesture wiring travel in the props. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the control host element. |

`SliderControlState`: `{ disabled: boolean; dragging: boolean; orientation: "horizontal" | "vertical" }`.

Track press jumps the nearest thumb to the touch point and
commits; moves drag relative to the touch-down values; release
(or terminate) commits through `onValueCommitted`. Without a
measured track there is no mapping, so gestures arm but never
commit.

#### `SliderTrack`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Track container style, caller-provided. |
| `children` | `ReactNode` | no | — | Track content (`SliderIndicator`, `SliderThumb`s). |
| `render` | `RenderProp<SliderTrackState, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `SliderIndicator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Fill style, caller-provided (merged under the fill geometry: `left`/`width` or `bottom`/`height` percents). |
| `render` | `RenderProp<SliderIndicatorState, SlotProps>` | no | — | Element or function substitution; the fill geometry travels in the `style` prop. |

`SliderIndicatorState`: `{ from: number; length: number }` —
fill start and length as track percentages.

#### `SliderThumb`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `index` | `number` | no | `0` | Thumb index into the values array. Out-of-range indexes read the nearest value (single values behave as a one-entry range). |
| `accessibilityLabel` | `string` | no | — | Accessible name source (e.g. "Minimum price" on a range thumb). |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Thumb style, caller-provided (merged over the state-driven position: `left`/`top` percent + centering translate). |
| `render` | `RenderProp<SliderThumbState, SlotProps>` | no | — | Element or function substitution; role, value, actions, and the commit wiring travel in the props. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the thumb host element. |

`SliderThumbState`: `{ value: number; percent: number; index: number; disabled: boolean; dragging: boolean }`.

### Examples

Volume slider, controlled (thumb centers on the value point;
the indicator fills from the track start):

```tsx
import { useState } from "react";
import {
  SliderControl,
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from "@xoroh/axis";

function Volume() {
  const [value, setValue] = useState(60);
  return (
    <SliderRoot value={value} onValueChange={(v) => typeof v === "number" && setValue(v)}>
      <SliderControl>
        <SliderTrack
          testID="demo-volume-track"
          style={{ height: 8, borderRadius: 4, backgroundColor: "#eee" }}
        >
          <SliderIndicator style={{ backgroundColor: "#6200ee" }} />
          <SliderThumb
            accessibilityLabel="Volume"
            style={{ width: 22, height: 22, borderRadius: 11 }}
          />
        </SliderTrack>
      </SliderControl>
    </SliderRoot>
  );
}
```

Price range with labels, values, and commit handling:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  SliderControl,
  SliderIndicator,
  SliderLabel,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from "@xoroh/axis";

function PriceRange() {
  const [value, setValue] = useState<readonly number[]>([25, 75]);
  return (
    <SliderRoot
      value={value}
      onValueChange={setValue}
      onValueCommitted={(v) => console.log(v)}
      minStepsBetweenValues={5}
    >
      <SliderLabel>
        <Text>Price range</Text>
      </SliderLabel>
      <SliderValue>{(values) => `${values[0]} – ${values[1]}`}</SliderValue>
      <SliderControl>
        <SliderTrack>
          <SliderIndicator />
          <SliderThumb index={0} accessibilityLabel="Minimum price" />
          <SliderThumb index={1} accessibilityLabel="Maximum price" />
        </SliderTrack>
      </SliderControl>
    </SliderRoot>
  );
}
```

### Accessibility

- Each thumb is an accessibility element carrying the
  `adjustable` role with `accessibilityValue`
  (`{ min, max, now }`, degenerate collapses `max` to `min`) and
  the `increment`/`decrement` actions — a screen reader announces
  the value and offers stepping, which commits through the same
  snapped path as dragging. The split `aria-valuemin`/`aria-valuemax`/
  `aria-valuenow` twins travel alongside (RN-web's DOM mapper
  ignores the object form), plus `aria-orientation`.
- Keyboard (web only — RN passes `onKeyDown` through to the DOM
  host; native ignores the unknown prop): ArrowRight/ArrowUp
  move by `step`, ArrowLeft/ArrowDown move back (flipped for
  RTL horizontals via `useDirection()`), Shift + arrows and PageUp/PageDown
  move by `largeStep`, Home jumps to `min`, End to `max`. Every
  key commit reports through `onValueCommitted`.
- The root, control, track, and indicator carry no roles of
  their own: semantics live on the thumbs (and the caller's
  `SliderLabel` text).
- `disabled` is terminal everywhere: no gesture commits, no
  action commits, no callbacks; thumbs are announced as
  disabled.
- Deferred with reasons: no `loopFocus`/roving tabindex (no
  roving layer); no focus retention beyond the host default.

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object, except
`Label`/`Track` (static styles — chrome carries no state);
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
The old `Slider` monolith (`value?`/`step`/`trackStyle`/
`fillStyle`/`thumbStyle`) is removed: the compound parts subsume
it (Base UI has no monolith) — ADR 001 naming parity, ADR 011
no compat shims; migration in CHANGELOG `Unreleased`. The RN
math (`clampSliderValue`, `snapSliderValue`,
`sliderValuePercent`, `normalizeSliderValues`,
`resolveSliderCommit`, `nearestSliderThumbIndex`,
`sliderRatioFromRatio`, `sliderValueFromRatio`) lives in
`./models` (`slider.ts`) with unit tests. Verified by the
slider RNTL suites (`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/ranges.tsx`.
