## Dialog

Unstyled modal dialog with scrim dismissal. Closed renders
`null`; open presents through `OverlayRoot` + `OverlayPortal`
painting at the app's `PortalHost`, holding a scrim layer
with the dialog surface inside it. Structure, behavior, and
accessibility only — every visual value (`overlayStyle`,
`surfaceStyle`, `titleStyle`) is caller-provided. State follows
the controlled + uncontrolled pattern throughout: `open` (plus
`onOpenChange`) for controlled use, `defaultOpen` for
uncontrolled. Two APIs ship side by side: the concise
single-part `Dialog` (anchor props partitioned into
`title`/`children`/`actions`) and the compound parts below,
which mirror Base UI's Dialog anatomy with the same names and
state semantics.

Source of truth: `DialogProps`, `DialogRootProps`,
`DialogRootState`, `DialogTriggerProps`,
`DialogTriggerState`, `DialogBackdropProps`,
`DialogBackdropState`, `DialogPopupProps`, `DialogPopupState`,
`DialogTitleProps`, `DialogDescriptionProps`,
`DialogCloseProps`, `DialogCloseState`, `DialogPortalProps` in
`@xoroh/axis`
(`packages/axis/src/components/Dialog.tsx:72-104, 238-373`).

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
| `Dialog` | — | Concise single-part API (`title`/`children`/`actions`); kept for existing consumers, not a Base UI part. |
| `DialogRoot` | `Dialog.Root` | State owner (`open`/`defaultOpen`/`onOpenChange`); renders no element. |
| `DialogTrigger` | `Dialog.Trigger` | Button role, expanded state, tap toggles. |
| `DialogPortal` | `Dialog.Portal` | `OverlayPortal` host at `PortalHost` — the native portal. |
| `DialogBackdrop` | `Dialog.Backdrop` | Scrim dismissal (`disablePointerDismissal` lives on Root; the monolith spells it `dismissable`). |
| `DialogPopup` | `Dialog.Popup` | Surface view carrying the dialog role. |
| `DialogTitle` | `Dialog.Title` | Heading text (`header` role). |
| `DialogDescription` | `Dialog.Description` | Descriptive text. |
| `DialogClose` | `Dialog.Close` | Button that closes the root. |

Omitted Base UI pieces are documented deviations, not
oversights: no `Viewport` (a Popup scrolls through caller
`ScrollView` content), no `initialFocus`/`finalFocus` or
`"trap-focus"` containment, no nested-dialog coordination, no
`createHandle` detached triggers, no `Portal`
`container`/`keepMounted` — all recorded in
`docs/BASE_UI_PARITY.md` (§ Dialog — aligned).

### Overlay hosting

Both APIs present through `OverlayRoot` + `OverlayPortal`
painting at the app's `PortalHost` — the surface escapes
clipped parents without an RN `Modal` of its own (one root
presents every layer: Android back, stacking, focus, and scroll
lock belong to the `OverlayRoot` above). `modal` defaults to
`true` on the compound root (`"trap-focus"` behaves as modal).
`modal` is always on for the monolith. `disablePointerDismissal`
(default `false`; the monolith spells it `dismissable`,
default `true`) flows into `dismissable` and every dismiss
branch (`outsidePointer`, `systemBack`, `escape`); `onDismiss`
fires on scrim (or request-close) dismissal before
`onOpenChange(false)`. No family part takes `useModal` itself —
the RN `Modal` host is an `OverlayRoot`-level opt-in for direct
`Overlay` compositions (see `docs/components/overlay.md`).

### Focus

SR focus moves into the surface on open and restores to the
trigger or `finalFocus` on close. The default initial target is
the first focusable element (the caller-marked `Close`, else
the first stop, else `Title`), else the popup itself; on web
the first tabbable element in the popup wins unless a target is
marked. Set `initialFocus` (element, ref, function of the open
interaction, or `false`) on the root or popup (popup wins), and
`finalFocus` the same way. If the trigger unmounted, the web
falls back to the nearest focusable ancestor while it is still
connected (D11); on native nothing happens, never a throw.

Modality: on iOS the popup claims
`accessibilityViewIsModal` (top layer only — the scrim sibling
hides from VoiceOver exactly like the trigger does); on
Android the app root beside `PortalHost` takes
`importantForAccessibility="no-hide-descendants"` while a modal
is open (see `useModalActive`); on web the popup carries
`aria-modal` and traps Tab. Dialog closes in the compound get
an `initialFocus` marker prop for the default-target marking.

### Reasons

