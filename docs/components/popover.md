## Popover

Non-modal anchored overlay with tap toggle and scrim dismissal.
Tap the anchor to toggle; the box is measured and placed with
`useFloatingPlacement` (anchor `measure()` + viewport +
`resolveFloatingRect`) — until measured it stays transparent at
origin rather than flashing somewhere wrong. Structure,
behavior, and accessibility only — every visual value (`style`,
`popoverStyle`) is caller-provided. State follows the controlled
+ uncontrolled pattern throughout: `open` (plus `onOpenChange`)
for controlled use, `defaultOpen` for uncontrolled. Two APIs ship
side by side: the concise single-part `Popover` (anchor and body
partitioned into the `children`/`content` props, always
non-modal) and the compound parts below, which mirror
Base UI's Popover anatomy with the same names and state
semantics.

Source of truth: `PopoverProps`, `PopoverRootProps`,
`PopoverRootState`, `PopoverTriggerProps`,
`PopoverTriggerState`, `PopoverBackdropProps`,
`PopoverBackdropState`, `PopoverPositionerProps`,
`PopoverPositionerState`, `PopoverPopupProps`,
`PopoverPopupState`, `PopoverTitleProps`,
`PopoverDescriptionProps`, `PopoverCloseProps`,
`PopoverCloseState`, `PopoverArrowProps`,
`PopoverPortalProps` in `@xoroh/axis`
(`packages/axis/src/components/Popover.tsx:77-104, 243-414`).

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
| `Popover` | — | Concise inline API (anchor `children` + body `content`); always non-modal, presenting through `Portal` at the app's `PortalHost`, not a Base UI part. |
| `PopoverRoot` | `Popover.Root` | State owner (`open`/`defaultOpen`/`onOpenChange`); renders no element. `modal` defaults `false` — the inverse of Dialog/Menu. |
| `PopoverTrigger` | `Popover.Trigger` | Tap toggle, button role, expanded state, anchor-registering. |
| `PopoverPortal` | `Popover.Portal` | `OverlayPortal` host at `PortalHost` when modal, plain `Portal` at `PortalHost` otherwise. |
| `PopoverBackdrop` | `Popover.Backdrop` | Scrim dismissal, modal-only. |
| `PopoverPositioner` | `Popover.Positioner` | Measured placement against the trigger anchor (`side`/`align`/offsets). |
| `PopoverPopup` | `Popover.Popup` | Content region (labelled, no role — see Accessibility). |
| `PopoverTitle` | `Popover.Title` | Heading text (`header` role). |
| `PopoverDescription` | `Popover.Description` | Descriptive text. |
| `PopoverClose` | `Popover.Close` | Button that closes the root. |
| `PopoverArrow` | `Popover.Arrow` | Caller-positioned marker; geometry is caller style. |

Omitted Base UI pieces are documented deviations, not
oversights: no `data-*` attributes (D1), no `Portal`
`container` (D2), no `Viewport` (caller `ScrollView` content),
no focus containment (D5), no animation states (D9), no
`modal`-with-trap-focus distinction, and no popover role claim
— all recorded in `docs/BASE_UI_PARITY.md` (§ Popover —
aligned).

### Overlay hosting

The compound popover presents through `OverlayRoot` +
`OverlayPortal` painting at the app's `PortalHost` — the box
escapes clipped parents without an RN `Modal` of its own (one
root presents every layer: Android back, stacking, focus, and
scroll lock belong to the `OverlayRoot` above). `modal`
defaults to `false` — the inverse of Dialog/Menu: modal roots
paint at `PortalHost` with a scrim; non-modal roots (the
default) present through the plain `Portal` at the app's
`PortalHost` with no scrim and the trigger stays
pressable. `disablePointerDismissal` (default `false`) flows
into `dismissable` and every dismiss branch
(`outsidePointer`, `systemBack`, `escape`); `onDismiss` fires
on scrim dismissal before `onOpenChange(false)`. No family part
takes `useModal` itself — the RN `Modal` host is an
`OverlayRoot`-level opt-in for direct `Overlay` compositions
(see `docs/components/overlay.md`). The monolith never touches
this stack: scrim and box present through `Portal` at the app's
`PortalHost` — above sibling content instead of inside the anchor
wrapper — always non-modal by design.

### Focus

SR focus moves into the box on open and restores to the anchor
on close — silent when the box carries no label. The default
initial target is the first focusable element (marked, stops),
else Title, else the box; on web the first tabbable element
wins unless a target is marked. Set `initialFocus` (element,
ref, function of the open interaction, or `false`) on the root
or popup (popup wins), and `finalFocus` the same way. If the
anchor unmounted, the web falls back to the nearest focusable
ancestor while it is still connected (D11); on native nothing
happens, never a throw.

Modality: modal popovers claim iOS `accessibilityViewIsModal`
(top layer only), Android app-root hiding, and web `aria-modal`
plus the Tab trap. Non-modal popovers (the default) claim
nothing — neither trap focus nor hide anything. Monoliths are
always non-modal with the same move/restore.

### Reasons

