## Sheet

Bottom sheet with detents and drag: closed renders `null`; open
mounts a transparent RN `Modal` holding a scrim layer with the
sheet surface bottom-anchored inside it. A vertical drag on the
surface follows the finger and settles to the nearest detent on
release; dragging down past the dismiss distance (or flicking
down fast) dismisses when `dismissable`. Detents are fractions
(0, 1] of the measured container height (`detents`, default
`[1]`): sorted, clamped, deduped, never throwing — an empty
resolution falls back to `[1]`. Structure, behavior, and
accessibility only — every visual value (`overlayStyle`,
`surfaceStyle`, `titleStyle`) is caller-provided. State follows
the controlled + uncontrolled pattern twice: `open` (plus
`onOpenChange`) for visibility, `snapIndex` (plus
`onSnapIndexChange`) for the active detent.

Source of truth: `SheetProps`, `SheetState` in `@xoroh/axis`
(`packages/axis/src/components/Sheet.tsx:83-137`).

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
| `Sheet` | — | The whole API: `Modal` host + scrim + bottom-anchored surface with detents and drag. No Base UI counterpart (Aria/mobile pattern, not a Base UI component). |

There are no compound parts. `Drawer` is the sibling primitive
without detents or drag (edge-anchored panel — see
`docs/components/drawer.md`); `Sheet` stays separate because
detents, snap index, and drag-to-snap make it genuinely
different, not an alias.

### Overlay hosting

`Sheet` does NOT sit on `OverlayRoot`: it keeps its own RN
`Modal` host (transparent, `onRequestClose` wired to the same
dismiss path, no-op when not `dismissable`) — there is no
`OverlayPortal`, no `PortalHost` painting, and no `useModal`
opt-in (the Modal is already the host). That is the documented
difference from `Drawer` (which presents through `OverlayRoot`
+ `OverlayPortal` at the app's `PortalHost`). `Modal`-level
stacking, back handling, and dismissal belong to the `Modal`
host here; `escape`/focus-out are unbound and focus containment
is deferred exactly as on the other surfaces. If a sheet needs
the shared stacking registry, top-layer isolation, or scroll
lock, compose it from the `Overlay` parts instead — see
`docs/components/overlay.md`.

### Props

#### `Sheet` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed dismiss. |
| `onDismiss` | `() => void` | no | — | Fires on scrim, drag, or request-close dismissal, before `onOpenChange(false)`. |
| `dismissable` | `boolean` | no | `true` | When `false`, scrim press and drag-down do nothing: the scrim renders as a plain `View` with no label and no handler, and a downward release snaps back instead of dismissing. The sheet can only close through the caller's own actions. |
| `detents` | `number[]` | no | `[1]` | Snap fractions (0, 1] of container height. Sorted ascending, clamped, deduped; empty resolves to `[1]` (fully open). |
| `snapIndex` | `number` | no | — | Controlled snap index into `detents`. Wins over `defaultSnapIndex`. A controlled index past the end clamps silently to the nearest real detent. |
| `defaultSnapIndex` | `number` | no | `0` | Uncontrolled initial snap index. |
| `onSnapIndexChange` | `(index: number) => void` | no | — | Fires when the snap index changes on a committed settle. |
| `title` | `ReactNode` | no | — | Sheet title, rendered in a `Text` when provided. |
| `children` | `ReactNode` | no | — | Sheet content. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the sheet surface. |
| `testID` | `string` | no | — | Test identifier; the surface carries it, the scrim carries `<testID>-scrim`, the measured container carries `<testID>-container` (so tests can drive measurement with a layout event). |
| `overlayStyle` | `StyleProp<ViewStyle>` | no | — | Scrim layer style, caller-provided. |
| `surfaceStyle` | `StateStyle<SheetState, StyleProp<ViewStyle>>` | no | — | Sheet surface (box) style: a value or a function of sheet state. |
| `titleStyle` | `StyleProp<TextStyle>` | no | — | Title text style, caller-provided. |
| `render` | `RenderProp<SheetState, SlotProps>` | no | — | Element or function substitution for the sheet surface; the `Modal` host, scrim, drag, and snap wiring stay on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View`. |

`SheetState`: `{ open: boolean; snapIndex: number }` — whether
the sheet is currently open, and the active detent index.

Closed renders `null`: no `Modal` host, no scrim, no surface.
Before the first container layout the sheet rests fully open
rather than hiding — a hidden-until-measured sheet would read
as a mount failure.

### Examples

Minimal half sheet, uncontrolled:

```tsx
import { Text } from "react-native";
import { Sheet } from "@xoroh/axis";

function Filters() {
  return (
    <Sheet defaultOpen detents={[0.5, 1]} title="Filters">
      <Text>Only unread</Text>
    </Sheet>
  );
}
```

Controlled visibility and snap (parent owns both):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Sheet } from "@xoroh/axis";

function ControlledSheet() {
  const [open, setOpen] = useState(false);
  const [snapIndex, setSnapIndex] = useState(0);
  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      detents={[0.5, 1]}
      snapIndex={snapIndex}
      onSnapIndexChange={setSnapIndex}
      title="Filters"
      accessibilityLabel="Filters sheet"
    >
      <Text>Only unread</Text>
    </Sheet>
  );
}
```

Non-dismissable sheet (scrim press and drag-down do nothing —
only the caller's action closes):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Button, Sheet } from "@xoroh/axis";

function LockedSheet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      dismissable={false}
      title="Terms"
      accessibilityLabel="Terms sheet"
    >
      <Text>Please read before continuing.</Text>
      <Button onPress={() => setOpen(false)} accessibilityLabel="Accept terms">
        <Text>Accept</Text>
      </Button>
    </Sheet>
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
- Screen-reader users get the drag moves through
  `expand`/`collapse` accessibility actions (labelled "Expand
  sheet" / "Collapse sheet") — gesture parity, not a gesture
  requirement. Collapsing past the first detent dismisses when
  `dismissable`.
- The dismissable scrim is a `Pressable` labelled "Dismiss"; the
  non-dismissable scrim is a plain `View` with no label and no
  handler — no fake affordance. `Modal.onRequestClose` follows
  the same path.
- Closed renders `null`: no host, no scrim, no surface, for
  assistive tech or tests to find.
- Explicitly deferred, each for a named reason: no animation
  (the surface tracks state synchronously — spring/detent
  animation would need the `presence` model to keep the surface
  mounted through transitions — the Dialog precedent); no
  back-handler beyond `Modal.onRequestClose` (a lone surface
  must not own the global back button); no focus trap
  (containing accessibility focus needs the `focusTrap` +
  `overlayModality` RN adaptation — no DOM tab order to borrow).

### Composition

`Sheet` takes `render` (an element, cloned with the surface
props merged under its own, or a `(props, state)` function) and
value-or-function `surfaceStyle` over its state object
(`{ open, snapIndex }`); drag (`PanResponder` handlers), snap,
and dismissal wiring stay on the part. `data-*` attributes are
deliberately absent on native — state flows through those
functions instead (contract §11, parity D1). Verified by the
sheet RNTL suites (12 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/overlays.tsx`.
