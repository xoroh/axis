## Direction Provider

Reading-direction root: groups a subtree under one direction
(`"ltr"` or `"rtl"`, default `"ltr"`). `useDirection()` reads the
nearest provider; with no provider it falls back to the native
locale (`I18nManager.isRTL ? "rtl" : "ltr"`). Consumers that
mirror horizontal geometry or keys (Slider arrow handling read
it instead of taking per-part `dir` props) — one owner per tree.
Renders no host element: pure context plumbing (the
`TooltipProvider` precedent — group state without a view). No
`dir` DOM attribute is set; web direction stays the caller's
document concern.

Source of truth: `DirectionProviderProps`, `Direction`,
`useDirection` in `@xoroh/axis`
(`packages/axis/src/components/DirectionProvider.tsx`).

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
| `DirectionProvider` | `Direction.Provider` | Direction owner (`direction`, default `"ltr"`); renders no element. |
| `useDirection` | `useDirection` | Reads the nearest provider, else the native-locale fallback. Not a component — a hook, usable in any Axis consumer. |

### Props

#### `DirectionProvider`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `direction` | `"ltr" \| "rtl"` | no | `"ltr"` | Reading direction for the subtree. |
| `children` | `ReactNode` | no | — | Content sharing this direction. |

Nesting scopes to the nearest provider: an inner
`DirectionProvider` overrides the outer one for its subtree.

### `useDirection` hook

Returns the nearest provider's direction, or the native-locale
fallback (`I18nManager.isRTL ? "rtl" : "ltr"`) with no provider.
No props. Throws nothing; always resolves.

### Examples

Right-to-left section (nearest provider wins):

```tsx
import { Text } from "react-native";
import { DirectionProvider, useDirection } from "@xoroh/axis";

function Label() {
  const direction = useDirection();
  return <Text>{direction === "rtl" ? "يمين" : "Right"}</Text>;
}

function Section() {
  return (
    <DirectionProvider direction="rtl">
      <Label />
    </DirectionProvider>
  );
}
```

Slider subtree reading direction from context instead of a
per-part prop:

```tsx
import {
  DirectionProvider,
  SliderControl,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from "@xoroh/axis";

function RtlSlider() {
  return (
    <DirectionProvider direction="rtl">
      <SliderRoot defaultValue={30}>
        <SliderControl>
          <SliderTrack>
            <SliderThumb aria-label="Volume" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>
    </DirectionProvider>
  );
}
```

### Accessibility

- The provider asserts no semantics itself: it carries no role,
  label, or state — direction flows to consumers that own the
  relevant announcements.
- The native-locale fallback keeps direction honest on device:
  an app running in an RTL locale gets RTL without a provider
  anywhere.

### Composition

`DirectionProvider` takes no `render` substitution and no
`style` (it renders no host — there is nothing to substitute or
style); `data-*` attributes are deliberately absent on native
(contract §11, parity D1). Verified by the direction-provider
RNTL suites (4 tests — `docs/COVERAGE.md`).
