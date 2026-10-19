## Fieldset

Group of related fields with a legend: an optional legend
`Text` above caller children. Structure only — no invented
group role (React Native defines none for this), so the legend
is read as text. Validation and disabled-group semantics belong
to the caller, never here. Stateless: no open state, no
`useControllableState`.

Source of truth: `FieldsetProps` in `@xoroh/axis`
(`packages/axis/src/components/Fieldset.tsx:21-40`).

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
| `Fieldset` | — | The whole API: legend + grouped fields. No Base UI counterpart (see `Field` for the label/control/error row). |

### Props

#### `Fieldset` (single-part API)

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

### Examples

Address block with a legend:

```tsx
import { Text } from "react-native";
import { Fieldset, Input } from "@xoroh/axis";

function Address() {
  return (
    <Fieldset legend="Address">
      <Input placeholder="Street" accessibilityLabel="Street" />
      <Input placeholder="City" accessibilityLabel="City" />
    </Fieldset>
  );
}
```

Styled container and legend (every visual value is
caller-provided):

```tsx
import { Text } from "react-native";
import { Fieldset } from "@xoroh/axis";

function Preferences() {
  return (
    <Fieldset
      legend="Notifications"
      style={{ gap: 8 }}
      legendStyle={{ fontWeight: "bold" }}
    >
      <Text>Email me weekly</Text>
    </Fieldset>
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

`Fieldset` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function with
an empty state object); `style` and `legendStyle` stay static
(the group carries no state — the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
Verified by the fieldset RNTL suites (2 tests, in the textarea
suite — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/entry.tsx`.
