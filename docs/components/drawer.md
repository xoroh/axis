## Drawer

Edge-anchored panel with snap points and swipe dismissal (Base UI
naming): closed renders `null`; open mounts the surface anchored to
its `side` (`"left"` default, `"right"`, `"top"`, `"bottom"`), with
a scrim layer filling the rest. Structure, behavior, and
accessibility only — every visual value (`overlayStyle`,
`surfaceStyle`) is caller-provided; cross-axis size (width for
side drawers, height for top/bottom) especially is caller
geometry. State follows the controlled + uncontrolled pattern
throughout: `open` (plus `onOpenChange`) for visibility,
`snapPoint` (plus `onSnapPointChange`) for the active snap value.
A single-part API ships; the bottom-sheet `Sheet` folded into this
family in ADR-012 — `side="bottom"` with `snapPoints` is the sheet.

Source of truth: `DrawerProps`, `DrawerState`, `DrawerSnapPoint` in `@xoroh/axis`
(`packages/axis/src/components/Drawer.tsx:93-164`).

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
| `Drawer` | `Drawer.Root` | The whole API: edge-anchored surface + scrim at `PortalHost`, with Base UI-exact `snapPoints`, controlled `snapPoint` + `onSnapPointChange`, swipe-to-dismiss, and modal + non-modal. |

There are no compound parts: no `Root`/`Trigger`/`Portal`/
`Positioner` split. Side drawers (`left`/`right`) snap along the
container width; top/bottom sheets snap along the height.

### Overlay hosting

The drawer presents through `OverlayRoot` + `OverlayPortal`
painting at the app's `PortalHost` — the surface escapes
clipped parents without an RN `Modal` of its own (one root
presents every layer: Android back, stacking, focus, and scroll
lock belong to the `OverlayRoot` above). `modal` (default
`true`) forwards to the overlay root; `dismissable` (default
`true`) flows into `dismissable` and every dismiss branch
(`outsidePointer`, `systemBack`, `escape`); `onDismiss` fires on
scrim, drag, or request-close dismissal before
`onOpenChange(false)`. No family part takes `useModal` itself —
the RN `Modal` host is an `OverlayRoot`-level opt-in for direct
`Overlay` compositions (see `docs/components/overlay.md`).

### Props

#### `Drawer` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed dismiss. |
| `onDismiss` | `() => void` | no | — | Fires on scrim, drag, or request-close dismissal, before `onOpenChange(false)`. |
| `dismissable` | `boolean` | no | `true` | When `false`, scrim press and drag-away do nothing: the drawer can only close through the caller's own actions. |
| `modal` | `boolean` | no | `true` | Modal presentation, forwarded to the overlay root. `false` keeps the scrim inert (no dismiss) regardless of `dismissable`. |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | no | `"left"` | Anchored edge. |
| `snapPoints` | `Array<number \| string>` | no | `[1]` | Preset resting positions along the dismiss axis. Numbers in (0, 1] are fractions of the measured container extent; numbers greater than 1 are dp; `'NNNpx'` strings are dp. Sorted, deduped; garbage resolves out, empty falls back to `[1]`. |
| `snapPoint` | `number \| string \| null` | no | — | Controlled active snap point value. Unknown values resolve to the nearest snap point. |
| `defaultSnapPoint` | `number \| string \| null` | no | — | Uncontrolled initial snap point value. Default: the first snap point. |
| `onSnapPointChange` | `(snapPoint: number \| string) => void` | no | — | Fires with the snap point value on every committed settle. |
| `children` | `ReactNode` | no | — | Drawer content. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the drawer surface. |
| `testID` | `string` | no | — | Test identifier; the surface carries it, the scrim carries `<testID>-scrim`, the container carries `<testID>-container`, the portal carries `<testID>-portal`. |
| `overlayStyle` | `StyleProp<ViewStyle>` | no | — | Scrim layer style, caller-provided. |
| `surfaceStyle` | `StateStyle<DrawerState, StyleProp<ViewStyle>>` | no | — | Drawer surface (box) style: a value or a function of drawer state (cross-axis size lives here). |
| `render` | `RenderProp<DrawerState, SlotProps>` | no | — | Element or function substitution for the drawer surface; the overlay host, scrim, drag, and snap wiring stay on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View`. |

`DrawerState`: `{ open: boolean; side: DrawerSide; snapPoint:
DrawerSnapPoint }` — whether the drawer is currently open, the
anchored edge, and the active snap point value.

Closed renders `null`: no scrim, no surface, no host for
assistive tech or tests to find.

### Examples

Minimal navigation drawer, uncontrolled:

```tsx
import { Text } from "react-native";
import { Drawer } from "@xoroh/axis";

