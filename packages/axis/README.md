# `@xoroh/axis`

Design-system-neutral, native-first behavior and interaction primitives
for React Native. Composable state models, hooks, and utilities with no
token reads, no styling, and no web-only APIs.

## Scope and independence

- Axis is an independent, standalone, unstyled React Native library. It
  never depends on Kern, Kern tokens, or any design system, and it is
  usable without Kern.
- Today Axis provides **behavior foundations** (state models, hooks,
  registries, math) and its first rendered component, `Switch` — not
  design-system styling. Further rendered, accessible components
  arrive under the component contract (`docs/COMPONENT_CONTRACT.md`)
  as it is reviewed.
- The public entry (`.`) is the whole contract. Deep imports are
  unsupported. Factory internals and web-only behavior stay private
  even where they exist in source for hooks or tests.

Status: extraction slices 1–2 (`time`, `useControllableState`, selection,
slot, overlay modality, dismissal, portal registry, focus/presence/press/
roving models with native bindings per contract, positioning rect math),
plus native verification (jest + React Native preset: `*.rntest.tsx`
behavior suites proving the public entry in the RN runtime; the shipped
artifact additionally bundles under the Expo 57 host — see the Kern
roadmap for that evidence). `collection` and `mergeRefs` transfer only
through their adoption gates.
See the [Axis repository](https://github.com/xoroh/axis) and
`docs/RELEASING.md` (manual releases only; nothing is published yet).

## Install

```sh
bun add @xoroh/axis react react-native
```

`react >= 18` is a peer dependency. The behavior modules
(`useControllableState`, `normalizeTimeValue`, …) are pure React and
run anywhere React runs. The rendered `Switch` component additionally
requires React Native: `react-native >=0.86 <0.89` is a peer
dependency (D-STACK support policy).

Compatibility evidence, honestly labeled:

- Declared supported: `react-native >=0.86 <0.89`, React 19, Expo 57
  host (peer ranges + D-STACK).
- Exercised by automation: jest + RN preset on `react-native
  0.87.1`; shipped-artifact bundle export on the Expo 57 host
  (React Native 0.86.3). Untested versions inside the range are
  untested — the range is policy, not proof.
- Not performed: emulator, simulator, physical-device, or
  screen-reader validation.

## Usage

```ts
import { useControllableState, normalizeTimeValue } from "@xoroh/axis";
```

Only the documented public entry (`.`) is supported. Deep imports are
not part of the contract.

## Switch

Unstyled on/off control. Structure only — a `Pressable` carrying the
switch role and state, with a track/thumb `View` pair the caller
styles. No default visuals.

### Props

Source of truth: `SwitchProps` in `@xoroh/axis` (re-exported from the
public entry).

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `boolean` | no | — | Controlled state. Wins over `defaultValue` when defined. |
| `defaultValue` | `boolean` | no | `false` | Uncontrolled initial state. |
| `onValueChange` | `(value: boolean) => void` | no | — | Fires with the next state on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: no transitions, no callbacks; announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `accessibilityLabelledBy` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host element. |
| `style` | `StyleProp<ViewStyle>` | no | — | Root pressable style, caller-provided. |
| `trackStyle` | `StyleProp<ViewStyle>` | no | — | Track container style, caller-provided. |
| `thumbStyle` | `StyleProp<ViewStyle>` | no | — | Thumb indicator style, caller-provided. |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root host element (inline documented composition). |

### Controlled example

```tsx
import { useState } from "react";
import { Switch } from "@xoroh/axis";

function Setting() {
  const [enabled, setEnabled] = useState(false);
  return (
    <Switch
      value={enabled}
      onValueChange={setEnabled}
      accessibilityLabel="Airplane mode"
      trackStyle={{ backgroundColor: enabled ? "green" : "gray" }}
    />
  );
}
```

### Uncontrolled example

```tsx
import { Switch } from "@xoroh/axis";

function Setting() {
  return (
    <Switch
      defaultValue
      onValueChange={(v) => console.log("now", v)}
      accessibilityLabel="Airplane mode"
    />
  );
}
```

Accessibility: `accessibilityRole="switch"` with
`accessibilityState { checked, disabled }`. Name the control with
`accessibilityLabel` (or `accessibilityLabelledBy` where supported).