`onOpenChange(open, details)` carries `details.reason`:
`trigger-press` (trigger toggle, either direction),
`outside-press` (scrim/backdrop press), `escape-key` (Android
hardware back, iOS VoiceOver scrub), `close-press` (Close
press).

### Props

#### `Dialog` (concise single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed dismiss. |
| `onDismiss` | `() => void` | no | — | Fires on scrim (or request-close) dismissal, before `onOpenChange(false)`. |
| `dismissable` | `boolean` | no | `true` | When `false`, scrim press does nothing: the scrim renders as a plain `View` with no dismiss label, so the dialog can only close through the caller's own actions (the AlertDialog pattern). |
| `title` | `ReactNode` | no | — | Dialog title, rendered in a `Text` when provided. |
| `children` | `ReactNode` | no | — | Dialog content. |
| `actions` | `ReactNode` | no | — | Action row content, rendered in a `View` row when provided. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the dialog surface. |
| `testID` | `string` | no | — | Test identifier; the surface carries it, the scrim carries `<testID>-scrim`. |
| `overlayStyle` | `StyleProp<ViewStyle>` | no | — | Scrim layer style, caller-provided. |
| `surfaceStyle` | `StyleProp<ViewStyle>` | no | — | Dialog surface (box) style, caller-provided. |
| `titleStyle` | `StyleProp<TextStyle>` | no | — | Title text style, caller-provided. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View`. |

#### `DialogRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean, details?: { reason }) => void` | no | — | Fires with the next open state on every committed open or dismissal, with the reason. |
| `onDismiss` | `() => void` | no | — | Fires on backdrop (or request-close) dismissal, before `onOpenChange(false)`. |
| `disablePointerDismissal` | `boolean` | no | `false` | When `true`, backdrop press does not dismiss (Base UI parity name for the monolith's `dismissable={false}`). |
| `modal` | `boolean \| "trap-focus"` | no | `true` | The surface always presents modally on native; `"trap-focus"` behaves as modal. |
| `initialFocus` | ref \| element \| function \| `false` | no | — | Explicit initial focus target (wins over the popup's). |
| `finalFocus` | ref \| element \| function \| `false` | no | — | Explicit restore target (wins over the trigger). |
| `children` | `ReactNode` | no | — | Trigger, Portal, and shared content. Renders no element itself. |

`DialogRootState`: `{ open: boolean }` — the current open state.

#### `DialogTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never opens and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<DialogTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `children` | `ReactNode` | no | — | Trigger content. |
| `render` | `RenderProp<DialogTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`DialogTriggerState`: `{ open: boolean; disabled: boolean }` —
whether the dialog is open, and whether the trigger is disabled.

#### `DialogPortal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Portal content (Backdrop + Popup composed by the caller). |
| `testID` | `string` | no | — | Test identifier, forwarded to the portal host. |

The portal renders `null` outside a root and while closed —
there is no keep-alive (`docs/BASE_UI_PARITY.md`, D3).

#### `DialogBackdrop`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the scrim host. |
| `style` | `StateStyle<DialogBackdropState, StyleProp<ViewStyle>>` | no | — | Scrim style: a value or a function of backdrop state. |
| `render` | `RenderProp<DialogBackdropState, SlotProps>` | no | — | Element or function substitution; dismissal wiring stays on the part. |

`DialogBackdropState`: `{ open: boolean }`. Renders `null`
outside a root and while closed. When
`disablePointerDismissal` is set on the root, the scrim is a
plain host with no label and no handler — no fake affordance.

#### `DialogPopup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `accessibilityLabel` | `string` | no | — | Accessible name source for the surface. |
| `role` | `"dialog" \| "alertdialog"` | no | `"dialog"` | Surface role; AlertDialog passes `"alertdialog"`. |
| `testID` | `string` | no | — | Test identifier, forwarded to the surface. |
| `style` | `StateStyle<DialogPopupState, StyleProp<ViewStyle>>` | no | — | Surface style: a value or a function of popup state. |
| `children` | `ReactNode` | no | — | Surface content. |
| `render` | `RenderProp<DialogPopupState, SlotProps>` | no | — | Element or function substitution; role and label stay on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View`. |
| `initialFocus` | ref \| element \| function \| `false` | no | — | Explicit initial focus target (wins over the root's). Default: first focusable element (marked, stops), else Title, else the popup. |
| `finalFocus` | ref \| element \| function \| `false` | no | — | Explicit restore target (wins over the trigger). |

`DialogPopupState`: `{ open: boolean }`. Renders `null`
outside a root and while closed.

#### `DialogTitle`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the title text. |
| `style` | `StyleProp<TextStyle>` | no | — | Title text style, caller-provided (static — the title carries no state). |
| `children` | `ReactNode` | no | — | Heading content. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `DialogDescription`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the description text. |
| `style` | `StyleProp<TextStyle>` | no | — | Description text style, caller-provided (static — the description carries no state). |
| `children` | `ReactNode` | no | — | Description content. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `DialogClose`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never closes and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the close host. |
| `style` | `StateStyle<DialogCloseState, StyleProp<ViewStyle>>` | no | — | Close style: a value or a function of close state. |
| `children` | `ReactNode` | no | — | Button content. |
| `render` | `RenderProp<DialogCloseState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `initialFocus` | `boolean` | no | `false` | Mark this Close as the default initial focus target (how AlertDialog marks Cancel). |

