## Alert Dialog

Blocking confirm that only closes through its actions: a thin
specialization of the compound `Dialog` parts (`DialogRoot` with
forced non-dismissal, `DialogPortal`, inert `DialogBackdrop`,
`DialogPopup` carrying title, content, and a REQUIRED action
row). A blocking dialog without an explicit action traps the
user on the surface with no way out — `actions` is required, and
`dismissable` is not accepted at all (omitted from the type), so
no caller can accidentally make a blocking dialog dismissable.
Structure, behavior, and accessibility only — every visual value
(`style`) is caller-provided. State follows the controlled +
uncontrolled pattern throughout: `open` (plus `onOpenChange`)
for controlled use, `defaultOpen` for uncontrolled. Closing
happens only through the caller's own action buttons calling
back (typically `onOpenChange(false)`).

Source of truth: `AlertDialogProps`, `AlertDialogState` in
`@xoroh/axis`
(`packages/axis/src/components/AlertDialog.tsx:34-69`); composed
from `DialogRootProps`, `DialogPortalProps`,
`DialogBackdropProps`, `DialogPopupProps` in `@xoroh/axis`
(`packages/axis/src/components/Dialog.tsx:265-273, 401-467,
519-631`).

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
| `AlertDialog` | `AlertDialog.Root` (single-part specialization) | The whole API: forced-blocking dialog over the `Dialog` compound parts. Not a part-for-part Base UI port — see below. |

There are no compound parts of its own: the composition is
in-`src` (`DialogRoot` + `DialogPortal` + `DialogBackdrop` +
`DialogPopup` + `DialogTitle`), and substitution happens through
`render` on the surface. Base UI's `AlertDialog` ships
`Root`/`Trigger`/`Portal`/`Backdrop`/`Popup`/`Title`/
`Description`/`Cancel`/`Action` parts; Axis covers that shape
with the `Dialog` compound parts (see
`docs/components/dialog.md`) and keeps `AlertDialog` a
single-part blocking specialization — `Cancel`/`Action` are
caller buttons in `actions`, closing through `onOpenChange`.

### Overlay hosting

`AlertDialog` presents through `OverlayRoot` + `OverlayPortal`
painting at the app's `PortalHost` — it inherits the stack from
the `DialogRoot` it composes (single state owner: the inner
`DialogRoot` runs controlled off the outer value). `modal` is
always on (blocking dialogs are modal by definition);
`disablePointerDismissal` is forced, never caller-provided: the
backdrop renders inert (no dismiss label, no handler) and every
dismiss branch is off, so scrim press and Android back do
nothing. There is no `onDismiss` (no scrim path exists) and no
`useModal` opt-in on this API — the RN `Modal` host is an
`OverlayRoot`-level opt-in for direct `Overlay` compositions
(see `docs/components/overlay.md`).

### Props

#### `AlertDialog` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state; actions report `false` through here. |
| `title` | `ReactNode` | no | — | Dialog title, rendered in a `DialogTitle` when provided. |
| `children` | `ReactNode` | no | — | Dialog content. |
| `actions` | `ReactNode` | yes | — | Action row content, rendered in a `View` row. REQUIRED — a blocking dialog with no explicit action leaves the user with no way to leave the surface. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the dialog surface. |
| `testID` | `string` | no | — | Test identifier; the surface carries it, the scrim carries `<testID>-scrim`. |
| `style` | `StateStyle<AlertDialogState, StyleProp<ViewStyle>>` | no | — | Dialog surface (box) style: a value or a function of dialog state. |
| `render` | `RenderProp<AlertDialogState, SlotProps>` | no | — | Element or function substitution for the dialog surface; blocking (non-dismissable) semantics stay on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the dialog surface `View` (via `DialogPopup`). |

`AlertDialogState`: `{ open: boolean }` — whether the dialog is
currently open.

Closed renders `null` (via `DialogPortal`): no scrim, no
surface, no host for assistive tech or tests to find.

### Examples

Minimal blocking confirm, uncontrolled:

```tsx
import { Text } from "react-native";
import { AlertDialog, Button } from "@xoroh/axis";

function DeleteConfirm() {
  return (
    <AlertDialog
      title="Delete this item?"
      accessibilityLabel="Delete confirmation"
      actions={
        <Button accessibilityLabel="Confirm delete">
          <Text>Delete</Text>
        </Button>
      }
    >
      <Text>This cannot be undone.</Text>
    </AlertDialog>
  );
}
```

Controlled (parent owns the open state; the action reports
`false` through `onOpenChange`):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { AlertDialog, Button } from "@xoroh/axis";

function ControlledConfirm() {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
      title="Discard changes?"
      accessibilityLabel="Discard confirmation"
      actions={
        <Button
          onPress={() => setOpen(false)}
          accessibilityLabel="Discard changes"
        >
          <Text>Discard</Text>
        </Button>
      }
    >
      <Text>Unsaved changes will be lost.</Text>
    </AlertDialog>
  );
}
```

Styled surface with function style over dialog state:

```tsx
import { Text } from "react-native";
import { AlertDialog, Button } from "@xoroh/axis";

function StyledConfirm() {
  return (
    <AlertDialog
      title="Sign out?"
      accessibilityLabel="Sign out confirmation"
      style={{ margin: 32, padding: 16 }}
      actions={
        <Button accessibilityLabel="Sign out">
          <Text>Sign out</Text>
        </Button>
      }
    >
      <Text>You can sign back in at any time.</Text>
    </AlertDialog>
  );
}
```

### Accessibility

- The surface is an accessibility element (`accessible`)
  carrying the `dialog` role (via `DialogPopup`), so the role
  reaches assistive technology — a role on a non-element `View`
  would be invisible to it.
- The `modal` flag is deliberately omitted from
  `accessibilityState`: React Native's `AccessibilityState` host
  type has no `modal` key (checked against the RN 0.87
  `ViewAccessibility` types), so it is left out rather than
  smuggled past the typechecker (the Dialog precedent).
- The scrim is a plain `View` with no label and no handler —
  no fake affordance on a surface that cannot be scrim-dismissed.
- Closed renders `null`: no scrim, no surface, for assistive
  tech or tests to find.
- Explicitly deferred, each for a named reason: no animation
  (the surface mounts/unmounts synchronously with state — exit
  transitions would need the `presence` model to keep it
  mounted, unneeded until a consumer needs animated dismissal —
  the Dialog precedent); no focus trap beyond the overlay root's
  modal announcement and focus move/restore (containing
  accessibility focus needs the `focusTrap` + `overlayModality`
  RN adaptation — no DOM tab order to borrow).

### Composition

`AlertDialog` takes `render` (an element, cloned with the popup
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open }`);
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
It is rebuilt on the `Dialog` compound parts, not a parallel
implementation: `DialogRoot` (forced `disablePointerDismissal`,
`modal` default `true`), `DialogPortal` (at `PortalHost`),
inert `DialogBackdrop`, `DialogPopup` + `DialogTitle`. Verified
by the alert-dialog RNTL suites (5 tests — `docs/COVERAGE.md`).
Renders in `apps/example/src/demos/overlays.tsx`.
