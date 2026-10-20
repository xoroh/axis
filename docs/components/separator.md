## Separator

Divider between content: a decorative `View` with
`accessible={false}` — React Native defines no separator role,
and an unbacked role claim is worse than honest silence.
Direction is the caller's styling decision (a horizontal rule
vs a vertical rule differ only in `style`); this component
carries no orientation prop it cannot honor. All visuals are
caller-provided. Stateless: no open state, no
`useControllableState`.

Source of truth: `SeparatorProps` in `@xoroh/axis`
(`packages/axis/src/components/Separator.tsx:17-30`).

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
| `Separator` | `Separator.Root` | Silent divider. Orientation is caller style (no `orientation` prop). |

### Props

#### `Separator` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StyleProp<ViewStyle>` | no | — | Divider style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution (Base UI parity); the function form receives an empty state object. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the container `View` host element. |

All props optional. The separator carries no state.

### Examples

Horizontal rule between sections:

```tsx
import { Text } from "react-native";
import { Separator } from "@xoroh/axis";

function Sections() {
  return (
    <>
      <Text>Account</Text>
      <Separator style={{ height: 1, backgroundColor: "#e0e0e0" }} />
      <Text>Notifications</Text>
    </>
  );
}
```

Vertical rule in a row (direction is caller style):

```tsx
import { Text } from "react-native";
import { Separator } from "@xoroh/axis";

function InlineActions() {
  return (
    <>
      <Text>Edit</Text>
      <Separator style={{ width: 1, alignSelf: "stretch" }} />
      <Text>Delete</Text>
    </>
  );
}
```

### Accessibility

- Renders `accessible={false}` so the divider never appears in
  the accessibility tree: a decorative boundary with no
  semantics to announce.
- React Native defines no separator role, so none is claimed —
  an unbacked claim is worse than honest silence (the same rule
  behind the `Table` and `Popover` role gaps).

### Composition

`Separator` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function with
an empty state object); `style` stays static (the separator
carries no state — the `DialogTitle` precedent). `data-*`
attributes are deliberately absent on native — state flows
through those functions instead (contract §11, parity D1).
Verified by the separator RNTL suites (2 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
