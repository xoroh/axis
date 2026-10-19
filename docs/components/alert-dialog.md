## Alert Dialog

Blocking confirm that only closes through its actions. Compound
anatomy per Base UI (Root, Trigger, Portal, Backdrop, Popup, Title,
Description, Close), sharing the `Dialog` compound implementation
with the blocking contract forced: the root always sets
`disablePointerDismissal`, the backdrop is inert (no dismiss label,
no handler), and the popup carries `role="alertdialog"`. Blocking
means blocking: scrim press, Android hardware back, and iOS
VoiceOver scrub all no-op — closing happens only through the
caller's own action buttons calling back (typically
`onOpenChange(false)`).

State follows the controlled + uncontrolled pattern throughout:
`open` (plus `onOpenChange`) for controlled use, `defaultOpen` for
uncontrolled. Structure, behavior, and accessibility only — every
visual value (`style`) is caller-provided.

Source of truth: `AlertDialogRootProps`, `AlertDialogTriggerProps`,
`AlertDialogPortalProps`, `AlertDialogBackdropProps`,
`AlertDialogPopupProps`, `AlertDialogTitleProps`,
`AlertDialogDescriptionProps`, `AlertDialogCloseProps` in
`@xoroh/axis` (`packages/axis/src/components/AlertDialog.tsx`).

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
| `AlertDialogRoot` | `AlertDialog.Root` | State owner (`open`/`defaultOpen`/`onOpenChange`); forces `disablePointerDismissal` and `modal`; renders no element. |
| `AlertDialogTrigger` | `AlertDialog.Trigger` | Button role, expanded state, tap toggles. |
| `AlertDialogPortal` | `AlertDialog.Portal` | `OverlayPortal` host at `PortalHost` — the native portal. |
| `AlertDialogBackdrop` | `AlertDialog.Backdrop` | Inert scrim by construction (no handler, no label). |
| `AlertDialogPopup` | `AlertDialog.Popup` | Surface view carrying the `alertdialog` role. |
| `AlertDialogTitle` | `AlertDialog.Title` | Heading text (`header` role). |
| `AlertDialogDescription` | `AlertDialog.Description` | Descriptive text. |
| `AlertDialogClose` | `AlertDialog.Close` / `Cancel` / `Action` | Button that closes the root; `initialFocus` marks the least-destructive action (Cancel). |

Base UI splits the actions into `Cancel`/`Action` parts; Axis
covers both with `AlertDialogClose` — a blocking dialog's actions
are all closes, and the `initialFocus` marker (not a separate part)
is how the caller names Cancel.

### Overlay hosting

`AlertDialogRoot` presents through `OverlayRoot` + `OverlayPortal`
painting at the app's `PortalHost` — the surface escapes clipped
parents without an RN `Modal` of its own. `modal` is always on
(blocking dialogs are modal by definition);
`disablePointerDismissal` is forced, never caller-provided: every
dismiss branch is off, so scrim press, Android back, and iOS
VoiceOver scrub do nothing. There is no `onDismiss` (no dismiss
path exists) and no `useModal` opt-in on this API — the RN `Modal`
host is an `OverlayRoot`-level opt-in for direct `Overlay`
compositions (see `docs/components/overlay.md`).

### Focus

SR focus moves into the popup on open. The default initial target
is the element the caller marks least destructive via
`initialFocus` on `AlertDialogClose` (typically Cancel — Axis
cannot infer destructiveness), else the first stop/title default,
else the popup itself; on web the first tabbable element wins
unless a Close is marked. `initialFocus` (element, ref, function
of the open interaction, or `false`) may also be set on the root
or popup, with the popup winning; `finalFocus` (or the trigger)
takes focus back on close. If the trigger unmounted, the web falls
back to the nearest focusable ancestor while it is still
connected (D11); on native nothing happens, never a throw.

Modality: on iOS the popup claims `accessibilityViewIsModal`
(top layer only); on Android the app root beside `PortalHost`
takes `importantForAccessibility="no-hide-descendants"` while a
modal is open (see `useModalActive`); on web the popup carries
`aria-modal` and traps Tab.

### Reasons

`onOpenChange(open, details)` carries `details.reason`:
`trigger-press` (trigger toggle, either direction) and
`close-press` (Close press). `outside-press` and `escape-key`
never fire — the dialog is blocking by construction.

### Props