`DialogCloseState`: `{ disabled: boolean }`. Outside a root
there is nothing to close: the button renders inert rather
than dropping silently.

### Examples

Minimal monolith, uncontrolled (opens on mount):

```tsx
import { Text } from "react-native";
import { Dialog } from "@xoroh/axis";

function Welcome() {
  return (
    <Dialog
      defaultOpen
      title="Welcome"
      accessibilityLabel="Welcome dialog"
      surfaceStyle={{ margin: 32, padding: 16 }}
    >
      <Text>Thanks for installing.</Text>
    </Dialog>
  );
}
```

Controlled with an explicit non-dismissable action row (the
AlertDialog pattern — scrim press does nothing, only the
actions close):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Button, Dialog } from "@xoroh/axis";

function DeleteConfirm() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)} accessibilityLabel="Delete item">
        <Text>Delete</Text>
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        dismissable={false}
        title="Delete this item?"
        accessibilityLabel="Delete confirmation"
        surfaceStyle={{ margin: 32, padding: 16 }}
        actions={
          <Button onPress={() => setOpen(false)} accessibilityLabel="Confirm delete">
            <Text>Delete</Text>
          </Button>
        }
      >
        <Text>This cannot be undone.</Text>
      </Dialog>
    </>
  );
}
```

Compound form (Base UI anatomy — trigger, portal, backdrop,
popup, title, description, close):

```tsx
import { Text } from "react-native";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@xoroh/axis";

function CompoundDialog() {
  return (
    <DialogRoot>
      <DialogTrigger accessibilityLabel="Open settings dialog">
        <Text>Open</Text>
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          accessibilityLabel="Settings"
          style={{ margin: 32, padding: 16 }}
        >
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Adjust your preferences.</DialogDescription>
          <DialogClose accessibilityLabel="Close settings">
            <Text>Close</Text>
          </DialogClose>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
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
  smuggled past the typechecker.
- The dismissable scrim is a `Pressable` labelled "Dismiss";
  scrim press and system back share one dismiss path
  (`onDismiss`, then `onOpenChange(false)`), guarded on
  `dismissable`/`disablePointerDismissal`. The non-dismissable
  scrim is a plain `View` with no label and no handler — no fake
  affordance.
- Closed renders `null`: no scrim, no surface, no portal host
  for assistive tech or tests to find.
- Explicitly deferred, each for a named reason: no animation
  (the surface mounts/unmounts synchronously with state — exit
  transitions would need the `presence` model to keep it mounted,
  unneeded until a consumer needs animated dismissal); no
  `BackHandler` beyond what the overlay root already wires to
  the system-back branch (a lone dialog owning the global back
  button would fight the dismissal stack the moment a second
  overlay exists); no focus trap and no
  `initialFocus`/`finalFocus` (containing accessibility focus
  needs the `focusTrap` + `overlayModality` RN adaptation — no
  DOM tab order to borrow); no `Viewport` part (a Popup scrolls
  through caller `ScrollView` content); no nested-dialog
  coordination beyond the overlay root's stack (parity D6).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open }`,
`{ open, disabled }`, `{ disabled }`), except `Title`/
`Description`, whose text `style` stays static (the
`DialogTitle` precedent — a function of empty state adds
nothing); `data-*` attributes are deliberately absent on
native — state flows through those functions instead (contract
§11, parity D1). The omitted Base UI pieces (`Viewport`,
`initialFocus`/`finalFocus`, nested coordination,
`createHandle`, `Portal` `container`/`keepMounted`) and the
`modal`/`"trap-focus"` behavior are recorded in
`docs/BASE_UI_PARITY.md` (§ Dialog — aligned). `AlertDialog`
is rebuilt on these compound parts. Verified by the dialog
RNTL suites (8 monolith + 11 compound tests —
`docs/COVERAGE.md`). The compound anatomy renders in
`apps/example/src/demos/dialog.tsx`.
