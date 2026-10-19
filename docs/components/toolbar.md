## Toolbar

Container grouping a set of controls: a `View` carrying the
toolbar role, rendering caller-provided controls (`children`,
required). `orientation` is structural documentation: it
selects the container's `flexDirection` (`row` for
`"horizontal"`, `column` for `"vertical"`) as a base the caller
style overrides, and records the reading order future focus
management must follow. `disabled` is observational only —
announced on the container, never forwarded to children and
blocking nothing (the container declares no press handling, so
there is nothing for it to block; each grouped control owns its
own `disabled` state). No roving keyboard traversal: single
tab-stop management belongs to the `roving` model (no approved
consumer yet), and React Native moves accessibility focus by
traversal rather than DOM tab order — there is no arrow-key
layer to wire until that model is adopted.

Source of truth: `ToolbarProps`, `ToolbarState` in `@xoroh/axis`
(`packages/axis/src/components/Toolbar.tsx:27-61`).

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
| `Toolbar` | `Toolbar.Root` (container only) | Oriented group of controls. No per-control parts (buttons, inputs, separators compose as siblings — see below). |

### Props

#### `Toolbar` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | no | `"horizontal"` | Reading order of the grouped controls. Applied structurally as the container `flexDirection` (`row` / `column`); the caller `style` merges over it and wins on conflict. |
| `disabled` | `boolean` | no | `false` | Observational only: announced on the container via `accessibilityState`, never forwarded to children and blocking nothing. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the group. |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StateStyle<ToolbarState, StyleProp<ViewStyle>>` | no | — | Root view style: a value or a function of toolbar state. Merges over the orientation base direction. |
| `children` | `ReactNode` | yes | — | Grouped controls rendered inside the container. |
| `render` | `RenderProp<ToolbarState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root view host element. |

`ToolbarState`: `{ disabled: boolean }` — the observational
disabled flag announced on the container.

### Examples

Horizontal editor toolbar (the default orientation):

```tsx
import { Text } from "react-native";
import { Button, Separator, Toolbar } from "@xoroh/axis";

function EditorBar() {
  return (
    <Toolbar accessibilityLabel="Editor">
      <Button accessibilityLabel="Bold">
        <Text>B</Text>
      </Button>
      <Separator style={{ width: 1 }} />
      <Button accessibilityLabel="Italic">
        <Text>I</Text>
      </Button>
    </Toolbar>
  );
}
```

Vertical toolbar (orientation sets the base direction; caller
style still wins on conflict):

```tsx
import { Text } from "react-native";
import { Button, Toolbar } from "@xoroh/axis";

function SideBar() {
  return (
    <Toolbar orientation="vertical" accessibilityLabel="Tools">
      <Button accessibilityLabel="Cut">
        <Text>Cut</Text>
      </Button>
      <Button accessibilityLabel="Copy">
        <Text>Copy</Text>
      </Button>
    </Toolbar>
  );
}
```

### Accessibility

- The container carries the `toolbar` role with the caller's
  label and the observational `disabled` flag in
  `accessibilityState`.
- Grouped controls keep their own roles and states: `disabled`
  is never forwarded, and the container asserts no press
  handling of its own.
- No roving traversal is wired: accessibility focus moves by
  host traversal, not by an arrow-key layer (deferred until the
  `roving` model is adopted).

### Composition

`Toolbar` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ disabled }`);
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
Verified by the toolbar RNTL suites (5 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
