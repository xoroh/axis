## Tooltip

Anchored hint on long-press: long-press the anchor to toggle; the
tip is measured and placed with the shared floating-placement
plumbing (anchor `measure()` + viewport + rect math) and stays
transparent until measured rather than flashing somewhere wrong.
Structure, behavior, and accessibility only — every visual value
is caller-provided. State follows the
controlled + uncontrolled pattern throughout: `open` (plus
`onOpenChange`) for controlled use, `defaultOpen` for
uncontrolled. The compound parts
below mirror Base UI's Tooltip anatomy with the same names
and state semantics.

Source of truth: `TooltipProviderProps`, `TooltipRootProps`,
`TooltipTriggerProps`, `TooltipTriggerState`,
`TooltipPortalProps`, `TooltipPositionerProps`,
`TooltipPositionerState`, `TooltipPopupProps`,
`TooltipPopupState`, `TooltipArrowProps` in `@xoroh/axis`
(`packages/axis/src/components/Tooltip.tsx:43-180, 205-323`).

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
| `TooltipProvider` | `Tooltip.Provider` | Groups tips under one show/hide timing (`delay`/`closeDelay`); renders no element. |
| `TooltipRoot` | `Tooltip.Root` | Visibility state owner (`open`/`defaultOpen`/`onOpenChange`, terminal `disabled`); renders no element. |
| `TooltipTrigger` | `Tooltip.Trigger` | Long-press toggle, anchor-registering; `delayLongPress` forwarded to the host. |
| `TooltipPortal` | `Tooltip.Portal` | Plain `Portal` host at the app's `PortalHost` — deliberately never a `Modal` host (see below). |
| `TooltipPositioner` | `Tooltip.Positioner` | Measured placement against the trigger anchor (`side`/`align`/offsets, viewport flip). |
| `TooltipPopup` | `Tooltip.Popup` | Tip carrying the `tooltip` role. |
| `TooltipArrow` | `Tooltip.Arrow` | Caller-positioned marker; geometry is caller style. |

Omitted Base UI pieces are documented deviations, not
oversights: no `Modal` portal host (see below), no hover model
(no pointer on touch devices), no scrim/Backdrop (dismissal is a
second long-press — there is no scrim), no transition attributes
(D9), no `data-*` attributes (D1) — all recorded in
`docs/BASE_UI_PARITY.md` (§ Tooltip — aligned).

### Why the tooltip is not on OverlayRoot

A tooltip is a non-modal hint: it must never trap touches, so it
must never take a `Modal` host — and `OverlayRoot` exists to own
modal presentation (scrim, back handling, scroll lock, top-layer
isolation for surfaces that take over the screen). Mounting a
hint in that stack would buy nothing and risk everything: a
full-fill scrim with no dismissal path except the trigger, focus
moves on every hint show, scroll locks under a fingertip. So
`TooltipPortal` presents through the plain `Portal`
at the app's `PortalHost` — above sibling content, never modal — and
positioning stays separable from the host either way. The other
overlay families (`Select`, `Menu`, `Dialog`, `Popover`,
`Drawer`) DO present through `OverlayRoot` + `OverlayPortal` at
the app's `PortalHost` — see `docs/components/overlay.md` for
that stack and the `useModal` opt-in, which tooltips
deliberately do not use.

### Props

#### `TooltipProvider` (timing owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `delay` | `number` | no | `0` | Delay in milliseconds before a tip shows after its trigger fires. Groups tips under one timing so a screen of hints behaves as one (the Base UI `Provider` delay, adapted: hover has no touch equivalent, so the delay runs from the long-press commit, not from hover). |
| `closeDelay` | `number` | no | `0` | Delay in milliseconds before a tip hides after its dismiss fires. |
| `children` | `ReactNode` | no | — | Tooltip roots sharing this timing. |

A pending show cancels when a dismiss lands first — no ghost tips.

#### `TooltipRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled visibility. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial visibility. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires on every visibility change. |
| `disabled` | `boolean` | no | `false` | Terminal: the tip never shows, no callbacks. |
| `children` | `ReactNode` | no | — | Trigger, Portal, and shared content. Renders no element itself. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded nowhere (the root renders no element); accepted so ref-spreading callers typecheck. |

#### `TooltipTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: long-press never toggles and is announced as disabled. |
| `"aria-label"` | `string` | no | — | Accessible name source for the anchor. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `delayLongPress` | `number` | no | — | Long-press duration in milliseconds, forwarded to the host `Pressable`. Absent means the platform default. |
| `style` | `StateStyle<TooltipTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `children` | `ReactNode` | no | — | Anchor content the tip describes. |
| `render` | `RenderProp<TooltipTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`TooltipTriggerState`: `{ open: boolean; disabled: boolean }` —
whether the tip is currently showing, and whether the trigger is
disabled.

#### `TooltipPortal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Portal content (Positioner composed by the caller). |
| `testID` | `string` | no | — | Test identifier, forwarded to the portal host. |

In-box host, never a `Modal`: a non-modal hint must not trap
touches. Renders `null` outside a root and while hidden. The
part exists so callers compose the Base UI shape — and keep the
escape hatch if a modal tip is ever proven necessary.