#### `AlertDialogRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean, details?: { reason }) => void` | no | — | Fires with the next open state; actions report `false` through here, with the reason. |
| `initialFocus` | ref \| element \| function \| `false` | no | — | Explicit initial focus target (wins over the popup's). |
| `finalFocus` | ref \| element \| function \| `false` | no | — | Explicit restore target (wins over the trigger). |
| `children` | `ReactNode` | no | — | Trigger, Portal, and shared content. Renders no element itself. |

#### `AlertDialogTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never opens and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | value or function of `{ open, disabled }` | no | — | Trigger style, caller-provided. |
| `children` | `ReactNode` | no | — | Trigger content. |
| `render` | element or function | no | — | Element or function substitution (Base UI parity). |

#### `AlertDialogPortal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Portal content (Backdrop + Popup composed by the caller). |
| `testID` | `string` | no | — | Test identifier. |

#### `AlertDialogBackdrop`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | value or function of `{ open }` | no | — | Scrim style, caller-provided. |
| `render` | element or function | no | — | Element or function substitution (Base UI parity). |

#### `AlertDialogPopup` (surface)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `accessibilityLabel` | `string` | no | — | Accessible name source for the dialog surface. |
| `testID` | `string` | no | — | Test identifier; the popup carries it, the backdrop carries `<testID>-scrim`. |
| `style` | value or function of `{ open }` | no | — | Surface style, caller-provided. |
| `children` | `ReactNode` | no | — | Surface content. |
| `render` | element or function | no | — | Element or function substitution; the alertdialog role stays on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View`. |
| `initialFocus` | ref \| element \| function \| `false` | no | — | Explicit initial focus target (wins over the root's). |
| `finalFocus` | ref \| element \| function \| `false` | no | — | Explicit restore target (wins over the trigger). |

#### `AlertDialogTitle` / `AlertDialogDescription`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<TextStyle>` | no | — | Text style, caller-provided. |
| `children` | `ReactNode` | no | — | Heading / description content. |
| `render` | element or function | no | — | Element or function substitution (Base UI parity). |

`AlertDialogTitle` renders with the `header` role.

#### `AlertDialogClose`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never closes and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | value or function of `{ disabled }` | no | — | Button style, caller-provided. |
| `children` | `ReactNode` | no | — | Button content. |
| `render` | element or function | no | — | Element or function substitution (Base UI parity). |
| `initialFocus` | `boolean` | no | `false` | Mark this Close as the default initial focus target (Cancel). |

### Examples

Minimal blocking confirm, uncontrolled:

```tsx
import { Text } from "react-native";
import {
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from "@xoroh/axis";

function DeleteConfirm() {
  return (
    <AlertDialogRoot>
      <AlertDialogPortal>
        <AlertDialogBackdrop testID="delete-scrim" />
        <AlertDialogPopup
          testID="delete"
          accessibilityLabel="Delete confirmation"
        >
          <AlertDialogTitle>Delete this item?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogClose initialFocus>
            <Text>Cancel</Text>
          </AlertDialogClose>
          <AlertDialogClose>
            <Text>Delete</Text>
          </AlertDialogClose>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialogRoot>
  );
}
```

Controlled (parent owns the open state; the action reports
`false` through `onOpenChange`):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  AlertDialogClose,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from "@xoroh/axis";

function ControlledConfirm() {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialogRoot open={open} onOpenChange={setOpen}>
      <AlertDialogPortal>
        <AlertDialogPopup
          testID="discard"
          accessibilityLabel="Discard confirmation"
        >
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogClose initialFocus>
            <Text>Keep editing</Text>
          </AlertDialogClose>
          <AlertDialogClose>
            <Text>Discard</Text>
          </AlertDialogClose>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialogRoot>
  );
}
```

### Accessibility

- The popup is an accessibility element (`accessible`) carrying
  the `alertdialog` role (never a plain `dialog`), so the role
  reaches assistive technology.
- The `modal` flag is deliberately omitted from
  `accessibilityState`: React Native's `AccessibilityState` host
  type has no `modal` key (checked against the RN 0.87
  `ViewAccessibility` types). iOS modality is the popup-level
  `accessibilityViewIsModal`; Android modality is the app-root
  hook; web modality is `aria-modal` plus the Tab trap.
- The scrim is a plain `View` with no label and no handler —
  no fake affordance on a surface that cannot be scrim-dismissed.
  (On iOS it additionally hides behind the modal popup; on
  Android it stays a silent layout host.)
- Closed renders `null`: no scrim, no surface, for assistive
  tech or tests to find.
- Focus: move-in honors the marked Cancel; restore honors the
  trigger or `finalFocus`; blocking ignores back and VoiceOver
  scrub deliberately (recorded in `docs/BASE_UI_PARITY.md`).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open }`,
`{ disabled }`); `data-*` attributes are deliberately absent on
native — state flows through those functions instead (contract
§11, parity D1). Verified by the alert-dialog RNTL suites and
the web focus suites. Renders in
`apps/example/src/demos/overlays.tsx`.
