## Button

Unstyled pressable action: a `Pressable` carrying the button role
and state. Structure, behavior, and accessibility only — every
visual value (including `style` and the rendered `children`
themselves) is caller-provided. `disabled` or `loading` suppresses
`onPress`; `loading` additionally announces `busy`, and the caller
swaps the children to reflect the busy state (no spinner renders
here). Stateless: no `open` state, no controlled/uncontrolled
pair — a button is a press source, not a state owner.

Source of truth: `ButtonProps`, `ButtonState` in `@xoroh/axis`
(`packages/axis/src/components/Button.tsx:18-52`).

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
| `Button` | `Button` | Press primitive: button role, `disabled`/`loading` suppression, `render` composition. |

Base UI ships `Button` as a single part (no compound anatomy),
and Axis matches it exactly: one component, no Root/Trigger
split. The icon/loading/link press cases Base UI covers through
composition need no separate components here either — `render`
substitution covers them.

### Props

#### `Button`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `onPress` | `() => void` | no | — | Fires on press. Suppressed while `disabled` or `loading`. |
| `disabled` | `boolean` | no | `false` | Terminal: no callbacks, announced as disabled. |
| `loading` | `boolean` | no | `false` | Busy: suppresses `onPress`, announced as busy. The caller swaps `children` to reflect the busy state — nothing renders here. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `accessibilityLabelledBy` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier, forwarded to the pressable host. |
| `style` | `StateStyle<ButtonState, StyleProp<ViewStyle>>` | no | — | Pressable style: a value or a function of button state. |
| `children` | `ReactNode` | no | — | Caller-provided content. A button without label content is unusable — name it or fill it. |
| `render` | `RenderProp<ButtonState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root pressable host element. |

`ButtonState`: `{ disabled: boolean; loading: boolean }` — the
current suppression state, and the hook for state-driven visuals
(see examples).

### Examples

Minimal (a labelled press source):

```tsx
import { Text } from "react-native";
import { Button } from "@xoroh/axis";

function Save({ onSave }: { onSave: () => void }) {
  return (
    <Button onPress={onSave} accessibilityLabel="Save">
      <Text>Save</Text>
    </Button>
  );
}
```

Disabled and loading — both suppress `onPress`, and the caller
owns the busy content:

```tsx
import { Text } from "react-native";
import { Button } from "@xoroh/axis";

function Submit({ saving, onSubmit }: { saving: boolean; onSubmit: () => void }) {
  return (
    <Button
      onPress={onSubmit}
      loading={saving}
      accessibilityLabel={saving ? "Saving" : "Submit"}
      style={{ padding: 12 }}
    >
      <Text>{saving ? "Saving…" : "Submit"}</Text>
    </Button>
  );
}
```

State-driven style from `ButtonState` (dim while busy or
disabled — `data-*` attributes do not exist on native, so state
flows through the function instead):

```tsx
import { Text } from "react-native";
import { Button } from "@xoroh/axis";

function StatefulButton({ onPress }: { onPress: () => void }) {
  return (
    <Button
      onPress={onPress}
      accessibilityLabel="Refresh"
      style={(state) => ({
        padding: 12,
        opacity: state.disabled || state.loading ? 0.5 : 1,
      })}
    >
      <Text>Refresh</Text>
    </Button>
  );
}
```

### Accessibility

- The host carries `accessibilityRole="button"` with
  `accessibilityState { disabled, busy: loading }`, so assistive
  technology announces both the terminal and the busy states.
- `disabled` is terminal: press is suppressed and the control is
  announced as disabled. `loading` suppresses `onPress` the same
  way and announces `busy` — the two flags compose (either one
  suppresses).
- The accessible name comes from text children or
  `accessibilityLabel` (`accessibilityLabelledBy` where the
  platform supports it). A button with neither is unusable — that
  gap is documented, not silent: name every button.
- No focus-trap, keyboard, or hover behavior lives here by
  design: a press source needs none. Press activation (which keys
  activate) is the shared `isPressActivationKey` rule, not a
  per-button prop.

### Composition

`Button` takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function) and
value-or-function `style` over `{ disabled, loading }`;
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
The `loading`/busy announce is the one Axis extension (the React
Aria `isPending` pattern — Base UI has no loading prop), and
`render` composition covers the icon/loading/link press cases
with no separate components — all recorded in
`docs/BASE_UI_PARITY.md` (§ Button — aligned). Verified by the
button RNTL suite (7 tests — `docs/COVERAGE.md`).
