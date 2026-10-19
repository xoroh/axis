## Dropdown Menu

Popup menu with a submenu cascade: one dismissal stack owns the
root, leaf `DropdownMenuItem` rows, and `DropdownMenuSub` levels
of trigger + fly-out content. Opening a submenu replaces the path
below it (siblings close, ancestors stay); leaf selection and
scrim press close everything. Structure, behavior, and
accessibility only — every visual value (`style`) is
caller-provided. State follows the controlled + uncontrolled
pattern throughout: `open` (plus `onOpenChange`) for controlled
use, `defaultOpen` for uncontrolled. The root partitions children
by type (items/subs into the panel, everything else into the
trigger zone) and exposes compound parts that mirror the menu
cascade with the same state semantics.

Source of truth: `DropdownMenuRootProps`, `DropdownMenuRootState`,
`DropdownMenuTriggerProps`, `DropdownMenuTriggerState`,
`DropdownMenuItemProps`, `DropdownMenuItemState`,
`DropdownMenuSubProps`, `DropdownMenuSubTriggerProps`,
`DropdownMenuSubContentProps` in `@xoroh/axis`
(`packages/axis/src/components/DropdownMenu.tsx:64-182`).

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
| `DropdownMenuRoot` | `DropdownMenu.Root` | State owner (`open`/`defaultOpen`/`onOpenChange`/`onDismiss`); single dismissal stack. Partitions children by type: items/subs into the panel, the rest into the trigger zone. |
| `DropdownMenuTrigger` | `DropdownMenu.Trigger` | Button role, expanded state, tap toggles. |
| `DropdownMenuItem` | `DropdownMenu.Item` | Leaf action (`value` required, `onSelect` before close). |
| `DropdownMenuSub` | `DropdownMenu.Sub` | Submenu branch (`value` identifies the cascade path). |
| `DropdownMenuSubTrigger` | `DropdownMenu.SubTrigger` | Opens the branch; disabled is terminal. |
| `DropdownMenuSubContent` | `DropdownMenu.SubContent` | Nested `menu`-role panel; mounts only while open, fly-out geometry lives here. |

Unlike `Menu`, this family has no separate portal/positioner
parts: sub panels render in flow after their trigger, and the
panel geometry is caller style on `SubContent`. Unlike
`ContextMenuRoot` (single-part long-press API), every cascade level
is a part. Combobox and Autocomplete are not compound and do not
appear here — they are separate monolith docs.

### Overlay hosting

`DropdownMenuRoot` does not sit on `OverlayRoot`: the content box and
scrim present through the plain `Portal` at the app's `PortalHost`
— above sibling content, with no `Modal` trap, no focus trap, and
no scroll lock — inside one dismissal stack owned by the root.
Sub panels still render in flow relative to the box (fly-out
geometry stays caller `style` on `SubContent`). That is the
documented difference from the `Menu` compound form (which
presents through `OverlayRoot` + `OverlayPortal` at the app's
`PortalHost`; see `docs/components/menu.md`). If a cascade needs
the `OverlayRoot` dismissal stack (system back, modality), compose
it from the `Menu` compound parts (or `MenuSubmenu*` wrapping
`DropdownMenuSub`) instead — see
`docs/components/overlay.md` for what `OverlayRoot`,
`OverlayPortal`, `PortalHost`, and the `useModal` opt-in provide.

### Props

#### `DropdownMenuRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed toggle or dismissal. |
| `onDismiss` | `() => void` | no | — | Fires on scrim dismissal, before `onOpenChange(false)`. |
| `testID` | `string` | no | — | Test identifier; the content box carries it, the scrim carries `<testID>-scrim`. |
| `style` | `StateStyle<DropdownMenuRootState, StyleProp<ViewStyle>>` | no | — | Content-box style: a value or a function of menu state. |
| `children` | `ReactNode` | yes | — | Trigger content plus `DropdownMenuItem`/`DropdownMenuSub` elements, composed by the caller. An empty trigger zone is a bug. |
| `render` | `RenderProp<DropdownMenuRootState, SlotProps>` | no | — | Element or function substitution; replaces the content box only. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the menu container `View`. |

`DropdownMenuRootState`: `{ open: boolean }` — the current open state.

#### `DropdownMenuTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<DropdownMenuTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `children` | `ReactNode` | yes | — | Trigger content (an empty trigger is a bug). |
| `disabled` | `boolean` | no | `false` | Terminal: it never toggles and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `render` | `RenderProp<DropdownMenuTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`DropdownMenuTriggerState`: `{ open: boolean; disabled: boolean }`.

#### `DropdownMenuItem`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Passed to `onSelect` on activation (cascade identity). |
| `disabled` | `boolean` | no | `false` | Terminal: it never selects and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<DropdownMenuItemState, StyleProp<ViewStyle>>` | no | — | Value or function of item state. |
| `children` | `ReactNode` | no | — | Item content. |
| `onSelect` | `(value: string) => void` | no | — | Fires with `value` on activation, before the stack closes. |
| `render` | `RenderProp<DropdownMenuItemState, SlotProps>` | no | — | Element or function substitution. |

