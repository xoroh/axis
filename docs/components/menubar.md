## Menubar

Menu-command bar: a row of `MenubarMenu` commands, each opening
a dropdown panel; exactly one panel is open at a time. This is
composition, not a second menu implementation: each
`MenubarMenu` IS a `DropdownMenuRoot` (same trigger/item/sub
parts, same dismissal stack, same scrim), controlled by the
root's open value. It differs from `NavigationMenuRoot` in what
opens: menu-command panels (`menuitem` content,
cascade-capable) rather than navigation panels. The desktop-bar
pattern adapts to touch by press (no hover): pressing another
menu's trigger while one is open switches panels, because each
menu's scrim fills only its own container — never the whole
bar. The open menu follows the controlled + uncontrolled
pattern (`openValue`/`defaultOpenValue`/`onOpenValueChange`,
`null` closed): the open panel is application state, like
`NavigationMenuRoot`.

Source of truth: `MenubarProps`, `MenubarState`,
`MenubarMenuProps` in `@xoroh/axis`
(`packages/axis/src/components/Menubar.tsx:41-83`); panel
parts from `DropdownMenuRootProps` in `@xoroh/axis`
(`packages/axis/src/components/DropdownMenu.tsx:81-104`).

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
| `Menubar` | `Menubar.Root` | State owner (`openValue`/`defaultOpenValue`/`onOpenValueChange`); bar row container with the `menubar` role. |
| `MenubarMenu` | `Menubar.Menu` (composition) | Controlled `DropdownMenuRoot` bound to the root's open value (`value` identifies it). Trigger/item/sub parts come from `DropdownMenuRoot` (see `docs/components/dropdown-menu.md`). |

Outside a `Menubar` a `MenubarMenu` renders nothing rather
than an uncoordinated dropdown — there is no coordinated open
state to bind.

### Props

#### `Menubar` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `openValue` | `string \| null` | no | — | Controlled open menu value (`null` closed). Wins over `defaultOpenValue`. |
| `defaultOpenValue` | `string \| null` | no | `null` | Uncontrolled initial open menu value (closed). |
| `onOpenValueChange` | `(value: string \| null) => void` | no | — | Fires with the next open value on every committed open or dismissal. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the menu bar. |
| `testID` | `string` | no | — | Test identifier, forwarded to the bar container. |
| `style` | `StateStyle<MenubarState, StyleProp<ViewStyle>>` | no | — | Bar container style: a value or a function of menubar state (row layout is default). |
| `children` | `ReactNode` | no | — | `MenubarMenu` elements. |
| `render` | `RenderProp<MenubarState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the bar container `View`. |

`MenubarState`: `{ openValue: string | null }` — currently
open menu value (`null` closed).

#### `MenubarMenu`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Menu value identifying this trigger/panel pair. |
| `children` | `ReactNode` | no | — | Trigger content plus `DropdownMenuItem`/`DropdownMenuSub` elements. |
| `testID` | `string` | no | — | Test identifier, forwarded to the menu container. |
| `style` | `StyleProp<ViewStyle>` | no | — | Menu content box style, caller-provided. |
| `render` | `RenderProp<DropdownMenuRootState, SlotProps>` | no | — | Element or function substitution, forwarded to the menu's content box (see `DropdownMenuRootProps.render`). |

### Examples

File bar with two menus, uncontrolled:

```tsx
import { Text } from "react-native";
import {
  DropdownMenuItem,
  DropdownMenuTrigger,
  Menubar,
  MenubarMenu,
} from "@xoroh/axis";

function FileBar() {
  return (
    <Menubar accessibilityLabel="File commands">
      <MenubarMenu value="file">
        <DropdownMenuTrigger accessibilityLabel="File">
          <Text>File</Text>
        </DropdownMenuTrigger>
        <DropdownMenuItem value="new">New</DropdownMenuItem>
        <DropdownMenuItem value="open">Open</DropdownMenuItem>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <DropdownMenuTrigger accessibilityLabel="Edit">
          <Text>Edit</Text>
        </DropdownMenuTrigger>
        <DropdownMenuItem value="undo">Undo</DropdownMenuItem>
      </MenubarMenu>
    </Menubar>
  );
}
```

Controlled (parent owns which menu is open):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  DropdownMenuItem,
  DropdownMenuTrigger,
  Menubar,
  MenubarMenu,
} from "@xoroh/axis";

function ControlledBar() {
  const [openValue, setOpenValue] = useState<string | null>(null);
  return (
    <Menubar
      openValue={openValue}
      onOpenValueChange={setOpenValue}
      accessibilityLabel="File commands"
    >
      <MenubarMenu value="file">
        <DropdownMenuTrigger accessibilityLabel="File">
          <Text>File</Text>
        </DropdownMenuTrigger>
        <DropdownMenuItem value="new">New</DropdownMenuItem>
      </MenubarMenu>
    </Menubar>
  );
}
```

### Accessibility

- The bar is an accessibility element (`accessible`)
  carrying the `menubar` role and the caller's label.
- Each open menu is a `DropdownMenuRoot`: same trigger/item/sub
  parts, same `menu`/`menuitem` roles, same "Dismiss menu"
  scrim — see `docs/components/dropdown-menu.md`.
- Pressing another menu's trigger while one is open switches
  panels (each scrim fills only its own container).
- Explicitly deferred, each for a named reason: no animation
  (the `Menu` rationale); no hover or keyboard traversal (no
  touch equivalent; `roving`/`collection` unadopted for menus);
  no portal/`Modal` host (paints inside the parent's box).

### Composition

Every part takes `render` and value-or-function `style` over
its state object (`{ openValue }`; menu content-box style via
`DropdownMenuRootState`); `data-*` attributes are deliberately
absent on native — state flows through those functions instead
(contract §11, parity D1). Verified by the menubar RNTL suites
(9 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/bars.tsx`.
