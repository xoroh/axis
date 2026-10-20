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

Source of truth: `ToolbarRootProps`, `ToolbarRootState` in `@xoroh/axis`
(`packages/axis/src/components/Toolbar.tsx:45-219`).

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
| `ToolbarRoot` | `Toolbar.Root` | Oriented group of controls; provides orientation (and the observational `disabled`) to the parts. |
| `ToolbarButton` | `Toolbar.Button` | Pressable with the button role; per-item `disabled` OR'ed with the root flag. |
| `ToolbarLink` | `Toolbar.Link` | Text with the link role; per-item `disabled` OR'ed with the root flag. |
| `ToolbarGroup` | `Toolbar.Group` | Named subgroup container; own `disabled`, announced. |
| `ToolbarInput` | `Toolbar.Input` | Text entry (`value`/`defaultValue`/`onValueChange`); per-item `disabled` OR'ed with the root flag. |
| `ToolbarSeparator` | `Toolbar.Separator` | Divider; perpendicular to the toolbar by default (overridable). |

### Props

#### `ToolbarRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | no | `"horizontal"` | Reading order of the grouped controls. Applied structurally as the container `flexDirection` (`row` / `column`); the caller `style` merges over it and wins on conflict. |
| `disabled` | `boolean` | no | `false` | Observational only: announced on the container via `accessibilityState`, never forwarded to children and blocking nothing. |
| `"aria-label"` | `string` | no | — | Accessible name source for the group. |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StateStyle<ToolbarRootState, StyleProp<ViewStyle>>` | no | — | Root view style: a value or a function of toolbar state. Merges over the orientation base direction. |
| `children` | `ReactNode` | yes | — | Grouped controls rendered inside the container. |
| `render` | `RenderProp<ToolbarRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root view host element. |

`ToolbarRootState`: `{ disabled: boolean; orientation: "horizontal" | "vertical" }` —
the observational disabled flag announced on the container, and the reading order.

#### `ToolbarButton`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Button content. |
| `onPress` | `() => void` | no | — | Fires on activation. |
| `disabled` | `boolean` | no | `false` | Terminal: it never activates and is announced as disabled. OR'ed with the root flag. |
| `"aria-label"` | `string` | no | — | Accessible name source (ADR-112 aria-only). |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<ToolbarButtonState, StyleProp<ViewStyle>>` | no | — | Value or function of button state. |
| `render` | `RenderProp<ToolbarButtonState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the button pressable host element. |

`ToolbarButtonState`: `{ disabled: boolean; orientation: "horizontal" | "vertical" }`.

#### `ToolbarLink`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Link content. |
| `onPress` | `() => void` | no | — | Fires on activation. |
| `disabled` | `boolean` | no | `false` | Terminal: it never activates and is announced as disabled. OR'ed with the root flag. |
| `"aria-label"` | `string` | no | — | Accessible name source (ADR-112 aria-only). |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<ToolbarLinkState, StyleProp<TextStyle>>` | no | — | Value or function of link state. |
| `render` | `RenderProp<ToolbarLinkState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`ToolbarLinkState`: `{ disabled: boolean; orientation: "horizontal" | "vertical" }`.

#### `ToolbarGroup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | — | Grouped toolbar items. |
| `disabled` | `boolean` | no | `false` | Terminal for the group: announced as disabled. OR'ed with the root flag. |
| `"aria-label"` | `string` | no | — | Accessible name source for the group (ADR-112 aria-only). |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<ToolbarGroupState, StyleProp<ViewStyle>>` | no | — | Value or function of group state. |
| `render` | `RenderProp<ToolbarGroupState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the group `View` host element. |

`ToolbarGroupState`: `{ disabled: boolean; orientation: "horizontal" | "vertical" }`.

#### `ToolbarInput`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | no | — | Controlled value. Wins over `defaultValue` when defined. |
| `defaultValue` | `string` | no | `""` | Uncontrolled initial value. |
| `onValueChange` | `(value: string) => void` | no | — | Fires with the next value on every committed change. |
| `placeholder` | `string` | no | — | Placeholder text shown while empty. |
| `disabled` | `boolean` | no | `false` | Terminal: no edits, no callbacks, announced as disabled. OR'ed with the root flag. |
| `"aria-label"` | `string` | no | — | Accessible name source (ADR-112 aria-only). |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<ToolbarInputState, StyleProp<TextStyle>>` | no | — | Value or function of input state. |
| `render` | `RenderProp<ToolbarInputState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof TextInput>>` | no | — | Forwarded to the `TextInput` host element. |

`ToolbarInputState`: `{ disabled: boolean; orientation: "horizontal" | "vertical" }`.

#### `ToolbarSeparator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | no | perpendicular to the toolbar | Separator orientation. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Separator style, caller-provided. |
| `render` | `RenderProp<ToolbarSeparatorState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`ToolbarSeparatorState`: `{ orientation: "horizontal" | "vertical" }`.

### Examples

Horizontal editor toolbar (the default orientation):

```tsx
import { Text } from "react-native";
import { Button, Separator, ToolbarRoot } from "@xoroh/axis";

function EditorBar() {
  return (
    <ToolbarRoot aria-label="Editor">
      <Button aria-label="Bold">
        <Text>B</Text>
      </Button>
      <Separator style={{ width: 1 }} />
      <Button aria-label="Italic">
        <Text>I</Text>
      </Button>
    </ToolbarRoot>
  );
}
```

Vertical toolbar (orientation sets the base direction; caller
style still wins on conflict):

```tsx
import { Text } from "react-native";
import { Button, ToolbarRoot } from "@xoroh/axis";

function SideBar() {
  return (
    <ToolbarRoot orientation="vertical" aria-label="Tools">
      <Button aria-label="Cut">
        <Text>Cut</Text>
      </Button>
      <Button aria-label="Copy">
        <Text>Copy</Text>
      </Button>
    </ToolbarRoot>
  );
}
```

Toolbar parts (button, separator, group, link, input):

```tsx
import { Text } from "react-native";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarRoot,
  ToolbarSeparator,
} from "@xoroh/axis";

function PartsBar() {
  return (
    <ToolbarRoot aria-label="Editor">
      <ToolbarButton aria-label="Bold">
        <Text>B</Text>
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="History">
        <ToolbarButton aria-label="Undo">
          <Text>Undo</Text>
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarLink aria-label="Docs">
        <Text>Docs</Text>
      </ToolbarLink>
      <ToolbarInput aria-label="Search" placeholder="Search" />
    </ToolbarRoot>
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

`ToolbarRoot` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ disabled,
orientation }`); parts read orientation (and the observational
root `disabled`) from root context and work standalone with
horizontal order outside a root. `data-*` attributes are
deliberately absent on native — state flows through those
functions instead (contract §11, parity D1).
Verified by the toolbar RNTL suites (
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
