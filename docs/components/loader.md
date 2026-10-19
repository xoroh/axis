## Loader

Busy indicator: the host `ActivityIndicator` with an announced
busy state and nothing else. Size, color, and animation are the
caller's (`size`, `color` passthrough) — this component owns
presence + announcement. Stateless and always busy: no open
state, no `useControllableState`.

Source of truth: `LoaderProps` in `@xoroh/axis`
(`packages/axis/src/components/Loader.tsx:19-38`).

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
| `Loader` | — | The whole API: announced busy indicator. No Base UI counterpart. |

### Props

#### `Loader` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `size` | `number \| "small" \| "large"` | no | — | Indicator size. Passed straight through to the host. |
| `color` | `string` | no | — | Indicator color. Passed straight through to the host. |
| `accessibilityLabel` | `string` | no | — | Accessible name source (e.g. "Loading results"). |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StyleProp<ViewStyle>` | no | — | Container style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution (Base UI parity); the function form receives an empty state object. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the container `View` host element. |

All props optional. The loader is always busy.

### Examples

Named loading region:

```tsx
import { Loader } from "@xoroh/axis";

function Loading() {
  return <Loader accessibilityLabel="Loading results" />;
}
```

Large branded spinner (size and color are caller passthrough):

```tsx
import { Loader } from "@xoroh/axis";

function BrandedLoading() {
  return <Loader size="large" color="#6200ee" testID="loader" />;
}
```

### Accessibility

- The container is an accessibility element (`accessible`)
  carrying `busy: true` in `accessibilityState` plus the
  caller's `accessibilityLabel`, so the busy region is announced.
- The indicator itself carries no semantics: presence +
  announcement belong to this component, and the host
  `ActivityIndicator` is the visual.

### Composition

`Loader` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function with
an empty state object — the loader is always busy, so there is
no state to branch on); `style` stays static (the `DialogTitle`
precedent). `data-*` attributes are deliberately absent on
native — state flows through those functions instead
(contract §11, parity D1). Verified by the loader RNTL suites
(1 test — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
