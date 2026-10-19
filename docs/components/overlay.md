## Overlay

The native overlay root on `PortalHost`: one owner for
dismissable, modal, layered surfaces — outside-press and Android
system-back dismissal, stacking with top-layer isolation, scroll
lock, and focus move/restore. `Select`, `Menu`, `Dialog`,
`Popover`, and `Drawer` compound families present through
`OverlayRoot` + `OverlayPortal`; `Tooltip` deliberately does not
(a non-modal hint must never trap touches — see
`docs/components/tooltip.md`). Structure, behavior, and
accessibility only — every visual value (`style`) is
caller-provided. State follows the controlled + uncontrolled
pattern throughout: `open` (plus `onOpenChange`) for controlled
use, `defaultOpen` for uncontrolled. Compose the parts directly
for a custom surface, or rely on the family roots that wrap them.

Source of truth: `OverlayRootProps`, `OverlayRootState`,
`OverlayDismissOptions`, `OverlayContextValue`, `useOverlay`,
`OverlayTriggerProps`, `OverlayTriggerState`,
`OverlayPortalProps`, `OverlayBackdropProps`,
`OverlayBackdropState`, `OverlayPopupProps`,
`OverlayPopupState`, `OverlayCloseProps`, `OverlayCloseState` in
`@xoroh/axis` (`packages/axis/src/components/Overlay.tsx:91-212,
485-783`); `PortalHostProps`, `PortalProps` in `@xoroh/axis`
(`packages/axis/src/components/Portal.tsx:57-200`).

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
| `OverlayRoot` | — | State + presentation owner (`open`, `modal`, dismiss branches, stacking, focus, scroll lock); renders no element itself. |
| `OverlayTrigger` | — | Button role, expanded state, tap toggles; registers the anchor ref focus returns to. |
| `OverlayPortal` | — | Paints at the app's `PortalHost` (RN `Modal` host only via the `useModal` opt-in). |
| `OverlayBackdrop` | — | Scrim dismissal, modal roots only. |
| `OverlayPopup` | — | Surface carrying the `dialog`/`alertdialog` role; registers the popup ref focus moves into. |
| `OverlayClose` | — | Button that closes unconditionally. |
| `PortalHost` | `Portal` (host side) | App-level host: owns the portal registry and paints registered nodes at its location in mount order. |
| `Portal` | `Portal` (content side) | Declares content anywhere under the host; renders at the host, not where declared. |

Base UI has no `Overlay` component — this is the native answer
to its floating-layer behavior (portal mounting, modality,
dismissal), with the same compound-part shape as the family
docs. `useOverlay()` reads the nearest overlay context (throws
outside `OverlayRoot`) for custom parts. Families on this stack:
`Select` and `Menu` compound (`modal` default `true`, opt out
with `modal={false}`), `Dialog` compound (always modal),
`Popover` compound (`modal` default `false` — popovers are
non-modal overlays), `Drawer`; `DropdownMenu` and `ContextMenu`
render inline and are not on this stack.

Omitted behaviors are documented deviations, not oversights:
`escape` and focus-out are declared in the dismiss branch set
but never bound (React Native has no global key listener — only
outside-pointer and system-back fire natively); focus
CONTAINMENT still needs the `focusTrap` RN adaptation (what
ships is `accessibilityViewIsModal` plus focus move/restore, not
a traversal loop); exits unmount in the same commit (no
animation to wait for — the presence machine stays wired for the
first consumer that drives one); `container` has no native
meaning; `keepMounted` stays omitted — all recorded in
`docs/BASE_UI_PARITY.md` (D2/D3/D5/D9).

### Overlay hosting: OverlayRoot, OverlayPortal, PortalHost, useModal

- `OverlayRoot` owns state, never layout: no host element (Base
  UI parity). It wraps family roots (`SelectRoot`, `MenuRoot`,
  `DialogRoot`, …) so Android back, stacking, dismissal, and
  focus belong to one owner.
- `OverlayPortal` paints at the app's `PortalHost` — that is
  what lets overlay content escape clipped parents. It renders
  nothing while closed or exiting (`present` false). The layer
  is a full-fill `View` with a monotonic `zIndex`
  (`1000 + stackIndex * 10`); only the top layer takes touches
  and is exposed to assistive tech (lower layers take no pointer
  events and hide from it). A `hostName` targets a named host;
  omitted targets the default host.
- `PortalHost` is the app-level element (place one near the app
  root). It paints portaled content in-box, in mount order. A
  `Portal` with no matching host renders its children inline
  rather than dropping them silently. Nesting hosts scopes
  matching to the nearest one.
- `useModal` (default `false`, on `OverlayRootProps`) opts a
  surface back into an RN `Modal` host — transparent, visible
  while open, `onRequestClose` wired to dismiss — where a
  platform guarantee genuinely needs it. It removes the Portal
  stacking paint for that layer (one root still presents every
  layer otherwise). No family part takes `useModal` itself:
  families choose `PortalHost` presentation by construction, and
  the `Modal` host is available to direct `Overlay`
  compositions.

### Props

