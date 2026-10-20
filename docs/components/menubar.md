## Menubar

Menu-command bar: a row of `MenuRoot` commands (each with a
`value`), each opening a menu panel; exactly one panel is open
at a time. This is composition, not a second menu
implementation: each joined `MenuRoot` (same trigger/item/sub
parts, same dismissal stack, same scrim) is controlled by the
bar's open value. It differs from `NavigationMenuRoot` in what
opens: menu-command panels (`menuitem` content,
cascade-capable) rather than navigation panels. The desktop-bar
pattern adapts to touch by press (no hover): pressing another
menu's trigger while one is open switches panels. The open menu
follows the controlled + uncontrolled pattern
(`openValue`/`defaultOpenValue`/`onOpenValueChange`, `null`
closed): the open panel is application state, like
`NavigationMenuRoot`. Menus paint through their own
`MenuPortal` parts (non-modal, so the bar stays visible while a
panel is open); add a `MenuBackdrop` for scrim dismissal.

Source of truth: `MenubarProps`, `MenubarState` in `@xoroh/axis`
(`packages/axis/src/components/Menubar.tsx`); menus are
`MenuRoot` (see `menu.md`) with a `value`.

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
| `MenuRoot` (with `value`) | `Menubar.Menu` (composition) | Menu joining the bar; open from the bar's open value, open changes reported back (single-open coordination, switching, leaf-close). |

A `MenuRoot` without `value` inside a bar stays standalone —
give each menu a `value` to join.

### Props

#### `Menubar` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `openValue` | `string \| null` | no | — | Controlled open menu value (`null` closed). Wins over `defaultOpenValue`. |
| `defaultOpenValue` | `string \| null` | no | `null` | Uncontrolled initial open menu value (closed). |
| `onOpenValueChange` | `(value: string \| null) => void` | no | — | Fires with the next open value on every committed open or dismissal. |
| `"aria-label"` | `string` | no | — | Accessible name source for the menu bar. |
| `testID` | `string` | no | — | Test identifier, forwarded to the bar container. |
| `style` | `StateStyle<MenubarState, StyleProp<ViewStyle>>` | no | — | Bar container style: a value or a function of menubar state (row layout is default). |
| `children` | `ReactNode` | no | — | `MenuRoot` elements (each with a `value`). |
| `render` | `RenderProp<MenubarState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the bar container `View`. |

`MenubarState`: `{ openValue: string | null }` — currently
open menu value (`null` closed).

#### Menus: `MenuRoot`

Bar menus are the `MenuRoot` part (see `menu.md`): `value`
(required to join — open derives from the bar's open value and
open changes report back), `modal` (use `false` so the bar stays
visible while a panel is open), plus the standalone props
(`defaultOpen` ignored when joined: the bar owns open state).

### Examples

File bar with two menus, uncontrolled:

```tsx
import { Text } from "react-native";
import {
  Menubar,
  MenuBackdrop,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
} from "@xoroh/axis";

function FileBar() {
  return (
    <Menubar aria-label="File commands">
      <MenuRoot value="file" modal={false}>
        <MenuTrigger aria-label="File">
          <Text>File</Text>
        </MenuTrigger>
        <MenuPortal>
          <MenuBackdrop />
          <MenuPositioner>
            <MenuPopup>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="open">Open</MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>
      <MenuRoot value="edit" modal={false}>
        <MenuTrigger aria-label="Edit">
          <Text>Edit</Text>
        </MenuTrigger>
        <MenuPortal>
          <MenuBackdrop />
          <MenuPositioner>
            <MenuPopup>
              <MenuItem value="undo">Undo</MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>
    </Menubar>
  );
}
```

Controlled (parent owns which menu is open):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Menubar, MenuItem, MenuPopup, MenuRoot, MenuTrigger } from "@xoroh/axis";

function ControlledBar() {
  const [openValue, setOpenValue] = useState<string | null>(null);
  return (
    <Menubar
      openValue={openValue}
      onOpenValueChange={setOpenValue}
      aria-label="File commands"
    >
      <MenuRoot value="file" modal={false}>
        <MenuTrigger aria-label="File">
          <Text>File</Text>
        </MenuTrigger>
        <MenuPopup>
          <MenuItem value="new">New</MenuItem>
        </MenuPopup>
      </MenuRoot>
    </Menubar>
  );
}
```

### Accessibility

- The bar is an accessibility element (`accessible`)
  carrying the `menubar` role and the caller's label.
- Each open menu is a joined `MenuRoot`: same trigger/item/sub
  parts, same `menu`/`menuitem` roles, same "Dismiss menu"
  scrim — see `docs/components/menu.md`.
- Pressing another menu's trigger while one is open switches
  panels (single-open coordination).
- Explicitly deferred, each for a named reason: no animation
  (the `Menu` rationale); no hover or keyboard traversal (no
  touch equivalent; `roving`/`collection` unadopted for menus);
  no portal/`Modal` host (paints inside the parent's box).

### Composition

Every part takes `render` and value-or-function `style` over
its state object (`{ openValue }`); `data-*` attributes are deliberately
absent on native — state flows through those functions instead
(contract §11, parity D1). Verified by the menubar RNTL suites
(9 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/bars.tsx`.
