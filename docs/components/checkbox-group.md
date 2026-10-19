## Checkbox Group

Multi-select group: a `View` carrying the group role, with
`CheckboxRoot` items (each with a `value`) carrying the checkbox
role and checked state. Activating a selected item removes it (toggle
semantics, per the selection-model rule — unlike `RadioGroup`,
which never deselects on re-activation). Structure, behavior,
and accessibility only — every visual value (`style`) is
caller-provided. State follows the controlled + uncontrolled
pattern throughout: `value` (plus `onValueChange`) for
controlled use, `defaultValue` for uncontrolled.

Source of truth: `CheckboxGroupProps`, `CheckboxGroupState` in
`@xoroh/axis`
(`packages/axis/src/components/CheckboxGroup.tsx:29-67`); items
are `CheckboxRoot` (see `checkbox.md`) with a `value`.

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
| `CheckboxGroup` | — | State owner (`value`/`defaultValue`/`onValueChange`, terminal `disabled`); group role. No Base UI counterpart (Base UI composes groups from `Checkbox.Root`; Axis owns the multi-select domain). |
| `CheckboxRoot` (with `value`) | — | Checkbox row joining the group; checkbox role with checked state from membership. |

A `CheckboxRoot` without `value` inside a group stays standalone
— give each item a `value` to join.

### Props

#### `CheckboxGroup` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `readonly string[]` | no | — | Controlled selection (item values). Wins over `defaultValue` when defined. |
| `defaultValue` | `readonly string[]` | no | `[]` | Uncontrolled initial selection (nothing selected). |
| `onValueChange` | `(value: readonly string[]) => void` | no | — | Fires with the selected item values on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: disables every item — no toggles, no callbacks. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the group host. |
| `style` | `StateStyle<CheckboxGroupState, StyleProp<ViewStyle>>` | no | — | Root group view style: a value or a function of group state. |
| `children` | `ReactNode` | yes | — | The group's items (`CheckboxRoot` with `value`). |
| `render` | `RenderProp<CheckboxGroupState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root group host element. |

`CheckboxGroupState`: `{ value: readonly string[]; disabled: boolean }` — currently selected item values, and whether the whole group is disabled.

#### Items: `CheckboxRoot`

Group items are the `CheckboxRoot` part (see `checkbox.md`):
`value` (required to join — checked derives from group membership
and activation toggles membership), `disabled` (terminal for the
item, OR'ed with the group's when joined), `indeterminate`
(ignored when joined — membership is binary), plus the standalone
`checked`/`defaultChecked`/`onCheckedChange`/`readOnly` props
(ignored when joined: the group owns state).
`CheckboxRootState` is `{ checked: boolean; disabled: boolean;
indeterminate: boolean; readOnly: boolean }`.

### Examples

Toppings picker, uncontrolled (re-pressing a topping removes
it):

```tsx
import { Text } from "react-native";
import { CheckboxGroup, CheckboxRoot } from "@xoroh/axis";

function Toppings() {
  return (
    <CheckboxGroup accessibilityLabel="Toppings">
      <CheckboxRoot value="cheese">
        <Text>Cheese</Text>
      </CheckboxRoot>
      <CheckboxRoot value="mushrooms">
        <Text>Mushrooms</Text>
      </CheckboxRoot>
    </CheckboxGroup>
  );
}
```

Controlled with function style over item state:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { CheckboxGroup, CheckboxRoot } from "@xoroh/axis";

function ControlledToppings() {
  const [value, setValue] = useState<readonly string[]>([]);
  return (
    <CheckboxGroup
      value={value}
      onValueChange={setValue}
      accessibilityLabel="Toppings"
    >
      <CheckboxRoot
        value="cheese"
        style={(state) => ({ opacity: state.checked ? 1 : 0.5 })}
      >
        <Text>Cheese</Text>
      </CheckboxRoot>
    </CheckboxGroup>
  );
}
```

### Accessibility

- The root is an accessibility element (`accessible`)
  carrying the `group` role and the caller's label, so the
  group reaches assistive technology — a role on a
  non-element `View` would be invisible to it.
- Items are `checkbox`-role pressables with `checked` +
  `disabled` state.
- A per-item `disabled` is terminal for that item only;
  siblings are unaffected.

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ value,
disabled }`, `{ checked, disabled }`); `data-*` attributes are
deliberately absent on native — state flows through those
functions instead (contract §11, parity D1). No Indicator part:
the check mark is caller style, not a part (the `Checkbox`
precedent — parity gaps table). Verified by the checkbox-group
RNTL suites (7 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/selection.tsx`.
