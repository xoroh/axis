## Toggle

Pressed-state button: a `Pressable` carrying the button role
with the selected state, rendering caller-provided label content
(`children`). Structure only — every visual value (`style`) is
caller-provided. State follows the controlled + uncontrolled
pattern throughout: `pressed` (plus `onPressedChange`) for
controlled use, `defaultPressed` for uncontrolled. With a `value`
inside a `ToggleGroup`, the toggle joins the group — pressed
derives from group membership and activation toggles membership
(the Base UI `Toggle` pattern; without `value` it stays
standalone). Pressed
semantics, not checked: the toggle announces
`accessibilityState.selected` (React Native has no `pressed`
state key — verified against the RN `ViewAccessibility`
types), never `checked` — this is a toggle button, not a
checkbox.

Source of truth: `ToggleProps`, `ToggleState` in `@xoroh/axis`
(`packages/axis/src/components/Toggle.tsx:29-72`).

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
| `Toggle` | `Toggle` | The whole API: pressed-state button (`pressed`/`defaultPressed`/`onPressedChange`, `disabled`, `ref`; pressed announced through `selected`). |

### Props

#### `Toggle` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | no | — | Group key: with a `value` inside a `ToggleGroup`, the toggle joins the group (pressed from membership; `pressed`/`defaultPressed` ignored there). Without `value` (or outside a group) it behaves standalone. |
| `pressed` | `boolean` | no | — | Controlled state. Wins over `defaultPressed` when defined. |
| `defaultPressed` | `boolean` | no | `false` | Uncontrolled initial state. |
| `onPressedChange` | `(pressed: boolean) => void` | no | — | Fires with the next state on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: no transitions, no callbacks, announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `accessibilityLabelledBy` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host. |
| `style` | `StateStyle<ToggleState, StyleProp<ViewStyle>>` | no | — | Value or function of toggle state, caller-provided. |
| `children` | `ReactNode` | no | — | Label content rendered inside the pressable. |
| `render` | `RenderProp<ToggleState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root pressable host element. |

`ToggleState`: `{ pressed: boolean; disabled: boolean }` —
whether the toggle is currently pressed, and whether it is
currently disabled.

### Examples

Bold toggle, uncontrolled:

```tsx
import { Text } from "react-native";
import { Toggle } from "@xoroh/axis";

function Bold() {
  return (
    <Toggle accessibilityLabel="Bold">
      <Text>B</Text>
    </Toggle>
  );
}
```

Controlled with function style over toggle state:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Toggle } from "@xoroh/axis";

function ControlledBold() {
  const [pressed, setPressed] = useState(false);
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={setPressed}
      accessibilityLabel="Bold"
      style={(state) => ({ opacity: state.pressed ? 1 : 0.5 })}
    >
      <Text>B</Text>
    </Toggle>
  );
}
```

### Accessibility

- The host carries the `button` role with `selected` +
  `disabled` state: RN has no `pressed` state key, so `selected`
  is the verified mapping.
- `disabled` is terminal: no transitions, no callbacks, and the
  pressable is announced as disabled.

### Composition

`Toggle` takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ pressed,
disabled }`); `data-*` attributes are deliberately absent on
native — state flows through those functions instead
(contract §11, parity D1). Verified by the toggle RNTL suites
(7 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/selection.tsx`.
