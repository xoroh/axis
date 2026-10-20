## Avatar

Identity image with fallback, in compound parts: `AvatarRoot`
owns the image loading status and paints the positioning
container; `AvatarImage` mounts the `Image` and reports loading
status; `AvatarFallback` renders caller content (initials,
icon) when there is no image, while loading is still inside its
`delay`, or when the image failed. No default visuals — sizing,
shape, and placeholder art are the caller's.

Loading follows the Base UI status domain (`idle` | `loading` |
`loaded` | `error`): no source is `idle`; mounting with a source
starts `loading`; pixels resolve to `loaded`; a load error
resolves to `error` and unmounts the image (a broken-image icon
painted over the fallback helps nobody). While `loading` the
image stays mounted but hidden from assistive tech so the
fallback provides the accessible name on its own (the Base UI
stacking guidance, automatic here — React Native paints nothing
until pixels arrive, so the fallback shows through by
construction). There is no `keepMounted` prop: it is N/A — the
image must mount to load, and unmount-on-error is the only
question it answers.

Identity state, not decoration: the loaded image carries the
image role and label; the fallback is plain content.

Source of truth: `AvatarRootProps`, `AvatarRootState`,
`AvatarImageProps`, `AvatarImageState`,
`AvatarFallbackProps`, `AvatarFallbackState`,
`ImageLoadingStatus` in `@xoroh/axis`
(`packages/axis/src/components/Avatar.tsx:31-115`).

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
| `AvatarRoot` | `Avatar.Root` | Status owner (`imageLoadingStatus` state); positioning container. |
| `AvatarImage` | `Avatar.Image` | The image; reports `onLoadingStatusChange`. Hidden from assistive tech until loaded. |
| `AvatarFallback` | `Avatar.Fallback` | Caller content; shows when `idle`, when `error`, or while `loading` inside `delay`. |

Omitted Base UI pieces are documented deviations, not
oversights: no `keepMounted` (N/A — the image must mount to
load; unmount-on-error is automatic); no `data-*` attributes
(D1); no transition attributes (D9) — all recorded in
`docs/BASE_UI_PARITY.md` (§ Avatar — aligned).

### Props

#### `AvatarRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Root content (`AvatarImage` + `AvatarFallback`). |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StyleProp<ViewStyle>` | no | — | Root container style, caller-provided. |
| `render` | `RenderProp<AvatarRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root container host element. |

`AvatarRootState`: `{ imageLoadingStatus: ImageLoadingStatus }` — where `ImageLoadingStatus = "idle" | "loading" | "loaded" | "error"`.

#### `AvatarImage`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `source` | `ImageSourcePropType` | yes | — | Image source (required — without one the root stays `idle`). |
| `"aria-label"` | `string` | no | — | Accessible name source (e.g. the person's name). Announced only while loaded. |
| `testID` | `string` | no | — | Test identifier, forwarded to the image host. |
| `style` | `StyleProp<ImageStyle>` | no | — | Image style, caller-provided. |
| `onLoadingStatusChange` | `(status: ImageLoadingStatus) => void` | no | — | Fires with the next loading status on every transition. |
| `render` | `RenderProp<AvatarImageState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof Image>>` | no | — | Forwarded to the `Image` host element. |

`AvatarImageState`: `{ imageLoadingStatus: ImageLoadingStatus }`.

Outside a root the image never loads and never renders. On
error it unmounts (no broken-image icon over the fallback).

#### `AvatarFallback`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Fallback content (initials, icon). |
| `delay` | `number` | no | `0` | Milliseconds to wait before showing the fallback while loading. The fallback always shows immediately when `idle` or `error`. |
| `testID` | `string` | no | — | Test identifier, forwarded to the fallback host. |
| `style` | `StyleProp<ViewStyle>` | no | — | Fallback container style, caller-provided. |
| `render` | `RenderProp<AvatarFallbackState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`AvatarFallbackState`: `{ imageLoadingStatus: ImageLoadingStatus }`.

Outside a root there is no image to wait for: the fallback
always shows.

### Examples

Profile photo with initials fallback:

```tsx
import { Text } from "react-native";
import { AvatarFallback, AvatarImage, AvatarRoot } from "@xoroh/axis";

function Profile() {
  return (
    <AvatarRoot>
      <AvatarImage
        source={{ uri: "https://example.com/ada.png" }}
        aria-label="Ada Lovelace"
        style={{ width: 48, height: 48, borderRadius: 24 }}
      />
      <AvatarFallback
        style={{ width: 48, height: 48, borderRadius: 24 }}
      >
        <Text>AL</Text>
      </AvatarFallback>
    </AvatarRoot>
  );
}
```

Delayed fallback (suppress the flash on fast loads; the
fallback still shows instantly with no source or on error):

```tsx
import { Text } from "react-native";
import { AvatarFallback, AvatarImage, AvatarRoot } from "@xoroh/axis";

function DelayedProfile() {
  return (
    <AvatarRoot>
      <AvatarImage source={{ uri: "https://example.com/ada.png" }} />
      <AvatarFallback delay={300}>
        <Text>AL</Text>
      </AvatarFallback>
    </AvatarRoot>
  );
}
```

Status-driven content (parent observes transitions):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  AvatarFallback,
  AvatarImage,
  AvatarRoot,
  type ImageLoadingStatus,
} from "@xoroh/axis";

function StatusProfile() {
  const [status, setStatus] = useState<ImageLoadingStatus>("idle");
  return (
    <>
      <AvatarRoot>
        <AvatarImage
          source={{ uri: "https://example.com/ada.png" }}
          onLoadingStatusChange={setStatus}
        />
        <AvatarFallback>
          <Text>AL</Text>
        </AvatarFallback>
      </AvatarRoot>
      <Text>{status}</Text>
    </>
  );
}
```

### Accessibility

- The loaded image is an accessibility element (`accessible`)
  carrying the `image` role and the caller's label, so the
  identity is announced.
- While `loading` the mounted image is hidden from assistive
  tech (`accessible={false}`), so the fallback provides the
  accessible name on its own (the Base UI stacking guidance).
- The fallback is plain content with no role: naming lives on
  the loaded image or the caller's label.

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function)
over its loading-status state object (`{ imageLoadingStatus
}`); styles stay static (chrome carries no state — the
`DialogTitle` precedent). `data-*` attributes are deliberately
absent on native — state flows through those functions instead
(contract §11, parity D1). The old `Avatar` monolith is
removed: the compound parts subsume it exactly (Base UI has no
monolith) — ADR 001 naming parity, ADR 011 no compat shims;
migration in CHANGELOG `Unreleased`. Verified by the avatar
RNTL suites (`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
