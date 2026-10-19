## Text

Readable-text host: a `Text` carrying caller content with
explicit accessibility props (label source, role passthrough)
and truncation passthrough. It carries deliberately NO
typographic scale: size, weight, and color are design-system
decisions expressed through caller `style`. A component that
needs key-hint semantics owns it (Axis carries no key-hint
primitive — key hints are display typography, not behavior).
Stateless: no open state, no `useControllableState`.

Source of truth: `TextProps` in `@xoroh/axis`
(`packages/axis/src/components/Text.tsx:18-43`).

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
| `Text` | — | The whole API: readable host. No Base UI counterpart. |

### Props

#### `Text` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Content to display. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. Without one the content itself is read. |
| `accessibilityRole` | `"none" \| "text" \| "header" \| "summary"` | no | — | Role passthrough (e.g. `"header"` for headings). No default claim. |
| `numberOfLines` | `number` | no | — | Truncation: maximum lines before ellipsizing. |
| `ellipsizeMode` | `"head" \| "middle" \| "tail" \| "clip"` | no | — | Where the ellipsis lands when `numberOfLines` truncates. |
| `selectable` | `boolean` | no | — | Whether the text is selectable. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host. |
| `style` | `StyleProp<TextStyle>` | no | — | Text style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution (Base UI parity); the function form receives an empty state object. |
| `ref` | `Ref<ElementRef<typeof HostText>>` | no | — | Ref to the host element. |

All props optional. The host carries no state.

### Examples

Body copy (no label — the content itself is read):

```tsx
import { Text } from "@xoroh/axis";

function Body() {
  return <Text>Saved yesterday at 14:02.</Text>;
}
```

Heading via role passthrough (no default claim — the caller
asserts it):

```tsx
import { Text } from "@xoroh/axis";

function Heading() {
  return (
    <Text accessibilityRole="header" style={{ fontSize: 20 }}>
      Settings
    </Text>
  );
}
```

Truncated to two lines with a tail ellipsis:

```tsx
import { Text } from "@xoroh/axis";

function Preview() {
  return (
    <Text numberOfLines={2} ellipsizeMode="tail">
      A very long description that should not wrap past two lines.
    </Text>
  );
}
```

### Accessibility

- Without an `accessibilityLabel` the content itself is read;
  with one, the label is the name source.
- `accessibilityRole` is pure passthrough with no default:
  headings and summaries are caller assertions, never inferred.
- No typographic scale is imposed — size, weight, and color
  travel in caller `style` only.

### Composition

`Text` takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function with an
empty state object); `style` stays static (the host carries no
state — the `DialogTitle` precedent). `data-*` attributes are
deliberately absent on native — state flows through those
functions instead (contract §11, parity D1). Verified by the
text RNTL suites (6 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
