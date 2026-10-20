## Switch

On/off control: a `Pressable` row carrying the switch role and
state. Structure only — every visual value (`style`) is
caller-provided; the track is caller composition (a plain `View`)
and the thumb is the `SwitchThumb` part. State follows the controlled
+ uncontrolled pattern with Base UI names: `checked` (plus
`onCheckedChange`) for controlled use, `defaultChecked` for
uncontrolled. One clean current API (owner no-compat rule): no
aliases, no warn-once shims — nothing was published, so there
is nobody to migrate.

Source of truth: `SwitchRootProps`, `SwitchRootState` in `@xoroh/axis`
(`packages/axis/src/components/Switch.tsx:33-111`).

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
| `SwitchRoot` | `Switch.Root` | State owner (`checked`/`defaultChecked`/`onCheckedChange`, `disabled`, `readOnly`, `ref`; switch role with `checked` state). Renders only caller children — no built-in track or thumb. |
| `SwitchThumb` | `Switch.Thumb` | Caller-composed thumb (`style` value-or-function over `{ checked, disabled, readOnly }`, `render`, `ref`); reads root state, renders a plain `View` outside a root. |

### Props

#### `SwitchRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `checked` | `boolean` | no | — | Controlled state. Wins over `defaultChecked` when defined. |
| `defaultChecked` | `boolean` | no | `false` | Uncontrolled initial state. |
| `onCheckedChange` | `(checked: boolean) => void` | no | — | Fires with the next state on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: no transitions, no callbacks, announced as disabled. |
| `readOnly` | `boolean` | no | `false` | Read-only: focusable and announced like an enabled switch, but presses do not change state and no callbacks fire. Distinct from `disabled` (which blocks interaction and announces disabled) — React Native maps no readonly key, so the announcement is the normal switch state. |
| `"aria-label"` | `string` | no | — | Accessible name source. |
| `"aria-labelledby"` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host. |
| `style` | `StateStyle<SwitchRootState, StyleProp<ViewStyle>>` | no | — | Value or function of switch state, caller-provided. |
| `render` | `RenderProp<SwitchRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `children` | `ReactNode` | no | — | Switch content (`SwitchThumb`, optionally inside a caller track `View`) composed by the caller. |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root pressable host element. |

`SwitchRootState`: `{ checked: boolean; disabled: boolean; readOnly: boolean }` —
whether the switch is currently on, disabled, or read-only. Read-only
switches (like disabled ones) never toggle; unlike disabled ones they
stay focusable and announce the normal switch state.

#### `SwitchThumb`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<SwitchThumbState, StyleProp<ViewStyle>>` | no | — | Thumb style: a value or a function of thumb state. |
| `children` | `ReactNode` | no | — | Thumb content. |
| `render` | `RenderProp<SwitchThumbState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the thumb `View` host element. |

`SwitchThumbState`: `{ checked: boolean; disabled: boolean; readOnly: boolean }` —
read from the enclosing `SwitchRoot` (default off/enabled outside one).

### Examples

Notifications opt-in, uncontrolled:

```tsx
import { SwitchRoot } from "@xoroh/axis";

function Notifications() {
  return <SwitchRoot aria-label="Email notifications" />;
}
```

Controlled with function style over switch state:

```tsx
import { useState } from "react";
import { SwitchRoot } from "@xoroh/axis";

function ControlledNotifications() {
  const [checked, setChecked] = useState(false);
  return (
    <SwitchRoot
      checked={checked}
      onCheckedChange={setChecked}
      aria-label="Email notifications"
      style={(state) => ({ opacity: state.checked ? 1 : 0.5 })}
    />
  );
}
```

Caller-composed track and thumb (the pair is the visual):

```tsx
import { View } from "react-native";
import { SwitchRoot, SwitchThumb } from "@xoroh/axis";

function StyledSwitch() {
  return (
    <SwitchRoot aria-label="Dark mode" defaultChecked>
      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          backgroundColor: "#94a3b8",
          padding: 2,
        }}
      >
        <SwitchThumb
          style={(state) => ({
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: state.checked ? "#0284c7" : "#ffffff",
          })}
        />
      </View>
    </SwitchRoot>
  );
}
```

### Accessibility

- The host carries the `switch` role with `checked` +
  `disabled` state and the caller's label.
- `disabled` is terminal: no transitions, no callbacks, and
  the pressable is announced as disabled.

### Composition

`SwitchRoot` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ checked,
disabled, readOnly }`). The root provides its state to a
composed `SwitchThumb` (function styles read root state; the thumb
renders a plain `View` outside a root). `data-*` attributes are
deliberately absent on native — state flows through those functions
instead (contract §11, parity D1). Verified by the switch RNTL
suites (`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/switch.tsx`.
