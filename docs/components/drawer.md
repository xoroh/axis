## Drawer

Edge-anchored panel with snap points and swipe dismissal.
Compound anatomy per Base UI (Root, Trigger, Portal, Backdrop,
Popup, Title, Description, Close) plus `DrawerHandle` — the
visible grip carrying `dismiss`/`expand`/`collapse`
accessibility actions (the screen-reader gesture parity for
drag). State (open, snap, drag, extent) lives in `DrawerRoot`,
which renders no element; measurement, scrim, surface, and
actions compose below it. Closed renders `null`; open mounts the
surface anchored to its `side` (`"left"` default, `"right"`,
`"top"`, `"bottom"`), with a scrim layer filling the rest. The
bottom-sheet `Sheet` folded into this family in ADR-012 —
`side="bottom"` with `snapPoints` is the sheet.

Structure, behavior, and accessibility only — every visual value
is caller-provided; cross-axis size (width for side drawers,
height for top/bottom) especially is caller geometry. State
follows the controlled + uncontrolled pattern throughout: `open`
(plus `onOpenChange`) for visibility, `snapPoint` (plus
`onSnapPointChange`) for the active snap value.

`snapPoints` are preset resting positions along the dismiss
axis: numbers in (0, 1] are fractions of the measured container
extent (width for `left`/`right`, height for `top`/`bottom`);
numbers greater than 1 are dp; `'NNNpx'` strings are dp. Anything
else resolves out; an empty resolution falls back to `[1]`
(fully open).

Source of truth: `DrawerRootProps`, `DrawerRootState`,
`DrawerTriggerProps`, `DrawerPortalProps`,
`DrawerBackdropProps`, `DrawerPopupProps`, `DrawerTitleProps`,
`DrawerDescriptionProps`, `DrawerCloseProps`,
`DrawerHandleProps`, `DrawerSide`, `DrawerSnapPoint` in
`@xoroh/axis` (`packages/axis/src/components/Drawer.tsx`).

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
| `DrawerRoot` | `Drawer.Root` | State owner (`open`/`snapPoint`/drag/extent); renders no element. |
| `DrawerTrigger` | `Drawer.Trigger` | Button role, expanded state, tap toggles. |
| `DrawerPortal` | `Drawer.Portal` | `OverlayPortal` host at `PortalHost` plus the measured full-bleed container. |
| `DrawerBackdrop` | `Drawer.Backdrop` | Scrim dismissal (modal + dismissable); otherwise an inert host. |
| `DrawerPopup` | `Drawer.Popup` | Edge-anchored surface with drag, translate, and dialog role. |
| `DrawerTitle` | `Drawer.Title` | Heading text (`header` role). |
| `DrawerDescription` | `Drawer.Description` | Descriptive text. |
| `DrawerClose` | `Drawer.Close` | Button that closes the root. |
| `DrawerHandle` | — (Axis addition) | Visible grip: button role, `dismiss`/`expand`/`collapse` accessibility actions, caller-styled. |

Base UI ships no Handle part (its demos use a plain `div`);
Axis adds one because a drag-only grip strands screen-reader
users — the actions are gesture parity, not chrome.

### Overlay hosting

The drawer presents through `OverlayRoot` + `OverlayPortal`
painting at the app's `PortalHost` — the surface escapes
clipped parents without an RN `Modal` of its own. `modal`
(default `true`) forwards to the overlay root; `dismissable`
(default `true`) flows into `dismissable` and every dismiss
branch (`outsidePointer`, `systemBack`, `escape`);
`onDismiss` fires on scrim, drag, or request-close dismissal
before `onOpenChange(false)`. Drag-away dismissal reports
reason `none` (Base UI has no gesture-dismiss reason). A
non-modal drawer keeps its scrim inert; Android back still
dismisses when `dismissable` (it follows `dismissable` alone).

### Focus

SR focus moves into the popup on open. The default initial
target is the popup container or Title (announced with its
label — never a destructive action), or the caller-marked
Close; on web the marked target wins, else Title, else the
container (stops and the DOM tab order are skipped for
drawers). `initialFocus` (element, ref, function of the open
interaction, or `false`) may also be set on the root or popup,
with the popup winning; `finalFocus` (or the trigger) takes
focus back on close. If the trigger unmounted, the web falls
back to the nearest focusable ancestor while it is still
connected (D11); on native nothing happens, never a throw.

Modality: on iOS the popup claims `accessibilityViewIsModal`
(top layer only — non-modal drawers claim nothing); on Android
the app root beside `PortalHost` takes
`importantForAccessibility="no-hide-descendants"` while a modal
is open (see `useModalActive`); on web the popup carries
`aria-modal` and traps Tab.

### Reasons

`onOpenChange(open, details)` carries `details.reason`:
`trigger-press` (trigger toggle, either direction),
`outside-press` (scrim press), `escape-key` (Android back,
iOS VoiceOver scrub), `close-press` (Close press or Handle
dismiss action), `none` (drag-release dismissal — Base UI has
no gesture-dismiss reason, and a drag is neither an outside
press nor a close press). `onSnapPointChange(snapPoint)` fires
on every committed settle.

### Props