`DropdownMenuItemState`: `{ disabled: boolean }`.

#### `DropdownMenuSub`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Path segment identifying the submenu branch in the cascade. |
| `children` | `ReactNode` | yes | — | Sub trigger + sub content. |

#### `DropdownMenuSubTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<DropdownMenuTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `children` | `ReactNode` | yes | — | Trigger content. |
| `disabled` | `boolean` | no | `false` | Terminal: the branch never opens and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `render` | `RenderProp<DropdownMenuTriggerState, SlotProps>` | no | — | Element or function substitution. |

#### `DropdownMenuSubContent`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Panel style, caller-provided — fly-out geometry lives here. |
| `children` | `ReactNode` | no | — | Item/sub elements. Mounts only while open. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

### Examples

Minimal menu with one submenu level, uncontrolled:

```tsx
import { Text } from "react-native";
import {
  DropdownMenuRoot,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@xoroh/axis";

function ShareMenu() {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger accessibilityLabel="Open share menu">
        <Text>Share</Text>
      </DropdownMenuTrigger>
      <DropdownMenuItem value="copy">Copy link</DropdownMenuItem>
      <DropdownMenuSub value="more">
        <DropdownMenuSubTrigger accessibilityLabel="More options">
          <Text>More</Text>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem value="email">Email</DropdownMenuItem>
          <DropdownMenuItem value="sms">Message</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuRoot>
  );
}
```

Controlled with selection handling (parent owns the open state):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { DropdownMenuRoot, DropdownMenuItem, DropdownMenuTrigger } from "@xoroh/axis";

function ControlledShare() {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenuRoot open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger accessibilityLabel="Open share menu">
        <Text>Share</Text>
      </DropdownMenuTrigger>
      <DropdownMenuItem value="copy" onSelect={() => setOpen(false)}>
        Copy link
      </DropdownMenuItem>
    </DropdownMenuRoot>
  );
}
```

Two submenu levels (opening the second replaces the path below
the first — siblings close, ancestors stay):

```tsx
import { Text } from "react-native";
import {
  DropdownMenuRoot,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@xoroh/axis";

function NestedShare() {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger accessibilityLabel="Open share menu">
        <Text>Share</Text>
      </DropdownMenuTrigger>
      <DropdownMenuSub value="more">
        <DropdownMenuSubTrigger accessibilityLabel="More options">
          <Text>More</Text>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuSub value="social">
            <DropdownMenuSubTrigger accessibilityLabel="Social apps">
              <Text>Social</Text>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem value="post">Post</DropdownMenuItem>
              <DropdownMenuItem value="story">Story</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuRoot>
  );
}
```

### Accessibility

- The content box and each sub panel carry the `menu` role (as
  accessibility elements), so the role reaches assistive
  technology — a role on a non-element `View` would be invisible
  to it.
- Triggers are `button`-role hosts with `expanded` + `disabled`
  state; leaf items carry `menuitem`.
- The scrim is a `Pressable` labelled "Dismiss menu"; scrim press
  closes the whole stack through `onDismiss` +
  `onOpenChange(false)`. Leaf activation closes everything.
- Closed renders the trigger zone only: no scrim, no panels, for
  assistive tech or tests to find.
- Explicitly deferred, each for a named reason: no animation
  (panels mount/unmount synchronously with state — exit
  transitions would need the `presence` model to keep them
  mounted, unneeded until a consumer needs animated dismissal —
  the Dialog precedent); no hover or keyboard traversal (no
  pointer on touch devices — parity D8); no focus trap
  (containing accessibility focus needs the `focusTrap` +
  `overlayModality` RN adaptation — no DOM tab order to borrow).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open }`,
`{ open, disabled }`, `{ disabled }`), except `Sub` (which owns
no host — `value` + `children` only) and `SubContent`, whose
style stays static (the `DialogTitle` precedent — a function of
empty state adds nothing); `data-*` attributes are deliberately
absent on native — state flows through those functions instead
(contract §11, parity D1). The single dismissal stack
(`openPath`/`openSub`/`closeAll` in the exported disclosure
context) is the cascade counterpart to the `Menu` compound
overlay presentation. Omitted Base UI pieces (`container`,
transition attributes, hover/keyboard traversal) are recorded in
`docs/BASE_UI_PARITY.md` (§ Dropdown Menu). Verified by the
dropdown-menu RNTL suites (10 tests — `docs/COVERAGE.md`). The
cascade renders in `apps/example/src/demos/dropdown.tsx`.
