## Toggle Group

Multi-press group: a `View` carrying the group role, with
`ToggleGroupItem` pressables carrying the button role and
pressed state. `multiple` (default `false`, the Base UI default)
selects the cardinality: single-press replaces, multi-press
toggles membership; activating a pressed item always removes it,
per the selection-model rule. `orientation` (default
`"horizontal"`) selects the container's `flexDirection` as a base
the caller style overrides. Structure, behavior, and
accessibility only — every visual value (`style`) is
caller-provided. State follows the controlled + uncontrolled
pattern throughout: `value` (plus `onValueChange`) for
controlled use, `defaultValue` for uncontrolled. This is pressed
semantics, not checked semantics: items announce
`accessibilityState.selected`, never `checked` — a group of
toggle buttons, not a group of checkboxes. React Native maps no
`pressed` state key (verified against the installed RN
`ViewAccessibility` `AccessibilityState` union, which carries
`selected` and `checked` but nothing pressed): `selected` is the
Toggle-precedent mapping for toggle-pressed, while `checked`
stays reserved for checkbox/radio/switch commitments.

Source of truth: `ToggleGroupProps`, `ToggleGroupState`,
`ToggleGroupItemProps`, `ToggleGroupItemState` in `@xoroh/axis`
(`packages/axis/src/components/ToggleGroup.tsx:41-117`).

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
| `ToggleGroup` | `Toggle.Root` | State owner (`value`/`defaultValue`/`onValueChange`, terminal `disabled`); group role. |
| `ToggleGroupItem` | `Toggle` | Toggle button (`value` required); button role with pressed state. |

Outside a group, items render unpressed and inert — they must
render inside a `ToggleGroup` to participate in selection.

### Props

#### `ToggleGroup` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `readonly string[]` | no | — | Controlled pressed keys. Wins over `defaultValue` when defined. |
| `defaultValue` | `readonly string[]` | no | `[]` | Uncontrolled initial pressed keys (nothing pressed). |
| `onValueChange` | `(value: readonly string[]) => void` | no | — | Fires with the pressed keys on every committed toggle. |
| `multiple` | `boolean` | no | `false` | When `false` only one item can be pressed: activating an unpressed item replaces the pressed one. When `true` multiple items can be pressed (Base UI parity). |
| `orientation` | `"horizontal" \| "vertical"` | no | `"horizontal"` | Reading order of the grouped items. Applied structurally as the container `flexDirection` (`row` / `column`); the caller `style` merges over it and wins on conflict. |
| `disabled` | `boolean` | no | `false` | Terminal: disables every item — no toggles, no callbacks. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the group host. |
| `style` | `StateStyle<ToggleGroupState, StyleProp<ViewStyle>>` | no | — | Root group view style: a value or a function of group state. |
| `children` | `ReactNode` | yes | — | The group's items (`ToggleGroupItem`). |
| `render` | `RenderProp<ToggleGroupState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root group host element. |

`ToggleGroupState`: `{ value: readonly string[]; disabled: boolean; multiple: boolean; orientation: "horizontal" | "vertical" }` — currently pressed item keys, whether the whole group is disabled, the cardinality mode, and the reading order.

#### `ToggleGroupItem`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Pressed key contributed to (or removed from) the group when this item is activated. |
| `disabled` | `boolean` | no | `false` | Terminal for this item only: it never toggles and is announced as disabled. Siblings are unaffected. Combines with root `disabled` (either disables). |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<ToggleGroupItemState, StyleProp<ViewStyle>>` | no | — | Item pressable style: a value or a function of item state. |
| `children` | `ReactNode` | no | — | Item content. |
| `render` | `RenderProp<ToggleGroupItemState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`ToggleGroupItemState`: `{ pressed: boolean; disabled: boolean }` — whether this item is currently pressed, and whether it is currently disabled.

### Examples

Format bar, uncontrolled:

```tsx
import { Text } from "react-native";
import { ToggleGroup, ToggleGroupItem } from "@xoroh/axis";

function FormatBar() {
  return (
    <ToggleGroup accessibilityLabel="Format">
      <ToggleGroupItem value="bold">
        <Text>B</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="italic">
        <Text>I</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

Controlled with function style over item state:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { ToggleGroup, ToggleGroupItem } from "@xoroh/axis";

function ControlledFormat() {
  const [value, setValue] = useState<readonly string[]>([]);
  return (
    <ToggleGroup
      value={value}
      onValueChange={setValue}
      accessibilityLabel="Format"
    >
      <ToggleGroupItem
        value="bold"
        style={(state) => ({ opacity: state.pressed ? 1 : 0.5 })}
      >
        <Text>B</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

Disabled group (terminal — no toggles, no callbacks):

```tsx
import { Text } from "react-native";
import { ToggleGroup, ToggleGroupItem } from "@xoroh/axis";

function LockedFormat() {
  return (
    <ToggleGroup disabled accessibilityLabel="Format">
      <ToggleGroupItem value="bold">
        <Text>B</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

Multiple with vertical orientation (several items stay pressed;
the container stacks them):

```tsx
import { Text } from "react-native";
import { ToggleGroup, ToggleGroupItem } from "@xoroh/axis";

function Toppings() {
  return (
    <ToggleGroup multiple orientation="vertical" accessibilityLabel="Toppings">
      <ToggleGroupItem value="cheese">
        <Text>Cheese</Text>
      </ToggleGroupItem>
      <ToggleGroupItem value="mushrooms">
        <Text>Mushrooms</Text>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

### Accessibility

- The root is an accessibility element (`accessible`)
  carrying the `group` role and the caller's label, so the
  group reaches assistive technology — a role on a
  non-element `View` would be invisible to it.
- Items are `button`-role pressables with `selected` +
  `disabled` state: pressed semantics, never checked (RN has
  no `pressed` state key — `selected` is the verified mapping,
  the `Toggle` precedent).
- A per-item `disabled` is terminal for that item only;
  siblings are unaffected.

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ value,
disabled, multiple, orientation }`, `{ pressed, disabled }`); `data-*` attributes are
deliberately absent on native — state flows through those
functions instead (contract §11, parity D1). Verified by the
toggle-group RNTL suites (5 tests — `docs/COVERAGE.md`).
Renders in `apps/example/src/demos/selection.tsx`.
