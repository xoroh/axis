## Label

Text label for associating with a control: a `Text` host
carrying caller content. Association is by `nativeID` — set the
same id on the label and on a control that honours
`accessibilityLabelledBy`. Focus behavior belongs to the
control, never here. No role is declared: a label is read as
text, and inventing a role the platform does not define would
be a claim a screen reader cannot cash. Stateless: no open
state, no `useControllableState`.

Source of truth: `LabelProps` in `@xoroh/axis`
(`packages/axis/src/components/Label.tsx:17-34`).

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
| `Label` | — | The whole API: associable text. Related to Base UI `Field.Label`, but standalone (nativeID association, no field owner). |

### Props

#### `Label` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Content of the label. |
| `nativeID` | `string` | no | — | Association id, mirrored on a control that honours `accessibilityLabelledBy`. |
| `testID` | `string` | no | — | Test identifier, forwarded to the text host. |
| `style` | `StyleProp<TextStyle>` | no | — | Label text style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution (Base UI parity); the function form receives an empty state object. |
| `ref` | `Ref<ElementRef<typeof Text>>` | no | — | Forwarded to the `Text` host element. |

All props optional. The label carries no state.

### Examples

Label above its control (association by `nativeID`; the control
itself carries the accessible name):

```tsx
import { Input, Label } from "@xoroh/axis";

function NameField() {
  return (
    <>
      <Label nativeID="name-input">Name</Label>
      <Input aria-label="Name" placeholder="Ada" />
    </>
  );
}
```

Styled label text (every visual value is caller-provided):

```tsx
import { Label } from "@xoroh/axis";

function SectionLabel() {
  return <Label style={{ fontWeight: "bold" }}>Preferences</Label>;
}
```

### Accessibility

- No role is declared: a label is read as text. Focus behavior
  belongs to the associated control, never here.
- Association is opt-in via `nativeID` for controls that honour
  `accessibilityLabelledBy`; nothing is inferred or forced.

### Composition

`Label` takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function with an
empty state object); `style` stays static (the label carries no
state — the `DialogTitle` precedent). `data-*` attributes are
deliberately absent on native — state flows through those
functions instead (contract §11, parity D1). Verified by the
label RNTL suites (2 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx` and
`apps/example/src/demos/entry.tsx`.
