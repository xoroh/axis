## Trigger

Semantics-free press container: a `Pressable` carrying caller
content with the disabled-terminal guard, stable ref
composition, and test hooks — and deliberately NO
`accessibilityRole`, no label requirement, no busy semantics. It
exists for building custom controls whose role and state the
CALLER asserts (a tab-strip trigger owned by `Tabs`, a row with
a custom role, a pressable wrapper inside a composite): using
`Button` there would assert a `button` role the control does not
own, and using raw RN `Pressable` would drop the
terminal-disabled guard and the ref/testID conventions every
Axis host carries. Reach for `Button` when the control IS a
labelled action (with busy state) or `Switch` when it IS binary
state with checked announcements — each asserts semantics this
component must not repeat. Reach for `Trigger` when the control
owns its own semantics and needs only a press container. A
`Trigger` with a `button` role and a label is a `Button`
written the long way — review rejects it.

Source of truth: `TriggerProps`, `TriggerState` in `@xoroh/axis`
(`packages/axis/src/components/Trigger.tsx:29-54`).

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
| `Trigger` | — | The whole API: semantics-free press container. No Base UI counterpart (Axis-specific: the `Button` it must not become). |

### Props

#### `Trigger` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `onPress` | `() => void` | no | — | Fires on press. Suppressed while `disabled`. |
| `disabled` | `boolean` | no | `false` | Terminal: no callbacks. Announced only if the caller asserts a role. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. No default — the caller owns naming. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host. |
| `style` | `StateStyle<TriggerState, StyleProp<ViewStyle>>` | no | — | Value or function of trigger state, caller-provided. |
| `children` | `ReactNode` | no | — | Content. |
| `render` | `RenderProp<TriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the host pressable element. |

`TriggerState`: `{ disabled: boolean }` — whether the trigger is
currently disabled.

All props optional. The trigger asserts no role itself.

### Examples

Pressable row wrapper (no role asserted — the caller owns
semantics):

```tsx
import { Text } from "react-native";
import { Trigger } from "@xoroh/axis";

function Row() {
  return (
    <Trigger onPress={() => console.log("row")} testID="row">
      <Text>Row one</Text>
    </Trigger>
  );
}
```

Caller-asserted role via `render` substitution (the element is
cloned with the part props merged under its own, so the role
survives and the terminal-disabled guard stays on the part):

```tsx
import { Pressable, Text } from "react-native";
import { Trigger } from "@xoroh/axis";

function CheckRow() {
  return (
    <Trigger
      onPress={() => console.log("row")}
      testID="row"
      render={<Pressable accessibilityRole="checkbox" />}
    >
      <Text>Row one</Text>
    </Trigger>
  );
}
```

Disabled is terminal (no callbacks fire):

```tsx
import { Text } from "react-native";
import { Trigger } from "@xoroh/axis";

function LockedRow() {
  return (
    <Trigger disabled testID="row">
      <Text>Row one</Text>
    </Trigger>
  );
}
```

### Accessibility

- The host `Pressable` carries NO `accessibilityRole` and no
  required label: semantics-free by construction.
- `disabled` suppresses all callbacks; it is announced only if
  the caller asserts a role that carries it.
- A caller-asserted `button` role plus a label duplicates
  `Button` — review rejects that shape (see the module
  contract above).

### Composition

`Trigger` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ disabled
}`); `data-*` attributes are deliberately absent on native —
state flows through those functions instead (contract §11,
parity D1). Verified by the trigger RNTL suites (4 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/overlays.tsx`.
