## Context Menu

Long-press popup menu: long-press the anchor to open a menu body
measured and placed below the anchor; scrim press dismisses.
Structure, behavior, and accessibility only — every visual value
(`style`, `menuStyle`) is caller-provided. State follows the
controlled + uncontrolled pattern throughout: `open` (plus
`onOpenChange`) for controlled use, `defaultOpen` for
uncontrolled. A single-part API ships: `content` carries the menu
body (caller content, not `MenuItem` parts — there is no
compound form and no context here). Combobox and Autocomplete are
 likewise not compound — they are separate monolith docs.

Source of truth: `ContextMenuRootProps`, `ContextMenuRootState` in
`@xoroh/axis`
(`packages/axis/src/components/ContextMenu.tsx:30-66`).

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
| `ContextMenuRoot` | — | The whole API: anchor wrapper (long-press toggles) + measured menu box + scrim, presenting through `Portal` at the app's `PortalHost`. Not a Base UI part. |

There are no compound parts: no `Root`/`Trigger`/`Portal`/
`Positioner`/`Popup` split, no filter parts, no submenu parts.
For an anchored popup menu with compound parts, use the `Menu`
compound form (see `docs/components/menu.md`); for a tap-toggle
cascade with submenus, use `DropdownMenuRoot` (see
`docs/components/dropdown-menu.md`).

### Overlay hosting

`ContextMenuRoot` does not sit on `OverlayRoot`: the anchor stays
in place while the scrim and menu box present through the plain
`Portal` at the app's `PortalHost` — above sibling content, with
no `Modal` trap, no focus trap, and no scroll lock. That is the
documented difference from the `Menu` compound form (which
presents through `OverlayRoot` + `OverlayPortal` at the app's
`PortalHost`). If a long-press menu needs the `OverlayRoot`
dismissal stack (system back, modality), compose it from the `Menu`
compound parts with a long-press trigger instead — see
`docs/components/overlay.md` for what `OverlayRoot`,
`OverlayPortal`, `PortalHost`, and the `useModal` opt-in provide.

### Props

#### `ContextMenuRoot` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | — | Anchor content. Long-press opens the menu. |
| `content` | `ReactNode` | yes | — | Menu body content (an empty body is a bug). Caller content — not `MenuItem` parts. |
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every visibility change. |
| `onDismiss` | `() => void` | no | — | Fires on scrim dismissal, before `onOpenChange(false)`. |
| `placement` | `Placement` | no | `"bottom"` | Preferred side for the menu box. Clamped into the viewport. Press-point positioning is deferred, not faked — the box anchors below the anchor. |
| `"aria-label"` | `string` | no | — | Accessible name source for the menu region. |
| `testID` | `string` | no | — | Test identifier; the scrim carries `<testID>-scrim`. |
| `style` | `StateStyle<ContextMenuRootState, StyleProp<ViewStyle>>` | no | — | Anchor wrapper style: a value or a function of menu state. |
| `menuStyle` | `StyleProp<ViewStyle>` | no | — | Menu box style, caller-provided. |
| `render` | `RenderProp<ContextMenuRootState, SlotProps>` | no | — | Element or function substitution; replaces the anchor wrapper with long-press toggle and dismissal wiring travelling in the props. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the anchor wrapper host element. |

`ContextMenuRootState`: `{ open: boolean }` — whether the menu is
currently open.

Closed renders the anchor only — no scrim, no menu box.

### Examples

Minimal, uncontrolled (long-press the file row to open):

```tsx
import { Text } from "react-native";
import { ContextMenuRoot } from "@xoroh/axis";

function FileRow() {
  return (
    <ContextMenuRoot
      content={<Text>Rename · Duplicate · Delete</Text>}
      aria-label="File actions"
    >
      <Text>Report.pdf</Text>
    </ContextMenuRoot>
  );
}
```

Controlled with placement (parent owns the open state):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { ContextMenuRoot } from "@xoroh/axis";

function ControlledRow() {
  const [open, setOpen] = useState(false);
  return (
    <ContextMenuRoot
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      content={<Text>Rename · Duplicate · Delete</Text>}
      aria-label="File actions"
      menuStyle={{ padding: 12 }}
    >
      <Text>Report.pdf</Text>
    </ContextMenuRoot>
  );
}
```

Styled anchor and box (every visual value is caller-provided):

```tsx
import { Text } from "react-native";
import { ContextMenuRoot } from "@xoroh/axis";

function StyledRow() {
  return (
    <ContextMenuRoot
      content={<Text>Cut · Copy · Paste</Text>}
      aria-label="Row actions"
      style={{ padding: 12 }}
      menuStyle={{ padding: 8 }}
    >
      <Text>Row three</Text>
    </ContextMenuRoot>
  );
}
```

### Accessibility

- The menu box is an accessibility element (`accessible`)
  carrying the `menu` role and `accessibilityLabel`, so the
  region is announced.
- The anchor toggles on `onLongPress`; the scrim is a
  `Pressable` labelled "Dismiss menu" — scrim press closes
  through `onDismiss` + `onOpenChange(false)`.
- Closed renders the anchor only: no scrim, no box, for
  assistive tech or tests to find.
- Explicitly deferred, each for a named reason: no
  press-point positioning (the box anchors below the anchor —
  opening exactly under the finger is deferred, not faked); no
  animation (the box mounts/unmounts synchronously with state —
  exit transitions would need the `presence` model to keep it
  mounted, unneeded until a consumer needs animated dismissal —
  the Dialog precedent); no focus trap (containing accessibility
  focus needs the `focusTrap` + `overlayModality` RN adaptation
  — no DOM tab order to borrow).

### Composition

`ContextMenuRoot` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open }`);
`menuStyle` stays static (the `DialogTitle` precedent — box
chrome carries no state); `data-*` attributes are deliberately
absent on native — state flows through those functions instead
(contract §11, parity D1). Verified by the context-menu RNTL
suites (5 tests — `docs/COVERAGE.md`). The menu renders in
`apps/example/src/demos/overlays.tsx`.