#### `DrawerRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean, details?: { reason }) => void` | no | — | Fires with the next open state on every committed open or dismissal, with the reason. |
| `onDismiss` | `() => void` | no | — | Fires on scrim, drag, or request-close dismissal, before `onOpenChange(false)`. |
| `dismissable` | `boolean` | no | `true` | When `false`, scrim press and drag-away do nothing. |
| `modal` | `boolean` | no | `true` | Modal presentation; `false` keeps the scrim inert. |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | no | `"left"` | Anchored edge (static). |
| `snapPoints` | `DrawerSnapPoint[]` | no | `[1]` | Resting positions (fractions, dp, or px strings). |
| `snapPoint` | `DrawerSnapPoint \| null` | no | — | Controlled active snap point value. |
| `defaultSnapPoint` | `DrawerSnapPoint \| null` | no | first | Uncontrolled initial snap point value. |
| `onSnapPointChange` | `(snapPoint: DrawerSnapPoint) => void` | no | — | Fires on every committed settle. |
| `initialFocus` | ref \| element \| function \| `false` | no | — | Explicit initial focus target (wins over the popup's). |
| `finalFocus` | ref \| element \| function \| `false` | no | — | Explicit restore target (wins over the trigger). |
| `children` | `ReactNode` | no | — | Trigger, Portal, and shared content. Renders no element itself. |

`DrawerRootState`: `{ open, side, snapPoint }`.

#### `DrawerTrigger`

Same shape as `DialogTrigger`: `disabled`, `accessibilityLabel`,
`testID`, value-or-function `style` over `{ open, disabled }`,
`children`, `render`.

#### `DrawerPortal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Portal content (Backdrop + Popup composed by the caller). |
| `testID` | `string` | no | — | Test identifier; the measured container carries `<testID>-container`. |

#### `DrawerBackdrop`

`testID`, value-or-function `style` over `{ open }`, `render`.
Dismisses with `outside-press` when modal and dismissable;
otherwise an inert host.

#### `DrawerPopup` (surface)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `"aria-label"` | `string` | no | — | Accessible name source for the drawer surface. |
| `testID` | `string` | no | — | Test identifier; the container carries `<testID>-container`, the scrim `<testID>-scrim` when set on the portal/backdrop. |
| `style` | value or function of `{ open, side, snapPoint }` | no | — | Surface style, caller-provided (positioned absolute by the part). |
| `children` | `ReactNode` | no | — | Surface content. |
| `render` | element or function | no | — | Element or function substitution; role, modality, drag, and dismissal wiring stay on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View`. |
| `initialFocus` | ref \| element \| function \| `false` | no | — | Explicit initial focus target (wins over the root's). |
| `finalFocus` | ref \| element \| function \| `false` | no | — | Explicit restore target (wins over the trigger). |

#### `DrawerTitle` / `DrawerDescription`

`testID`, `style` (Text), `children`, `render`. Title renders
with the `header` role.

#### `DrawerClose`

`disabled`, `accessibilityLabel`, `testID`, value-or-function
`style` over `{ disabled }`, `children`, `render`, plus
`initialFocus?: boolean` — mark this Close as the default
initial focus target.

#### `DrawerHandle`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | value or function of `{ open, activeSnap, snapCount }` | no | — | Grip style, caller-provided. |
| `children` | `ReactNode` | no | — | Handle content (usually none — the grip is caller style). |
| `render` | element or function | no | — | Element or function substitution (Base UI parity). |

Tap expands one snap; the `dismiss`, `expand`, and `collapse`
accessibility actions dismiss or step the snap. At the floor
snap, collapse dismisses when `dismissable` (otherwise it snaps
back) — the same rule as drag-release.

### Examples

Side drawer with snap points and a handle:

```tsx
import { Text } from "react-native";
import {
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerHandle,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "@xoroh/axis";

function SettingsDrawer() {
  return (
    <DrawerRoot side="right" snapPoints={[0.5, 1]}>
      <DrawerTrigger>
        <Text>Open settings</Text>
      </DrawerTrigger>
      <DrawerPortal testID="settings">
        <DrawerBackdrop testID="settings-scrim" />
        <DrawerPopup
          testID="settings-popup"
          aria-label="Settings"
        >
          <DrawerHandle />
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>
            Move between sections of the app.
          </DrawerDescription>
          <DrawerClose>
            <Text>Close</Text>
          </DrawerClose>
        </DrawerPopup>
      </DrawerPortal>
    </DrawerRoot>
  );
}
```

Bottom sheet (the folded `Sheet`):

```tsx
<DrawerRoot side="bottom" snapPoints={[0.5, 1]}>
  {/* ...same parts: Trigger, Portal, Backdrop, Popup, Title,
      Description, Handle, Close... */}
</DrawerRoot>
```

### Accessibility

- The surface is an accessibility element (`accessible`)
  carrying the `dialog` role, so the role reaches assistive
  technology.
- Drag has screen-reader parity: `DrawerHandle` exposes
  `dismiss`/`expand`/`collapse` actions; a drag the SR user
  cannot perform is never the only path.
- The scrim is labelled `"Dismiss"` only when modal and
  dismissable; otherwise a plain host with no handler.
- Closed renders `null`: no scrim, no surface, for assistive
  tech or tests to find.
- Focus: container-or-Title default (never destructive),
  marked-Close override, trigger/`finalFocus` restore, D11
  unmounted-trigger rule; modality per platform (see Focus
  above).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function)
and value-or-function `style` over its state object; `data-*`
attributes are deliberately absent on native (contract §11,
parity D1). Verified by the drawer RNTL suites and the web
focus suites. Renders in
`apps/example/src/demos/overlays.tsx`.