function Navigation() {
  return (
    <Drawer defaultOpen accessibilityLabel="App navigation">
      <Text>Home</Text>
      <Text>Settings</Text>
    </Drawer>
  );
}
```

Controlled trailing drawer (parent owns the open state):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Button, Drawer } from "@xoroh/axis";

function EndDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)} accessibilityLabel="Open filters">
        <Text>Filters</Text>
      </Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        side="right"
        accessibilityLabel="Filters"
        surfaceStyle={{ width: 280 }}
      >
        <Text>Only unread</Text>
      </Drawer>
    </>
  );
}
```

Bottom sheet with snap points (the folded `Sheet` — `Sheet` was
removed in ADR-012; migrate `<Sheet detents snapIndex
onSnapIndexChange title … />` to `<Drawer side="bottom"
snapPoints snapPoint onSnapPointChange … />` with the title in
`children`):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Drawer } from "@xoroh/axis";
import type { DrawerSnapPoint } from "@xoroh/axis";

function FilterSheet() {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<DrawerSnapPoint>(1);
  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      side="bottom"
      snapPoints={[0.5, 1]}
      snapPoint={point}
      onSnapPointChange={setPoint}
      accessibilityLabel="Filter settings"
    >
      <Text>Filter Settings</Text>
      <Text>Choose which updates appear in your feed.</Text>
    </Drawer>
  );
}
```

Non-dismissable drawer (scrim press does nothing — only the
caller's action closes):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Button, Drawer } from "@xoroh/axis";

function LockedDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      dismissable={false}
      accessibilityLabel="Onboarding"
    >
      <Text>Step 2 of 3</Text>
      <Button onPress={() => setOpen(false)} accessibilityLabel="Continue">
        <Text>Continue</Text>
      </Button>
    </Drawer>
  );
}
```

### Accessibility

- The surface is an accessibility element (`accessible`)
  carrying the `dialog` role, so the role reaches assistive
  technology — a role on a non-element `View` would be invisible
  to it.
- The `modal` flag is deliberately omitted from
  `accessibilityState`: React Native's `AccessibilityState` host
  type has no `modal` key (checked against the RN 0.87
  `ViewAccessibility` types), so it is left out rather than
  smuggled past the typechecker (the Dialog precedent).
- A drag along the dismiss axis follows the finger; release past
  the dismiss distance (`max(64dp, 20% of the dismiss-axis
  extent)`) or with dismiss-direction velocity dismisses when
  `dismissable`, otherwise the drawer snaps to the nearest snap
  point. The surface carries `expand`/`collapse` accessibility
  actions with the same moves — gesture parity, not a gesture
  requirement.
- The dismissable modal scrim is a `Pressable` labelled
  "Dismiss"; scrim press closes through `onDismiss` +
  `onOpenChange(false)`. Android system back is wired to the same
  dismiss path by the `Overlay` root and no-ops when not
  `dismissable`. Any other scrim (non-dismissable, non-modal) is
  a plain `View` with no label and no handler — no fake
  affordance.
- Closed renders `null`: no scrim, no surface, for assistive
  tech or tests to find.
- Explicitly deferred, each for a named reason: no animation
  (the Dialog precedent — the surface mounts/unmounts
  synchronously with state); no focus trap beyond the overlay
  root's modal announcement and focus move/restore (containing
  accessibility focus needs the `focusTrap` RN adaptation —
  parity D5).

### Composition

`Drawer` takes `render` (an element, cloned with the surface
props merged under its own, or a `(props, state)` function) and
value-or-function `surfaceStyle` over its state object
(`{ open, side, snapPoint }`); the overlay host, scrim, drag,
and snap wiring stay on the part. `data-*` attributes are
deliberately absent on native — state flows through those
functions instead (contract §11, parity D1). Verified by the
drawer RNTL suites (17 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/overlays.tsx`.
