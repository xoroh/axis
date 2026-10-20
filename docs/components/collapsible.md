## Collapsible

Single disclosure unit: a `View` root carrying one
`CollapsibleTrigger` `Pressable` (button role, `expanded`
state) with a `CollapsiblePanel` `View` that renders ONLY while
open — presence is mount/unmount, never hiding styles. Structure,
behavior, and accessibility only — every visual value (`style`
on each part) is caller-provided. State follows the controlled +
uncontrolled pattern throughout: `open` (plus `onOpenChange`)
for controlled use, `defaultOpen` for uncontrolled (default
`false`, starts collapsed). This is an `Accordion` with exactly
one always-present item, but shares NO code with it — no shared
context, toggle, or ref helper (the group selection domain and
the single boolean domain would meet only in a wrapper that
hides both contracts).

Source of truth: `CollapsibleRootProps`, `CollapsibleRootState`,
`CollapsibleTriggerProps`, `CollapsibleTriggerState`,
`CollapsiblePanelProps` in `@xoroh/axis`
(`packages/axis/src/components/Collapsible.tsx:48-116`).

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
| `CollapsibleRoot` | `Collapsible.Root` | State owner (`open`/`defaultOpen`/`onOpenChange`, terminal `disabled`); renders the root disclosure view. |
| `CollapsibleTrigger` | `Collapsible.Trigger` | Button role, expanded state, tap toggles; root `disabled` is terminal here too. |
| `CollapsiblePanel` | `Collapsible.Panel` | Content view; mounts only while open. |

Outside a `CollapsibleRoot` the parts degrade honestly: the trigger
renders collapsed and inert, and the panel never mounts.

### Props

#### `CollapsibleRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state (starts collapsed). |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: disables the trigger — no toggles, no callbacks. |
| `testID` | `string` | no | — | Test identifier, forwarded to the root host. |
| `style` | `StateStyle<CollapsibleRootState, StyleProp<ViewStyle>>` | no | — | Root disclosure view style: a value or a function of disclosure state. |
| `children` | `ReactNode` | yes | — | The disclosure parts (`CollapsibleTrigger`, `CollapsiblePanel`). |
| `render` | `RenderProp<CollapsibleRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root disclosure host element. |

`CollapsibleRootState`: `{ open: boolean; disabled: boolean }` —
whether the unit is currently open, and whether the whole unit
is disabled.

#### `CollapsibleTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal for the trigger: it never toggles and is announced as disabled. Combines with root `disabled` (either disables). |
| `"aria-label"` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<CollapsibleTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger pressable style: a value or a function of trigger state. |
| `children` | `ReactNode` | no | — | Trigger content, rendered inside the `Pressable`. |
| `render` | `RenderProp<CollapsibleTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`CollapsibleTriggerState`: `{ open: boolean; disabled: boolean }`.

#### `CollapsiblePanel`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Panel view style, caller-provided (static — the panel mounts only while open; its state is constant). |
| `children` | `ReactNode` | no | — | Panel content, rendered inside a `View` only while open. |
| `render` | `RenderProp<CollapsibleRootState, SlotProps>` | no | — | Element or function substitution; the panel still mounts only while open. |

### Examples

Minimal disclosure, uncontrolled:

```tsx
import { Text } from "react-native";
import {
  CollapsibleRoot,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@xoroh/axis";

function Details() {
  return (
    <CollapsibleRoot>
      <CollapsibleTrigger aria-label="Show details">
        <Text>Details</Text>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <Text>Built in 2026.</Text>
      </CollapsiblePanel>
    </CollapsibleRoot>
  );
}
```

Controlled with function style over disclosure state:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  CollapsibleRoot,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@xoroh/axis";

function ControlledDetails() {
  const [open, setOpen] = useState(false);
  return (
    <CollapsibleRoot
      open={open}
      onOpenChange={setOpen}
      style={(state) => ({ opacity: state.open ? 1 : 0.9 })}
    >
      <CollapsibleTrigger aria-label="Show details">
        <Text>Details</Text>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <Text>Built in 2026.</Text>
      </CollapsiblePanel>
    </CollapsibleRoot>
  );
}
```

Disabled unit (terminal — no toggles, no callbacks):

```tsx
import { Text } from "react-native";
import {
  CollapsibleRoot,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@xoroh/axis";

function LockedDetails() {
  return (
    <CollapsibleRoot disabled>
      <CollapsibleTrigger aria-label="Show details">
        <Text>Details</Text>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <Text>Built in 2026.</Text>
      </CollapsiblePanel>
    </CollapsibleRoot>
  );
}
```

### Accessibility

- The trigger is a `Pressable` with the `button` role and
  `expanded` + `disabled` state, so open/closed reaches
  assistive technology.
- No role is declared on the root: React Native defines no
  disclosure-group role for a single unit, and inventing one
  would be a claim a screen reader cannot cash (the `Label`
  precedent).
- Closed renders the trigger only: the panel unmounts (never
  hidden styles), so there is nothing for assistive tech or
  tests to find.
- Explicitly deferred: no animation (the panel
  mounts/unmounts synchronously with state — exit transitions
  would need the `presence` model to keep it mounted, unneeded
  until a consumer needs animated disclosure).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open,
disabled }`), except the panel, whose style stays static (the
panel mounts only while open — its state is constant);
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
Verified by the collapsible RNTL suites (6 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/disclosure.tsx`.
