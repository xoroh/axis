## Radio Group

Single-select group: a `View` carrying the radiogroup role, with
`RadioRoot` pressables carrying the radio role and checked
state. Selection is single-select and replacing: activating the
selected item keeps it (never deselects to `null`), per the
selection-model rule — unlike `CheckboxGroup`, where
re-activation removes. Structure, behavior, and accessibility
only — every visual value (`style`) is caller-provided. State
follows the controlled + uncontrolled pattern throughout:
`value` (plus `onValueChange`) for controlled use,
`defaultValue` for uncontrolled.

Source of truth: `RadioGroupProps`, `RadioGroupState`,
`RadioRootProps`, `RadioRootState` in `@xoroh/axis`
(`packages/axis/src/components/RadioGroup.tsx:30-112`).

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
| `RadioGroup` | `Radio.Group` | State owner (`value`/`defaultValue`/`onValueChange`, terminal `disabled`); radiogroup role. |
| `RadioRoot` | `Radio.Root` | Radio option (`value` required, replaces on select); radio role with checked state. Composes a caller-provided `RadioIndicator` that mounts while checked. |
| `RadioIndicator` | `Radio.Indicator` | Selected mark; mounts while the enclosing item is checked, or always with `keepMounted` (mounted-but-hidden, `{ checked: false }`). |

Outside a group, items render unchecked and inert — they must
render inside a `RadioGroup` to participate in selection.

### Props

#### `RadioGroup` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string \| null` | no | — | Controlled selection (an item value, or `null` for none). Wins over `defaultValue` when defined. |
| `defaultValue` | `string \| null` | no | `null` | Uncontrolled initial selection (nothing selected). |
| `onValueChange` | `(value: string) => void` | no | — | Fires with the selected item value on every committed selection. Takes a plain `string` — `select` never offers `null` (clearing is not a selection). |
| `disabled` | `boolean` | no | `false` | Terminal: disables every item — no selections, no callbacks. |
| `readOnly` | `boolean` | no | `false` | Read-only: focusable and announced like an enabled group, but selections do not change and no callbacks fire. Items stay enabled (not disabled). Distinct from `disabled` — React Native maps no readonly key, so the announcement is the normal group state. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the group host. |
| `style` | `StateStyle<RadioGroupState, StyleProp<ViewStyle>>` | no | — | Root group view style: a value or a function of group state. |
| `children` | `ReactNode` | yes | — | The group's items (`RadioRoot`). |
| `render` | `RenderProp<RadioGroupState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root host element. |

`RadioGroupState`: `{ value: string | null; disabled: boolean; readOnly: boolean }` — currently selected item value (`null` for none), whether the whole group is disabled, and whether it is read-only.

#### `RadioRoot`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Selection value contributed to the group when this item is activated. |
| `disabled` | `boolean` | no | `false` | Terminal for this item only: it never selects and is announced as disabled. Siblings are unaffected. Combines with root `disabled` (either disables). |
| `readOnly` | `boolean` | no | `false` | Read-only for this item only: focusable and announced like an enabled option, but it never selects. OR'ed with the group's `readOnly` (either freezes it). |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<RadioRootState, StyleProp<ViewStyle>>` | no | — | Item pressable style: a value or a function of item state. |
| `children` | `ReactNode` | no | — | Item content (label + caller-styled selected mark). |
| `render` | `RenderProp<RadioRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`RadioRootState`: `{ checked: boolean; disabled: boolean; readOnly: boolean }` — whether this item is currently checked or disabled, and whether it is read-only (own flag OR group `readOnly`; selections do not change either way). A read-only item stays focusable and announces the normal option state.

#### `RadioIndicator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Indicator content. Mounts while the radio is checked (or always with `keepMounted`). |
| `keepMounted` | `boolean` | no | `false` | When `true`, the indicator stays mounted while the radio is unchecked: mounted but hidden from assistive tech, with `{ checked: false }` state. |
| `style` | `StyleProp<ViewStyle>` | no | — | Indicator style, caller-provided. |
| `testID` | `string` | no | — | Test identifier. |
| `render` | `RenderProp<RadioIndicatorState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`RadioIndicatorState`: `{ checked: boolean; disabled: boolean; readOnly: boolean }`. Outside a `RadioRoot` the indicator never mounts (the `CheckboxIndicator` precedent).

### Examples

Size picker, uncontrolled (re-pressing the selected size keeps
it — never deselects to `null`):

```tsx
import { Text } from "react-native";
import { RadioGroup, RadioIndicator, RadioRoot } from "@xoroh/axis";

function Sizes() {
  return (
    <RadioGroup accessibilityLabel="Size">
      <RadioRoot value="s">
        <RadioIndicator>
          <Text>●</Text>
        </RadioIndicator>
        <Text>Small</Text>
      </RadioRoot>
      <RadioRoot value="m">
        <RadioIndicator>
          <Text>●</Text>
        </RadioIndicator>
        <Text>Medium</Text>
      </RadioRoot>
    </RadioGroup>
  );
}
```

Controlled with function style over item state:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { RadioGroup, RadioRoot } from "@xoroh/axis";

function ControlledSizes() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <RadioGroup
      value={value}
      onValueChange={setValue}
      accessibilityLabel="Size"
    >
      <RadioRoot
        value="s"
        style={(state) => ({ opacity: state.checked ? 1 : 0.5 })}
      >
        <Text>Small</Text>
      </RadioRoot>
    </RadioGroup>
  );
}
```

### Accessibility

- The root is an accessibility element (`accessible`)
  carrying the `radiogroup` role and the caller's label, so the
  group reaches assistive technology — a role on a
  non-element `View` would be invisible to it.
- Items are `radio`-role pressables with `checked` +
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
the selected mark is caller style, not a part (the `Checkbox`
precedent — parity gaps table). Verified by the radio-group
RNTL suites (8 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/selection.tsx`.
