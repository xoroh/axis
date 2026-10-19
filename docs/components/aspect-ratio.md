## Aspect Ratio

Container that keeps a width-to-height ratio: a `View` whose
style carries `{ aspectRatio: ratio }` ahead of the
caller-provided `style`, so the caller can still override layout
values downstream. Structure only — every visual value beyond
the ratio is caller-provided — and stateless: no open state, no
`useControllableState`. A `ratio` that is not a finite number
greater than zero (`0`, negatives, `NaN`, `Infinity`) is clamped
to `1`, never thrown: an invalid ratio is a caller typo, not a
render failure. The `aspectRatio` style key is a core React
Native layout prop, so no new host binding is involved.

Source of truth: `AspectRatioProps` in `@xoroh/axis`
(`packages/axis/src/components/AspectRatio.tsx:22-42`).

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
| `AspectRatio` | — | The whole API: ratio box. No Base UI counterpart. |

### Props

#### `AspectRatio` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `ratio` | `number` | no | `1` | Width-to-height ratio. Must be a finite number greater than zero; anything else is clamped to `1` (square). |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StyleProp<ViewStyle>` | no | — | Container style, caller-provided — merged after the ratio, so the caller wins on conflict. |
| `children` | `ReactNode` | no | — | Content sized by the ratio container. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution (Base UI parity); the function form receives an empty state object. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root view host element. |

All props optional. The container carries no state.

### Examples

Square media box:

```tsx
import { Text } from "react-native";
import { AspectRatio } from "@xoroh/axis";

function Avatar() {
  return (
    <AspectRatio testID="avatar-box">
      <Text>AR</Text>
    </AspectRatio>
  );
}
```

Widescreen banner with caller layout downstream (caller style
wins on conflict):

```tsx
import { Text } from "react-native";
import { AspectRatio } from "@xoroh/axis";

function Banner() {
  return (
    <AspectRatio ratio={16 / 9} style={{ width: "100%" }}>
      <Text>Sale ends Sunday</Text>
    </AspectRatio>
  );
}
```

### Accessibility

- The container declares no role, label, or state: it is a
  layout box, and its content keeps whatever accessibility
  semantics it declares.
- Invalid ratios clamp to `1` rather than throwing, so a typo
  degrades to a square instead of a render failure.

### Composition

`AspectRatio` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function with
an empty state object); `style` stays static (the container
carries no state — the `DialogTitle` precedent). `data-*`
attributes are deliberately absent on native — state flows
through those functions instead (contract §11, parity D1).
Verified by the aspect-ratio RNTL suites (3 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
