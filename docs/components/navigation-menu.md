## Navigation Menu

Top-level navigation bar with flyout panels: a bar row of
triggers, each opening one panel below the bar; exactly one
panel is open at a time. The bar lays its triggers in a row by
default (direction is structure here the way bottom anchoring
is structure for a bottom `Drawer`). The open panel is application state
(it drives navigation), unlike a dropdown cascade path: `openValue`
(plus `onOpenValueChange`) for controlled use,
`defaultOpenValue` for uncontrolled (`null` closed). Panels
render in flow below the bar; fly-out geometry beyond that is
caller `style`. Closed presence is mount/unmount: closed
renders the bar only — no panels, no scrim.

Source of truth: `NavigationMenuProps`,
`NavigationMenuState`, `NavigationMenuItemProps`,
`NavigationMenuTriggerProps`, `NavigationMenuTriggerState`,
`NavigationMenuPanelProps` in `@xoroh/axis`
(`packages/axis/src/components/NavigationMenu.tsx:58-130`).

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
| `NavigationMenu` | `NavigationMenu.Root` | State owner (`openValue`/`defaultOpenValue`/`onOpenValueChange`/`onDismiss`); bar row container. |
| `NavigationMenuItem` | `NavigationMenu.Item` | Trigger/panel pair (`value` identifies it); partitions children by type into trigger content and one panel. |
| `NavigationMenuTrigger` | `NavigationMenu.Trigger` | Button role, expanded state, tap opens its item; a bare trigger-zone element gets open composed onto its `onPress`. |
| `NavigationMenuPanel` | `NavigationMenu.Content` | `menu`-role panel; mounts only inside its item, while open. |

It differs from `Menubar` in what opens: navigation panels
rather than menu-command panels (see
`docs/components/menubar.md`).

### Props

#### `NavigationMenu` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `openValue` | `string \| null` | no | — | Controlled open item value (`null` closed). Wins over `defaultOpenValue`. |
| `defaultOpenValue` | `string \| null` | no | `null` | Uncontrolled initial open item value (closed). |
| `onOpenValueChange` | `(value: string \| null) => void` | no | — | Fires with the next open value on every committed open or dismissal. |
| `onDismiss` | `() => void` | no | — | Fires on scrim dismissal, before `onOpenValueChange(null)`. |
| `testID` | `string` | no | — | Test identifier; the open panel carries its own `testID` when provided, the scrim carries `<testID>-scrim`. |
| `style` | `StateStyle<NavigationMenuState, StyleProp<ViewStyle>>` | no | — | Bar container style: a value or a function of menu state (row layout is default). |
| `children` | `ReactNode` | yes | — | `NavigationMenuItem` elements. |
| `render` | `RenderProp<NavigationMenuState, SlotProps>` | no | — | Element or function substitution; replaces the bar container. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the bar container `View`. |

`NavigationMenuState`: `{ openValue: string | null }` —
currently open item value (`null` closed).

#### `NavigationMenuItem`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Item value identifying this trigger/panel pair. |
| `children` | `ReactNode` | yes | — | Trigger content plus one `NavigationMenuPanel`. |

#### `NavigationMenuTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never opens and is announced as disabled. Inert outside a menu. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<NavigationMenuTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger pressable style: a value or a function of trigger state. |
| `children` | `ReactNode` | yes | — | Trigger content (an empty trigger is a bug). |
| `render` | `RenderProp<NavigationMenuTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`NavigationMenuTriggerState`: `{ open: boolean; disabled: boolean }` — whether this trigger's panel is currently open, and whether the trigger is currently disabled.

Outside a `NavigationMenu` the trigger renders collapsed and
inert. Any non-`NavigationMenuTrigger` element in the trigger
zone gets open composed onto its `onPress` (internal open
first, then the caller's handler).

#### `NavigationMenuPanel`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the panel. |
| `style` | `StyleProp<ViewStyle>` | no | — | Panel style, caller-provided (fly-out geometry lives here). |
| `children` | `ReactNode` | no | — | Panel content. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the panel still mounts only inside its item, while open. |

### Examples

Docs bar with two sections, uncontrolled:

```tsx
import { Text } from "react-native";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "@xoroh/axis";

function DocsBar() {
  return (
    <NavigationMenu>
      <NavigationMenuItem value="guides">
        <NavigationMenuTrigger accessibilityLabel="Guides">
          <Text>Guides</Text>
        </NavigationMenuTrigger>
        <NavigationMenuPanel>
          <Text>Getting started</Text>
        </NavigationMenuPanel>
      </NavigationMenuItem>
      <NavigationMenuItem value="api">
        <NavigationMenuTrigger accessibilityLabel="API reference">
          <Text>API</Text>
        </NavigationMenuTrigger>
        <NavigationMenuPanel>
          <Text>Components</Text>
        </NavigationMenuPanel>
      </NavigationMenuItem>
    </NavigationMenu>
  );
}
```

Controlled (the open panel is application state — it drives
navigation):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "@xoroh/axis";

function ControlledBar() {
  const [openValue, setOpenValue] = useState<string | null>(null);
  return (
    <NavigationMenu openValue={openValue} onOpenValueChange={setOpenValue}>
      <NavigationMenuItem value="guides">
        <NavigationMenuTrigger accessibilityLabel="Guides">
          <Text>Guides</Text>
        </NavigationMenuTrigger>
        <NavigationMenuPanel>
          <Text>Getting started</Text>
        </NavigationMenuPanel>
      </NavigationMenuItem>
    </NavigationMenu>
  );
}
```

### Accessibility

- Triggers are `button`-role hosts with `expanded` +
  `disabled` state; the open panel carries the `menu` role as
  an accessibility element.
- The scrim is a `Pressable` labelled "Dismiss menu" with
  `<testID>-scrim`; while open it covers the bar, so pressing
  the open trigger dismisses through the scrim path rather
  than toggling (the `Menu` precedent).
- Closed renders the bar only: no panels, no scrim, for
  assistive tech or tests to find.
- Explicitly deferred, each for a named reason: no animation
  (the `Menu` rationale); no hover or keyboard traversal (no
  touch equivalent; `roving`/`collection` unadopted for
  menus); no portal/`Modal` host (paints inside the parent's
  box).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ openValue
}`, `{ open, disabled }`), except the panel, whose style
stays static (the `DialogTitle` precedent); `data-*`
attributes are deliberately absent on native — state flows
through those functions instead (contract §11, parity D1).
Verified by the navigation-menu RNTL suites (9 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/bars.tsx`.