#### `TooltipPositioner`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `side` | `Placement` | no | `"top"` | Preferred side for the tip. |
| `align` | `Align` | no | `"center"` | Cross-axis alignment. |
| `sideOffset` | `number` | no | `0` | Gap between anchor and tip edges. |
| `alignOffset` | `number` | no | `0` | Shift along the cross axis after alignment. |
| `testID` | `string` | no | — | Test identifier, forwarded to the positioner host. |
| `style` | `StateStyle<TooltipPositionerState, StyleProp<ViewStyle>>` | no | — | Positioner style: a value or a function of positioner state. |
| `children` | `ReactNode` | no | — | Popup (and optional Arrow content) composed by the caller. |
| `render` | `RenderProp<TooltipPositionerState, SlotProps>` | no | — | Element or function substitution; measurement stays on the part. |

`TooltipPositionerState`: `{ open: boolean; side: Placement }` —
the effective side after viewport flip/clamping. Renders `null`
outside a root and while hidden.

#### `TooltipPopup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `"aria-label"` | `string` | no | — | Accessible name source for the tip. |
| `testID` | `string` | no | — | Test identifier, forwarded to the tip `View`. |
| `style` | `StateStyle<TooltipPopupState, StyleProp<ViewStyle>>` | no | — | Tip style: a value or a function of popup state. |
| `children` | `ReactNode` | no | — | Tip content. |
| `render` | `RenderProp<TooltipPopupState, SlotProps>` | no | — | Element or function substitution; the tooltip role stays on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the tip `View`. |

`TooltipPopupState`: `{ open: boolean }`. Renders `null`
outside a root and while hidden.

#### `TooltipArrow`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the arrow host. |
| `style` | `StyleProp<ViewStyle>` | no | — | Marker style, caller-provided (static — positioning is caller geometry). |
| `children` | `ReactNode` | no | — | Marker content (usually none — the shape is caller style). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

### Examples

Minimal compound tip, uncontrolled (long-press the anchor for the
tip):

```tsx
import { Text } from "react-native";
import {
  TooltipPopup,
  TooltipPositioner,
  TooltipRoot,
  TooltipTrigger,
} from "@xoroh/axis";

function Hint() {
  return (
    <TooltipRoot>
      <TooltipTrigger aria-label="Saved details">
        <Text>Info</Text>
      </TooltipTrigger>
      <TooltipPositioner>
        <TooltipPopup style={{ padding: 8 }}>
          <Text>Saved yesterday at 14:02.</Text>
        </TooltipPopup>
      </TooltipPositioner>
    </TooltipRoot>
  );
}
```

Controlled with placement (parent owns the visibility):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  TooltipPopup,
  TooltipPositioner,
  TooltipRoot,
  TooltipTrigger,
} from "@xoroh/axis";

function ControlledHint() {
  const [open, setOpen] = useState(false);
  return (
    <TooltipRoot open={open} onOpenChange={setOpen}>
      <TooltipTrigger aria-label="Row help">
        <Text>Help</Text>
      </TooltipTrigger>
      <TooltipPositioner side="top">
        <TooltipPopup>
          <Text>Press any row for options.</Text>
        </TooltipPopup>
      </TooltipPositioner>
    </TooltipRoot>
  );
}
```

Compound form (Base UI anatomy — provider, root, trigger,
portal, positioner, popup), sharing one show timing across tips:

```tsx
import { Text } from "react-native";
import {
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@xoroh/axis";

function CompoundHint() {
  return (
    <TooltipProvider delay={100}>
      <TooltipRoot>
        <TooltipTrigger aria-label="More info">
          <Text>Info</Text>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipPositioner side="top">
            <TooltipPopup aria-label="Details">
              <Text>Details here</Text>
            </TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  );
}
```

### Accessibility

- The tip is an accessibility element (`accessible`) carrying
  the `tooltip` role and `accessibilityLabel`, so the hint is
  announced — a tip whose role never reaches assistive tech is
  broken.
- The trigger carries the accessible name and `delayLongPress`;
  a disabled trigger is announced as disabled and never toggles.
- The arrow renders `accessible={false}` so it never appears in
  the tree.
- No scrim exists to dismiss through: dismissal is a second
  long-press or the controlled prop.
- Hidden renders the anchor only: no tip for assistive tech or tests to find.
- Explicitly deferred, each for a named reason: no hover model
  (no pointer on touch devices — parity D8; timing itself needs a
  finger — RNTL dispatches `longPress` directly, and a
  device/screen-reader pass has never been run); no animation
  (the tip mounts/unmounts synchronously with state — exit
  transitions would need the `presence` model to keep it mounted,
  unneeded until a consumer needs animated dismissal); no focus
  trap (a hint must not move or contain focus — the opposite of
  the Dialog precedent).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open }`,
`{ open, disabled }`), except `Arrow`, whose style stays static
(the `DialogTitle` precedent — a function of empty state adds
nothing); `data-*` attributes are deliberately absent on
native — state flows through those functions instead (contract
§11, parity D1). `TooltipProvider` is the only timing owner:
`delay`/`closeDelay` both default `0` (instant). The omitted
Base UI pieces (hover, `Modal` host, transition attributes) are
recorded in `docs/BASE_UI_PARITY.md` (§ Tooltip — aligned).
Verified by the tooltip RNTL suites (13 tests —
`docs/COVERAGE.md`). The compound anatomy renders in
`apps/example/src/demos/overlays.tsx`.