#### `OverlayRoot` (state + presentation owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed change. |
| `modal` | `boolean \| "trap-focus"` | no | `true` | Whether the overlay presents modally. Modal overlays trap focus, prevent background interaction, and lock scroll. |
| `dismissable` | `boolean` | no | `true` | Whether user actions (outside press, back, escape) can dismiss it. |
| `dismiss` | `OverlayDismissOptions` | no | — | Granular dismissal branch options (each defaults `true`, all gated on `dismissable`). |
| `onDismiss` | `() => void` | no | — | Fires on outside-press/back/escape dismissal (not on programmatic close). |
| `trapFocus` | `boolean` | no | `true` | Whether to trap focus inside the overlay when modal. |
| `initialFocus` | `RefObject<ElementRef<typeof View> \| null> \| ElementRef<typeof View> \| null` | no | — | Element or ref to receive initial focus upon opening. |
| `finalFocus` | `RefObject<ElementRef<typeof View> \| null> \| ElementRef<typeof View> \| null` | no | — | Element or ref to restore focus to upon closing. |
| `restoreFocus` | `boolean` | no | `true` | Whether to restore focus to trigger/`finalFocus` on close. |
| `preventScroll` | `boolean` | no | `true` | Whether to lock background scroll while open and modal. |
| `registry` | `OverlayModalityRegistry` | no | — | Custom overlay modality registry. Defaults to the shared registry. |
| `useModal` | `boolean` | no | `false` | Whether to use an RN `Modal` host instead of `PortalHost`. |
| `children` | `ReactNode` | no | — | Trigger, Portal, and shared content. Renders no element itself. |

`OverlayRootState`: `{ open: boolean; modal: boolean | "trap-focus"; isTop: boolean; stackIndex: number; present: boolean; presenceState: PresenceState }` — whether open, whether modal, whether topmost in the active stack, stack index (`0` = base), whether in the tree (mounted or exiting), and the presence lifecycle state (`"mounted" | "exiting" | "unmounted"`).

`OverlayDismissOptions`: `{ outsidePointer?: boolean; systemBack?: boolean; escape?: boolean }` — outside-press, Android back, and Escape dismissal; each defaults `true`, all gated on `dismissable`. `escape` is declared but never bound natively.

#### `OverlayTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: press never toggles. Inert outside a root. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<OverlayTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `children` | `ReactNode` | no | — | Trigger content. |
| `render` | `RenderProp<OverlayTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the trigger host and registered as the focus-restore target. |

`OverlayTriggerState`: `{ open: boolean; disabled: boolean }`.

#### `OverlayPortal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `hostName` | `string` | no | — | Target portal host name. Omitted targets the default host. |
| `testID` | `string` | no | — | Test identifier, forwarded to the portal host. |
| `children` | `ReactNode` | no | — | Portal content (Backdrop + Popup composed by the caller). |

Renders `null` outside a root and while closed/exiting. With
`useModal`, renders an RN `Modal` (`transparent`,
`visible={open}`, `onRequestClose={dismiss}`); otherwise paints
at `PortalHost` with top-layer isolation (see Accessibility).

#### `OverlayBackdrop`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the scrim host. |
| `style` | `StateStyle<OverlayBackdropState, StyleProp<ViewStyle>>` | no | — | Scrim style: a value or a function of backdrop state. |
| `render` | `RenderProp<OverlayBackdropState, SlotProps>` | no | — | Element or function substitution; dismissal wiring stays on the part. |

`OverlayBackdropState`: `{ open: boolean; isTop: boolean }`.
Non-modal roots render no backdrop at all (without an overlay
host a full-fill scrim would trap the app's touches with no
dismissal path); non-dismissable modal roots render a plain
`View` scrim with no label and no handler.

#### `OverlayPopup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `accessibilityLabel` | `string` | no | — | Accessible name source for the surface. |
| `role` | `"dialog" \| "alertdialog"` | no | `"dialog"` | Surface role, conveyed as both `role` and `accessibilityRole`. |
| `testID` | `string` | no | — | Test identifier, forwarded to the surface `View`. |
| `style` | `StateStyle<OverlayPopupState, StyleProp<ViewStyle>>` | no | — | Surface style: a value or a function of popup state. |
| `children` | `ReactNode` | no | — | Surface content. |
| `render` | `RenderProp<OverlayPopupState, SlotProps>` | no | — | Element or function substitution; role and label stay on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the surface `View` and registered as the focus-move target. |

`OverlayPopupState`: `{ open: boolean; isTop: boolean }`.

#### `OverlayClose`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never closes and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the close host. |
| `style` | `StateStyle<OverlayCloseState, StyleProp<ViewStyle>>` | no | — | Close style: a value or a function of close state. |
| `children` | `ReactNode` | no | — | Button content. |
| `render` | `RenderProp<OverlayCloseState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`OverlayCloseState`: `{ disabled: boolean }`. Press calls
`close()` unconditionally (not dismiss-gated). Inert outside a
root — there is nothing to close.

#### `PortalHost`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `name` | `string` | no | — | Host name. A `Portal` with the same `hostName` renders here; omitted is the default host. |
| `children` | `ReactNode` | no | — | Content around (and including) the portals that target this host. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host container. |
| `style` | `StyleProp<ViewStyle>` | no | — | Host container style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution for the host container; portaled nodes travel in the props as `children` after the declared children. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the host container `View`. |

#### `Portal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `hostName` | `string` | no | — | Target host name. Omitted targets the nearest unnamed (default) host. No matching host renders the children inline — never silently dropped. |
| `children` | `ReactNode` | no | — | Content painted at the host. |

