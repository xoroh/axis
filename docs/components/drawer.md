## Drawer

Edge-anchored navigation panel (Base UI naming): closed renders
`null`; open mounts the surface anchored to the leading
(`side="left"`, default) or trailing edge, with a scrim layer
filling the rest. Structure, behavior, and accessibility only —
every visual value (`overlayStyle`, `surfaceStyle`) is
caller-provided; width especially is caller geometry. State
follows the controlled + uncontrolled pattern throughout: `open`
(plus `onOpenChange`) for controlled use, `defaultOpen` for
uncontrolled. A single-part API ships: `Sheet` stays a separate
primitive — detents, snap index, and drag-to-snap make it
genuinely different, not an alias.

Source of truth: `DrawerProps`, `DrawerState` in `@xoroh/axis`
(`packages/axis/src/components/Drawer.tsx:50-91`).

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
| `Drawer` | — | The whole API: edge-anchored surface + scrim at `PortalHost`. No Base UI counterpart (Aria/mobile pattern, not a Base UI component). |

There are no compound parts: no `Root`/`Trigger`/`Portal`/
`Positioner` split. `Sheet` is the sibling primitive with
detents and drag (see `docs/components/sheet.md`).

### Overlay hosting

The drawer presents through `OverlayRoot` + `OverlayPortal`
painting at the app's `PortalHost` — the surface escapes
clipped parents without an RN `Modal` of its own (one root
presents every layer: Android back, stacking, focus, and scroll
lock belong to the `OverlayRoot` above). `modal` is always on;
`dismissable` (default `true`) flows into `dismissable` and
every dismiss branch (`outsidePointer`, `systemBack`,
`escape`); `onDismiss` fires on scrim (or request-close)
dismissal before `onOpenChange(false)`. No family part takes
`useModal` itself — the RN `Modal` host is an
`OverlayRoot`-level opt-in for direct `Overlay` compositions
(see `docs/components/overlay.md`). Contrast `Sheet`, which
keeps its own `Modal` host and is not on this stack.

### Props

#### `Drawer` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed dismiss. |
| `onDismiss` | `() => void` | no | — | Fires on scrim (or request-close) dismissal, before `onOpenChange(false)`. |
| `dismissable` | `boolean` | no | `true` | When `false`, scrim press does nothing: the scrim renders as a plain `View` with no label and no handler, so the drawer can only close through the caller's own actions. |
| `side` | `"left" \| "right"` | no | `"left"` | Anchored edge. |
| `children` | `ReactNode` | no | — | Drawer content. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the drawer surface. |
| `testID` | `string` | no | — | Test identifier; the surface carries it, the scrim carries `<testID>-scrim`, the portal carries `<testID>-portal`. |
| `overlayStyle` | `StyleProp<ViewStyle>` | no | — | Scrim layer style, caller-provided. |
| `surfaceStyle` | `StateStyle<DrawerState, StyleProp<ViewStyle>>` | no | — | Drawer surface (box) style: a value or a function of drawer state (width lives here). |
| `render` | `RenderProp<DrawerState, SlotProps>` | no | — | Element or function substitution for the drawer surface; the overlay host and scrim stay on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View`. |

`DrawerState`: `{ open: boolean; side: "left" | "right" }` —
whether the drawer is currently open, and the anchored edge.

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
- The dismissable scrim is a `Pressable` labelled "Dismiss";
  scrim press closes through `onDismiss` +
  `onOpenChange(false)`. Android system back is wired to the same
  dismiss path by the `Overlay` root and no-ops when not
  `dismissable`. The non-dismissable scrim is a plain `View`
  with no label and no handler — no fake affordance.
- Closed renders `null`: no scrim, no surface, for assistive
  tech or tests to find.
- Explicitly deferred, each for a named reason: no drag
  gestures (the `Sheet` PanResponder pattern covers drag — a
  drawer that needs edge-swipe says so and composes it); no
  animation (the Dialog precedent — the surface
  mounts/unmounts synchronously with state); no focus trap
  beyond the overlay root's modal announcement and focus
  move/restore (containing accessibility focus needs the
  `focusTrap` RN adaptation — parity D5).

### Composition

`Drawer` takes `render` (an element, cloned with the surface
props merged under its own, or a `(props, state)` function) and
value-or-function `surfaceStyle` over its state object
(`{ open, side }`); the overlay host and scrim stay on the part.
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
Verified by the drawer RNTL suites (6 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/overlays.tsx`.