`onOpenChange(open, details)` carries `details.reason`:
`trigger-press` (tap toggle, either direction),
`outside-press` (scrim/backdrop press), `escape-key` (Android
hardware back, iOS VoiceOver scrub). Monolith and compound
report the same reasons.

### Props

#### `Popover` (concise inline API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean, details?: { reason }) => void` | no | — | Fires with the next open state on every committed toggle or dismiss, with the reason. |
| `onDismiss` | `() => void` | no | — | Fires on scrim dismissal, before `onOpenChange(false)`. |
| `placement` | `Placement` | no | `"bottom"` | Preferred side (the `resolveFloatingRect` fallback). Clamped into the viewport. |
| `children` | `ReactNode` | yes | — | Anchor content the popover is attached to. Tap toggles. |
| `content` | `ReactNode` | yes | — | Popover body content (an empty box is a bug). |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the popover region. |
| `testID` | `string` | no | — | Test identifier; the box carries it, the scrim carries `<testID>-scrim`. |
| `style` | `StyleProp<ViewStyle>` | no | — | Anchor wrapper style, caller-provided. |
| `popoverStyle` | `StyleProp<ViewStyle>` | no | — | Popover box style, caller-provided. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the anchor wrapper host element. |

Closed renders the anchor only — no scrim, no box. Unlike
Dialog there is no `Modal` here: scrim and box present through
`Portal` at the app's `PortalHost`, above sibling content.

#### `PopoverRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean, details?: { reason }) => void` | no | — | Fires with the next open state on every committed toggle or dismissal, with the reason. |
| `onDismiss` | `() => void` | no | — | Fires on scrim dismissal, before `onOpenChange(false)`. |
| `disablePointerDismissal` | `boolean` | no | `false` | When `true`, backdrop press does not dismiss. |
| `modal` | `boolean` | no | `false` | Whether the open popover presents modally (an overlay host with a scrim). Default `false` — popovers are non-modal overlays; the portal presents through `Portal` at the app's `PortalHost` and the trigger stays pressable. |
| `initialFocus` | ref \| element \| function \| `false` | no | — | Explicit initial focus target (wins over the popup's). |
| `finalFocus` | ref \| element \| function \| `false` | no | — | Explicit restore target (wins over the anchor). |
| `children` | `ReactNode` | no | — | Trigger, Portal, and shared content. Renders no element itself. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Accepted for ref-spreading callers; the root renders no element. |

`PopoverRootState`: `{ open: boolean }` — the current open state.

#### `PopoverTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never toggles and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<PopoverTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `children` | `ReactNode` | no | — | Trigger (anchor) content. |
| `render` | `RenderProp<PopoverTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`PopoverTriggerState`: `{ open: boolean; disabled: boolean }`.

#### `PopoverPortal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Portal content (Backdrop + Positioner composed by the caller). |
| `testID` | `string` | no | — | Test identifier, forwarded to the portal host. |

Renders `null` outside a root and while closed. Modal roots
paint at the app's `PortalHost`; non-modal roots (the default)
present through the plain `Portal` at the app's `PortalHost`
with no scrim trap.

#### `PopoverBackdrop`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the scrim host. |
| `style` | `StateStyle<PopoverBackdropState, StyleProp<ViewStyle>>` | no | — | Scrim style: a value or a function of backdrop state. |
| `render` | `RenderProp<PopoverBackdropState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`PopoverBackdropState`: `{ open: boolean }`. The backdrop
exists only for modal roots: without an overlay host a
full-fill scrim would trap the app's touches with no dismissal
path except the trigger, so non-modal roots render no
backdrop — the trigger stays pressable instead. Renders `null`
outside a root and while closed.

#### `PopoverPositioner`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `side` | `Placement` | no | `"bottom"` | Preferred side for the content box. |
| `align` | `Align` | no | `"center"` | Cross-axis alignment. |
| `sideOffset` | `number` | no | `0` | Gap between anchor and content edges. |
| `alignOffset` | `number` | no | `0` | Shift along the cross axis after alignment. |
| `testID` | `string` | no | — | Test identifier, forwarded to the positioner host. |
| `style` | `StateStyle<PopoverPositionerState, StyleProp<ViewStyle>>` | no | — | Positioner style: a value or a function of positioner state. |
| `children` | `ReactNode` | no | — | Popup (and optional Arrow content) composed by the caller. |
| `render` | `RenderProp<PopoverPositionerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`PopoverPositionerState`: `{ open: boolean }`. Renders `null`
outside a root and while closed.

#### `PopoverPopup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `accessibilityLabel` | `string` | no | — | Accessible name source for the popover region (no role — see Accessibility). |
| `testID` | `string` | no | — | Test identifier, forwarded to the content `View`. |
| `style` | `StateStyle<PopoverPopupState, StyleProp<ViewStyle>>` | no | — | Popup style: a value or a function of popup state. |
| `children` | `ReactNode` | no | — | Popup content. |
| `render` | `RenderProp<PopoverPopupState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the content `View`. |
| `initialFocus` | ref \| element \| function \| `false` | no | — | Explicit initial focus target (wins over the root's). |
| `finalFocus` | ref \| element \| function \| `false` | no | — | Explicit restore target (wins over the anchor). |

`PopoverPopupState`: `{ open: boolean }`. Renders `null`
outside a root and while closed.

#### `PopoverTitle`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the title text. |
| `style` | `StyleProp<TextStyle>` | no | — | Title text style, caller-provided (static — the title carries no state). |
| `children` | `ReactNode` | no | — | Heading content. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `PopoverDescription`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the description text. |
| `style` | `StyleProp<TextStyle>` | no | — | Description text style, caller-provided (static — the description carries no state). |
| `children` | `ReactNode` | no | — | Description content. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `PopoverClose`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never closes and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the close host. |
| `style` | `StateStyle<PopoverCloseState, StyleProp<ViewStyle>>` | no | — | Close style: a value or a function of close state. |
| `children` | `ReactNode` | no | — | Button content. |
| `render` | `RenderProp<PopoverCloseState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `initialFocus` | `boolean` | no | `false` | Mark this Close as the default initial focus target. |

`PopoverCloseState`: `{ disabled: boolean }`. Outside a root
there is nothing to close: the button renders inert rather
than dropping silently.

#### `PopoverArrow`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the arrow host. |
| `style` | `StyleProp<ViewStyle>` | no | — | Marker style, caller-provided (static — positioning is caller geometry). |
| `children` | `ReactNode` | no | — | Marker content (usually none — the shape is caller style). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

### Examples

Minimal monolith, uncontrolled (tap the anchor to toggle):

```tsx
import { Text } from "react-native";
import { Popover } from "@xoroh/axis";

function Info() {
  return (
    <Popover
      content={<Text>Saved yesterday at 14:02.</Text>}
      accessibilityLabel="Saved details"
    >
      <Text>Info</Text>
    </Popover>
  );
}
```

Controlled with placement (parent owns the open state):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Popover } from "@xoroh/axis";

