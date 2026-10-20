## Meter

Graphical display of a numeric value within a range, in compound
parts: `MeterRoot` owns the value and announces it (meter role
with `{ min, max, now }`); `MeterTrack` contains the range;
`MeterIndicator` visualizes the position with a data-driven
fill; `MeterLabel` names the meter; `MeterValue` displays the
current value (a node, or a function of the value for caller
formatting). No colors, no ticks, no scale chrome —
measurement display only. Like `Progress` but for rated capacity
rather than task progress.

The indicator fill is the clamped percentage of the range,
merged UNDER caller style (caller wins on conflict) — the
`Progress` fill precedent. There is no `Intl` formatting layer:
the caller formats through `MeterValue` function children (the
Base UI `getAriaValueText`/`locale`/`format` props are omitted
as the no-`Intl` adaptation).

Source of truth: `MeterRootProps`, `MeterRootState`,
`MeterTrackProps`, `MeterIndicatorProps`, `MeterLabelProps`,
`MeterValueProps` in `@xoroh/axis`
(`packages/axis/src/components/Meter.tsx:29-132`).

### Install

```sh
bun add @xoroh/axis react react-native
# or
npm install @xoroh/axis react react-native
```

Then add the printed tarball to your app (peers `react >= 18`,
`react-native >=0.86 <0.89`):

```sh
bun add /tmp/axis-vendor/axis-<short-sha>.tgz react react-native
```

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `MeterRoot` | `Meter.Root` | State owner (`value`/`min`/`max`); meter role with `{ min, max, now }`. |
| `MeterTrack` | `Meter.Track` | Range container. |
| `MeterIndicator` | `Meter.Indicator` | Data-driven fill (clamped percentage, merged under caller style). |
| `MeterLabel` | `Meter.Label` | Accessible-name text. |
| `MeterValue` | `Meter.Value` | Current-value text (node or function of value). |

Track/Indicator/Label/Value outside a root render nothing — a
fill without a range is meaningless.

### Props

#### `MeterRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `number` | yes | — | Current value (required — a meter without a value is a bug). Clamped into `[min, max]`. |
| `min` | `number` | no | `0` | Minimum value. |
| `max` | `number` | no | `100` | Maximum value. |
| `"aria-label"` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StateStyle<MeterRootState, StyleProp<ViewStyle>>` | no | — | Root container style: a value or a function of meter state, caller-provided. |
| `children` | `ReactNode` | no | — | Meter content (`MeterLabel`, `MeterTrack`, `MeterValue`). |
| `render` | `RenderProp<MeterRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root container host element. |

`MeterRootState`: `{ value: number }` — the clamped value
announced to assistive tech.

#### `MeterTrack`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Track container style, caller-provided (static — the track carries no state). |
| `children` | `ReactNode` | no | — | Track content (`MeterIndicator`). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MeterIndicator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Fill style, caller-provided (merged under the fill width). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MeterLabel`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<TextStyle>` | no | — | Label text style, caller-provided. |
| `children` | `ReactNode` | no | — | Label content. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MeterValue`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<TextStyle>` | no | — | Value text style, caller-provided. |
| `children` | `ReactNode \| ((value: number) => ReactNode)` | no | — | Value content: a node, or a function of the current value for caller formatting. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

### Examples

Battery gauge with label and formatted value:

```tsx
import { Text } from "react-native";
import {
  MeterIndicator,
  MeterLabel,
  MeterRoot,
  MeterTrack,
  MeterValue,
} from "@xoroh/axis";

function Battery() {
  return (
    <MeterRoot value={70} aria-label="Battery">
      <MeterLabel>
        <Text>Battery</Text>
      </MeterLabel>
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
      <MeterValue>{(v: number) => `${v}%`}</MeterValue>
    </MeterRoot>
  );
}
```

Clamped range with custom min/max (values outside clamp to the
range):

```tsx
import { MeterIndicator, MeterRoot, MeterTrack } from "@xoroh/axis";

function Signal() {
  return (
    <MeterRoot value={9} min={0} max={5} aria-label="Signal">
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
    </MeterRoot>
  );
}
```

### Accessibility

- The root is an accessibility element (`accessible`)
  carrying the `meter` role with `accessibilityValue`
  (`{ min, max, now }` clamped), so the gauge reaches
  assistive technology — a role on a non-element `View` would
  be invisible to it.
- `MeterLabel`/`MeterValue` are plain text hosts: naming lives
  on the root's label and value, not on asserted roles.

### Composition

`MeterRoot` takes `render` and value-or-function `style` over
its state object (`{ value }`); Track/Indicator/Label/Value
take `render` with empty state and static `style` (chrome
carries no state — the `DialogTitle` precedent); `data-*`
attributes are deliberately absent on native — state flows
through those functions instead (contract §11, parity D1). The
old `Meter` monolith (`value?`/`fillStyle`) is removed: the
compound parts subsume it exactly (Base UI has no monolith) —
ADR 001 naming parity, ADR 011 no compat shims; migration in
CHANGELOG `Unreleased`. Verified by the meter RNTL suites
(`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
