## Fieldset

Group of related fields with a legend: an optional legend
`Text` above caller children. Structure only — no invented
group role (React Native defines none for this), so the legend
is read as text. Validation and disabled-group semantics belong
to the caller, never here. Stateless: no open state, no
`useControllableState`.

Source of truth: `FieldsetRootProps`, `FieldsetLegendProps` in
`@xoroh/axis`
(`packages/axis/src/components/Fieldset.tsx:21-54`).

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
| `FieldsetRoot` | `Fieldset.Root` | The group container: legend plus grouped fields. |
| `FieldsetLegend` | `Fieldset.Legend` | Static legend text; renders anywhere. |

### Props

#### `FieldsetRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `legend` | `ReactNode` | no | — | Legend content rendered above the group (`Text` when the default host renders). |
| `children` | `ReactNode` | no | — | The grouped fields. |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StyleProp<ViewStyle>` | no | — | Container style, caller-provided. |
| `legendStyle` | `StyleProp<TextStyle>` | no | — | Legend text style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution (Base UI parity); the function form receives an empty state object. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the container `View` host element. |

All props optional. The group carries no state.

#### `FieldsetLegend`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Legend content. |
| `style` | `StyleProp<TextStyle>` | no | — | Legend text style, caller-provided. |
| `testID` | `string` | no | — | Test identifier. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

### Examples

Address block with a legend:

```tsx
import { Text } from "react-native";
import { FieldsetRoot, Input } from "@xoroh/axis";

function Address() {
  return (
    <FieldsetRoot legend="Address">
      <Input placeholder="Street" aria-label="Street" />
      <Input placeholder="City" aria-label="City" />
    </FieldsetRoot>
  );
}
```

Styled container and legend (every visual value is
caller-provided):

```tsx
import { Text } from "react-native";
import { FieldsetLegend, FieldsetRoot } from "@xoroh/axis";

function Preferences() {
  return (
    <FieldsetRoot style={{ gap: 8 }}>
      <FieldsetLegend style={{ fontWeight: "bold" }}>
        Notifications
      </FieldsetLegend>
      <Text>Email me weekly</Text>
    </FieldsetRoot>
  );
}
```

### Accessibility

- No group role is declared: React Native defines none for a
  field group, and inventing one would be a claim a screen
  reader cannot cash. The legend is read as text.
- Validity and disabled-group semantics are caller state, never
  inferred here — a group that cannot express its relationship
  documents the gap instead of asserting an unmapped value
  (contract §5).

### Composition

`FieldsetRoot` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function with
an empty state object); `style` and `legendStyle` stay static
(the group carries no state — the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
Verified by the fieldset RNTL suites (2 tests, in the textarea
suite — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/entry.tsx`.
