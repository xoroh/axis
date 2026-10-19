## Dialog

Unstyled modal dialog with scrim dismissal. The compound parts
below mirror Base UI's Dialog anatomy with the same names and
state semantics. Structure,
behavior, and accessibility only — every visual value is
caller-provided. State follows the controlled + uncontrolled
pattern throughout: `open` (plus `onOpenChange`) for controlled
use, `defaultOpen` for uncontrolled.

Source of truth: `DialogRootProps`,
`DialogRootState`, `DialogTriggerProps`,
`DialogTriggerState`, `DialogBackdropProps`,
`DialogBackdropState`, `DialogPopupProps`, `DialogPopupState`,
`DialogTitleProps`, `DialogDescriptionProps`,
`DialogCloseProps`, `DialogCloseState`, `DialogPortalProps` in
`@xoroh/axis`
(`packages/axis/src/components/Dialog.tsx:107-242`).

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
| `DialogRoot` | `Dialog.Root` | State owner (`open`/`defaultOpen`/`onOpenChange`); renders no element. |
| `DialogTrigger` | `Dialog.Trigger` | Button role, expanded state, tap toggles. |
| `DialogPortal` | `Dialog.Portal` | `OverlayPortal` host at `PortalHost` — the native portal. |
| `DialogBackdrop` | `Dialog.Backdrop` | Scrim dismissal (`disablePointerDismissal` lives on Root). |
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
`true` on the compound root (`"trap-focus"` behaves as modal —
focus containment still needs the `focusTrap` RN adaptation);
`disablePointerDismissal` (default `false`)
flows into `dismissable` and every dismiss
branch (`outsidePointer`, `systemBack`, `escape`); `onDismiss`
fires on scrim (or request-close) dismissal before
`onOpenChange(false)`. No family part takes `useModal` itself —
the RN `Modal` host is an `OverlayRoot`-level opt-in for direct
`Overlay` compositions (see `docs/components/overlay.md`).

### Props

#### `DialogRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed open or dismissal. |
| `onDismiss` | `() => void` | no | — | Fires on backdrop (or request-close) dismissal, before `onOpenChange(false)`. |
| `disablePointerDismissal` | `boolean` | no | `false` | When `true`, backdrop press does not dismiss. |
| `modal` | `boolean \| "trap-focus"` | no | `true` | Kept for Base UI parity. The surface always presents modally on native; `"trap-focus"` behaves as modal (focus containment still needs the `focusTrap` RN adaptation). |
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
| `testID` | `string` | no | — | Test identifier, forwarded to the surface. |
| `style` | `StateStyle<DialogPopupState, StyleProp<ViewStyle>>` | no | — | Surface style: a value or a function of popup state. |
| `children` | `ReactNode` | no | — | Surface content. |
| `render` | `RenderProp<DialogPopupState, SlotProps>` | no | — | Element or function substitution; role and label stay on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View`. |

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

`DialogCloseState`: `{ disabled: boolean }`. Outside a root
there is nothing to close: the button renders inert rather
than dropping silently.

### Examples

Minimal compound dialog, uncontrolled (opens on mount):

```tsx
import { Text } from "react-native";
import {
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "@xoroh/axis";

function Welcome() {
  return (
    <DialogRoot defaultOpen>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          accessibilityLabel="Welcome dialog"
          style={{ margin: 32, padding: 16 }}
        >
          <DialogTitle>Welcome</DialogTitle>
          <Text>Thanks for installing.</Text>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
```

Controlled with an explicit non-dismissable close (the
AlertDialog pattern — backdrop press does nothing, only the
close button shuts it):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@xoroh/axis";

function DeleteConfirm() {
  const [open, setOpen] = useState(false);
  return (
      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogTrigger accessibilityLabel="Delete item">
          <Text>Delete</Text>
        </DialogTrigger>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup
            accessibilityLabel="Delete confirmation"
            style={{ margin: 32, padding: 16 }}
          >
            <DialogTitle>Delete this item?</DialogTitle>
            <Text>This cannot be undone.</Text>
            <DialogClose accessibilityLabel="Confirm delete">
              <Text>Delete</Text>
            </DialogClose>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
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
RNTL suites (11 tests —
`docs/COVERAGE.md`). The compound anatomy renders in
`apps/example/src/demos/dialog.tsx`.