### Examples

App shell with a `PortalHost` near the root, and a custom
surface composed directly from `Overlay` parts:

```tsx
import { Text } from "react-native";
import {
  OverlayBackdrop,
  OverlayClose,
  OverlayPopup,
  OverlayPortal,
  OverlayRoot,
  OverlayTrigger,
  PortalHost,
} from "@xoroh/axis";

function App() {
  return (
    <PortalHost>
      <OverlayRoot>
        <OverlayTrigger accessibilityLabel="Open custom overlay">
          <Text>Open</Text>
        </OverlayTrigger>
        <OverlayPortal>
          <OverlayBackdrop />
          <OverlayPopup
            accessibilityLabel="Custom surface"
            style={{ margin: 32, padding: 16 }}
          >
            <OverlayClose accessibilityLabel="Close custom overlay">
              <Text>Close</Text>
            </OverlayClose>
          </OverlayPopup>
        </OverlayPortal>
      </OverlayRoot>
    </PortalHost>
  );
}
```

Controlled modal surface with an explicit non-dismissable alert
pattern (scrim press does nothing — only the close action
closes):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  OverlayBackdrop,
  OverlayClose,
  OverlayPopup,
  OverlayPortal,
  OverlayRoot,
  OverlayTrigger,
} from "@xoroh/axis";

function Confirm() {
  const [open, setOpen] = useState(false);
  return (
    <OverlayRoot open={open} onOpenChange={setOpen} dismissable={false}>
      <OverlayTrigger accessibilityLabel="Delete item">
        <Text>Delete</Text>
      </OverlayTrigger>
      <OverlayPortal>
        <OverlayBackdrop />
        <OverlayPopup
          role="alertdialog"
          accessibilityLabel="Delete confirmation"
          style={{ margin: 32, padding: 16 }}
        >
          <OverlayClose accessibilityLabel="Confirm delete">
            <Text>Delete</Text>
          </OverlayClose>
        </OverlayPopup>
      </OverlayPortal>
    </OverlayRoot>
  );
}
```

Named hosts (a panel paints at its own host; everything else
uses the default):

```tsx
import { Text } from "react-native";
import { Portal, PortalHost } from "@xoroh/axis";

function Hosts() {
  return (
    <PortalHost name="panel">
      <Text>Panel zone</Text>
      <Portal hostName="panel">
        <Text>Panel content</Text>
      </Portal>
    </PortalHost>
  );
}
```

### Accessibility

- Only the top layer is exposed: lower layers take no pointer
  events (`pointerEvents="box-none"`) and hide from assistive
  tech (`accessibilityElementsHidden`,
  `importantForAccessibility="no-hide-descendants"`).
- `accessibilityViewIsModal` sits on the top modal LAYER, not on
  the popup inside it — the flag hides everything that is not a
  descendant of the marked view, so marking the popup would hide
  its own backdrop as a sibling. Only the top layer claims it; a
  stack where two siblings both claim modality would hide each
  other.
- The dismissable backdrop is a `Pressable` labelled "Dismiss"
  closing through `dismiss`; the non-dismissable scrim is a plain
  `View` with no label and no handler — no fake affordance.
- The popup is an accessibility element carrying its `role`
  (`dialog` by default, `alertdialog` for confirmations) so the
  role reaches assistive technology; the trigger is a `button`
  with `expanded` + `disabled` state; the close is a `button`
  with `disabled` state.
- Focus moves into the surface on open and restores to the
  trigger/`finalFocus` on close (reduced motion honoured);
  background scroll locks while open and modal.
- Closed or exiting renders nothing at the host: no scrim, no
  surface, for assistive tech or tests to find.
- Explicitly deferred, each for a named reason: no `escape` or
  focus-out binding (declared, never bound — no global key
  listener on native); no focus containment (announced modal
  state plus move/restore, not a traversal loop — parity D5);
  no exit animation (unmounts in the same commit — parity D9).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open,
isTop }`, `{ open, disabled }`, `{ disabled }`), except
`PortalHost`/`Portal`, whose styles stay static (host chrome
carries no state); `data-*` attributes are deliberately absent
on native — state flows through those functions instead
(contract §11, parity D1). `useOverlay()` exposes the context
(`open`, `modal`, `dismiss`/`close`/`toggle`, `isTop`,
`stackIndex`, `present`, refs) for custom parts — it throws
outside a root. Stacking is monotonic (`zIndex = 1000 +
stackIndex * 10`); the shared modality registry is replaceable
per root. Omitted behaviors (`escape`/focus-out binding, focus
containment, exit animation, `container`, `keepMounted`) and
the family wiring are recorded in `docs/BASE_UI_PARITY.md`.
The direct composition renders in
`apps/example/src/demos/overlays.tsx`.