function Help() {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="top"
      content={<Text>Press any row for options.</Text>}
      accessibilityLabel="Help"
      popoverStyle={{ padding: 12 }}
    >
      <Text>Help</Text>
    </Popover>
  );
}
```

Compound form (Base UI anatomy — trigger, portal, positioner,
popup, title, close), modal so the scrim dismisses:

```tsx
import { Text } from "react-native";
import {
  PopoverClose,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@xoroh/axis";

function CompoundPopover() {
  return (
    <PopoverRoot modal>
      <PopoverTrigger accessibilityLabel="Open profile popover">
        <Text>Profile</Text>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side="bottom" align="start">
          <PopoverPopup
            accessibilityLabel="Profile"
            style={{ padding: 12 }}
          >
            <PopoverTitle>Ada Lovelace</PopoverTitle>
            <PopoverClose accessibilityLabel="Close profile">
              <Text>Close</Text>
            </PopoverClose>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </PopoverRoot>
  );
}
```

### Accessibility

- The box is an accessibility element (`accessible`) carrying
  `accessibilityLabel` so the region is announced — but it
  declares NO role. React Native defines no popover role
  (checked against the installed RN `ViewAccessibility`
  `AccessibilityRole` union, which has none), and an unbacked
  role claim is worse than honest silence.
- The scrim is a transparent absolute-fill `Pressable` labelled
  "Dismiss" — scrim press closes through `onDismiss` + `onOpenChange(false)`.
- Taps inside the box never dismiss: the box is the scrim's
  sibling, not its child (unlike the Dialog surface, which sits
  inside its scrim).
- Closed renders the anchor only: no scrim, no box, for
  assistive tech or tests to find.
- Explicitly deferred, each for a named reason: no animation
  (the box mounts/unmounts synchronously with state — exit
  transitions would need the `presence` model to keep it mounted,
  unneeded until a consumer needs animated dismissal — the
  Dialog precedent); no arrow/chrome on the monolith (unstyled by
  contract — every visual value is caller-provided; the compound
  form's `PopoverArrow` is a caller-positioned marker); no hover
  (no pointer on touch devices — parity D8); no focus trap
  (containing accessibility focus needs the `focusTrap` +
  `overlayModality` RN adaptation — no DOM tab order to borrow —
  so the box only declares its label and leaves traversal to the
  host, the Dialog precedent, parity D5).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open }`,
`{ open, disabled }`, `{ disabled }`), except `Title`/
`Description`/`Arrow`, whose styles stay static (the
`DialogTitle` precedent — a function of empty state adds
nothing); `data-*` attributes are deliberately absent on
native — state flows through those functions instead (contract
§11, parity D1). The compound `modal` defaults to `false`
(popovers are non-modal overlays — the inverse of Dialog/Menu),
and the backdrop exists only for modal roots, since without an
overlay host a full-fill scrim would trap the app's touches
with no dismissal path. The omitted Base UI pieces
(`container`, `Viewport`, focus containment, animation states)
are recorded in `docs/BASE_UI_PARITY.md` (§ Popover —
aligned). Verified by the popover RNTL suites (7 monolith + 11
compound tests — `docs/COVERAGE.md`). The compound anatomy
renders in `apps/example/src/demos/popover.tsx`.
