## Menu

Popup menu: the trigger toggles a content box measured and placed
against the trigger anchor; items activate on press (select +
close), submenus cascade, and an optional filter query narrows the
list. Structure, behavior, and accessibility only — every visual
value (`style`) is caller-provided. State follows the controlled +
uncontrolled pattern throughout: `open` (plus `onOpenChange`) for
controlled use, `defaultOpen` for uncontrolled. The compound
parts below mirror Base UI's Menu anatomy with the same names and
state semantics.

Source of truth: `MenuTriggerProps`,
`MenuTriggerState`, `MenuItemProps`, `MenuItemState`,
`MenuRootProps`, `MenuRootState`, `MenuBackdropProps`,
`MenuBackdropState`, `MenuPositionerProps`,
`MenuPositionerState`, `MenuPopupProps`, `MenuPopupState`,
`MenuSeparatorProps`, `MenuPortalProps`, `MenuGroupProps`,
`MenuGroupLabelProps`, `MenuLinkItemProps`, `MenuArrowProps`,
`MenuCheckboxItemProps`, `MenuCheckboxItemState`,
`MenuCheckboxItemIndicatorProps`, `MenuRadioGroupProps`,
`MenuRadioItemProps`, `MenuRadioItemState`,
`MenuRadioItemIndicatorProps`, `MenuInputProps`, `MenuClearProps`,
`MenuClearState`, `MenuEmptyProps`, `MenuSubmenuRootProps`,
`MenuSubmenuTriggerProps`, `MenuSubmenuContentProps` in
`@xoroh/axis` (`packages/axis/src/components/Menu.tsx:121-218,
766-887, 1311-1387, 1556-1672, 2026-2073, 2223-2353`).

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
| `MenuRoot` | `Menu.Root` | State owner (`open`/`onOpenChange`/`onDismiss`, `modal`, filter query); renders no element. Wraps an `OverlayRoot` so back, stacking, dismissal, and focus belong to one owner. |
| `MenuTrigger` | `Menu.Trigger` | Button role, expanded state, tap toggles, anchor-registering. |
| `MenuPortal` | `Menu.Portal` | `OverlayPortal` host when modal — the menu escapes clipped parents; plain in-box `View` when non-modal. |
| `MenuBackdrop` | `Menu.Backdrop` | Scrim dismissal, modal roots only. |
| `MenuPositioner` | `Menu.Positioner` | Measured placement against the trigger anchor (`side`/`align`/offsets, viewport flip). |
| `MenuPopup` | `Menu.Popup` | Content box carrying the `menu` role. |
| `MenuItem` | `Menu.Item` | Leaf action (`value`/`onSelect`/`onClick`, press-highlighted, closes by default). |
| `MenuSeparator` | `Menu.Separator` | Non-interactive divider, hidden from assistive tech. |
| `MenuGroup` | `Menu.Group` | Group container. |
| `MenuGroupLabel` | `Menu.GroupLabel` | Group heading text. |
| `MenuLinkItem` | — | Leaf with the `link` role (same activation sequence as `MenuItem`). |
| `MenuArrow` | `Menu.Arrow` | Caller-positioned marker; geometry is caller style. |
| `MenuCheckboxItem` | `Menu.CheckboxItem` | Checkable row (stays open by default); indicator composed by the caller. |
| `MenuCheckboxItemIndicator` | `Menu.CheckboxItem.Indicator` | Check mark; renders only while checked. |
| `MenuRadioGroup` | `Menu.RadioGroup` | Single-select group (`value`/`onValueChange`). |
| `MenuRadioItem` | `Menu.RadioItem` | Radio option (`value` required); closes on select. |
| `MenuRadioItemIndicator` | `Menu.RadioItem.Indicator` | Selected mark; renders only while selected. |
| `MenuInput` | — | Filter text entry bound to the root query (compound roots only). |
| `MenuClear` | — | Resets the query; disabled with an empty query. |
| `MenuEmpty` | — | Renders when the query matches nothing. |
| `MenuSubmenuRoot` | `Menu.SubmenuRoot` | Submenu branch (`value` identifies the cascade path). |
| `MenuSubmenuTrigger` | `Menu.SubmenuTrigger` | Opens the branch; disabled is terminal. |
| `MenuSubmenuContent` | `Menu.SubmenuContent` | Nested `menu`-role panel; leaf activation dismisses the whole stack. |

Omitted Base UI pieces are documented deviations, not
oversights: no `Portal` `container`/`keepMounted` (D2/D3), no
`data-*` attributes (D1), no transition attributes (D9), no hover
or keyboard traversal (D8 — touch has no hover; the press IS the
highlight) — all recorded in `docs/BASE_UI_PARITY.md` (§ Menu —
aligned). Filter parts read the root query (nothing renders
outside a root). Submenus also wrap
`DropdownMenuSub` inside `DropdownMenu` (see
`docs/components/dropdown-menu.md`).

### Overlay hosting

The compound menu presents through `OverlayRoot` +
`OverlayPortal` painting at the app's `PortalHost` — that is what
lets it escape clipped parents without an RN `Modal` of its own
(one root presents every layer: Android back, stacking, focus,
and scroll lock belong to the `OverlayRoot` above). `modal`
(default `true`) flows straight into `OverlayRoot`: modal roots
paint at `PortalHost` with a scrim; `modal={false}` roots render
in-box with no scrim. `disablePointerDismissal`
(default `false`) flows into `dismissable` and every dismiss
branch (`outsidePointer`, `systemBack`, `escape`); `onDismiss`
fires on scrim dismissal before `onOpenChange(false)`. No family
part takes `useModal` itself — the RN `Modal` host is an
`OverlayRoot`-level opt-in for direct `Overlay` compositions
(see `docs/components/overlay.md`).

### Props

#### `MenuRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed toggle or dismissal. |
| `onDismiss` | `() => void` | no | — | Fires on scrim dismissal, before `onOpenChange(false)`. |
| `disablePointerDismissal` | `boolean` | no | `false` | When `true`, backdrop press does not dismiss. |
| `modal` | `boolean` | no | `true` | Whether the open menu presents modally (overlay host with a scrim). `false` renders in-box with no scrim. |
| `filterValue` | `string` | no | — | Controlled filter query. Wins over `defaultFilterValue` when defined. |
| `defaultFilterValue` | `string` | no | `""` | Uncontrolled initial filter query. |
| `onFilterChange` | `(query: string) => void` | no | — | Fires with the query on every text-entry change. |
| `children` | `ReactNode` | no | — | Trigger, Portal, and shared content. Renders no element itself. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded nowhere (the root renders no element); accepted so ref-spreading callers typecheck. |

`MenuRootState`: `{ open: boolean }` — the current open state.

#### `MenuTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never toggles and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<MenuTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `children` | `ReactNode` | no | — | Trigger content. Optional when `render` supplies it. |
| `render` | `RenderProp<MenuTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`MenuTriggerState`: `{ open: boolean; disabled: boolean }`.

#### `MenuPortal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Portal content (Backdrop + Positioner composed by the caller). |
| `testID` | `string` | no | — | Test identifier, forwarded to the portal host. |

Renders `null` outside a root and while closed. Modal roots
paint through `OverlayPortal` at the app's `PortalHost`;
non-modal roots render an in-box `View` instead.

#### `MenuBackdrop`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the scrim host. |
| `style` | `StateStyle<MenuBackdropState, StyleProp<ViewStyle>>` | no | — | Scrim style: a value or a function of backdrop state. |
| `render` | `RenderProp<MenuBackdropState, SlotProps>` | no | — | Element or function substitution; dismissal wiring stays on the part. |

`MenuBackdropState`: `{ open: boolean }`. Exists only for modal
roots: without an overlay host a full-fill scrim would trap the
app's touches with no dismissal path except the trigger, so
non-modal roots render no backdrop.

#### `MenuPositioner`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `side` | `Placement` | no | `"bottom"` | Preferred side for the content box. |
| `align` | `Align` | no | `"center"` | Cross-axis alignment. |
| `sideOffset` | `number` | no | `0` | Gap between anchor and content edges. |
| `alignOffset` | `number` | no | `0` | Shift along the cross axis after alignment. |
| `testID` | `string` | no | — | Test identifier, forwarded to the positioner host. |
| `style` | `StateStyle<MenuPositionerState, StyleProp<ViewStyle>>` | no | — | Positioner style: a value or a function of positioner state. |
| `children` | `ReactNode` | no | — | Popup (and optional Arrow content) composed by the caller. |
| `render` | `RenderProp<MenuPositionerState, SlotProps>` | no | — | Element or function substitution; measurement stays on the part. |

`MenuPositionerState`: `{ open: boolean; side: Placement }` —
the effective side after viewport flip/clamping. Renders `null`
outside a root and while closed.

#### `MenuPopup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the content `View`. |
| `style` | `StateStyle<MenuPopupState, StyleProp<ViewStyle>>` | no | — | Popup style: a value or a function of popup state. |
| `children` | `ReactNode` | no | — | Item content. |
| `render` | `RenderProp<MenuPopupState, SlotProps>` | no | — | Element or function substitution; the `menu` role stays on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the content `View`. |

`MenuPopupState`: `{ open: boolean }`. Renders `null` outside
a root and while closed. Typeahead keys are handled here (a
typed prefix highlights the matching item).

#### `MenuItem`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | no | — | Optional on its own; required for `onSelect` and for cascade identity in `DropdownMenu`. |
| `disabled` | `boolean` | no | `false` | Terminal: it never selects and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<MenuItemState, StyleProp<ViewStyle>>` | no | — | Value or function of item state. |
| `children` | `ReactNode` | no | — | Item content. |
| `onSelect` | `(value: string) => void` | no | — | Fires with `value` on activation, before `onClick` and close. Requires `value`. |
| `onClick` | `(event: unknown) => void` | no | — | Fires on activation, after `onSelect` (Base UI parity). Always fires. |
| `filterText` | `string` | no | — | Matchable text for `MenuInput` filtering. Defaults to bare string children; textless items always show. |
| `closeOnClick` | `boolean` | no | `true` | Whether activation closes the menu (`false` keeps it open, the checkbox-style pattern). |
| `render` | `RenderProp<MenuItemState, SlotProps>` | no | — | Element or function substitution. |

`MenuItemState`: `{ disabled: boolean; highlighted: boolean }` —
whether pressed. Touch has no hover highlight: the press IS the
highlight.

#### `MenuSeparator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Separator style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MenuGroup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Group container style, caller-provided. |
| `children` | `ReactNode` | no | — | Group content (`MenuGroupLabel` + items). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MenuGroupLabel`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the label text. |
| `style` | `StyleProp<TextStyle>` | no | — | Label text style, caller-provided. |
| `children` | `ReactNode` | no | — | Label content. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MenuLinkItem`

Same activation sequence as `MenuItem`, but with the `link`
role:

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | no | — | Optional, like `MenuItem`. |
| `disabled` | `boolean` | no | `false` | Terminal: it never selects and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<MenuItemState, StyleProp<ViewStyle>>` | no | — | Value or function of item state (shared state shape). |
| `children` | `ReactNode` | no | — | Item content. |
| `filterText` | `string` | no | — | Matchable text for filtering; textless items always show. |
| `onSelect` | `(value: string) => void` | no | — | Fires with `value` on activation. Requires `value`. |
| `onClick` | `(event: unknown) => void` | no | — | Fires on activation, after `onSelect`. Always fires. |
| `closeOnClick` | `boolean` | no | `true` | Whether activation closes the menu. |
| `render` | `RenderProp<MenuItemState, SlotProps>` | no | — | Element or function substitution. |

#### `MenuArrow`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the arrow host. |
| `style` | `StyleProp<ViewStyle>` | no | — | Marker style, caller-provided (static — positioning is caller geometry, no anchor/popup measurements). |
| `children` | `ReactNode` | no | — | Marker content (usually none — the shape is caller style). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MenuCheckboxItem`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `checked` | `boolean` | no | — | Controlled checked state. Wins over `defaultChecked` when defined. |
| `defaultChecked` | `boolean` | no | `false` | Uncontrolled initial checked state. |
| `onCheckedChange` | `(checked: boolean) => void` | no | — | Fires with the next checked state on every toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: it never toggles and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<MenuCheckboxItemState, StyleProp<ViewStyle>>` | no | — | Value or function of checkbox-item state. |
| `children` | `ReactNode` | no | — | Indicator + label composed by the caller. |
| `filterText` | `string` | no | — | Matchable text for filtering; textless items always show. |
| `closeOnClick` | `boolean` | no | `false` | Stays open by default (pass `true` for one-shot rows). |
| `render` | `RenderProp<MenuCheckboxItemState, SlotProps>` | no | — | Element or function substitution. |

`MenuCheckboxItemState`: `{ checked: boolean; disabled: boolean; highlighted: boolean }`.

#### `MenuCheckboxItemIndicator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Indicator style, caller-provided. |
| `children` | `ReactNode` | no | — | Check mark, rendered only while checked. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MenuRadioGroup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string \| null` | no | — | Controlled selected value (`null` nothing selected). Wins over `defaultValue` when defined. |
| `defaultValue` | `string \| null` | no | `null` | Uncontrolled initial selected value. |
| `onValueChange` | `(value: string) => void` | no | — | Fires with the chosen option value on every committed selection. |
| `children` | `ReactNode` | no | — | Group label + radio items. |

#### `MenuRadioItem`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Item value identifying the option (group identity). |
| `disabled` | `boolean` | no | `false` | Terminal: it never selects and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<MenuRadioItemState, StyleProp<ViewStyle>>` | no | — | Value or function of radio-item state. |
| `children` | `ReactNode` | no | — | Indicator + label composed by the caller. |
| `filterText` | `string` | no | — | Matchable text for filtering; textless items always show. |
| `render` | `RenderProp<MenuRadioItemState, SlotProps>` | no | — | Element or function substitution. |

`MenuRadioItemState`: `{ selected: boolean; disabled: boolean; highlighted: boolean }`. Closes the menu on select.

#### `MenuRadioItemIndicator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Indicator style, caller-provided. |
| `children` | `ReactNode` | no | — | Selected mark, rendered only while selected. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `MenuInput` (compound roots only)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `placeholder` | `string` | no | — | Placeholder for the filter entry. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the entry. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<TextStyle>` | no | — | Entry style, caller-provided. |
| `disabled` | `boolean` | no | `false` | Terminal: the query never changes. |
| `ref` | `Ref<ElementRef<typeof TextInput>>` | no | — | Forwarded to the entry `TextInput`. |

Renders nothing outside a root (filter parts read only the root query).

#### `MenuClear` (compound roots only)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<MenuClearState, StyleProp<ViewStyle>>` | no | — | Value or function of clear state. |
| `children` | `ReactNode` | no | — | Label composed by the caller. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `disabled` | `boolean` | no | `false` | Terminal: it never clears. |
| `render` | `RenderProp<MenuClearState, SlotProps>` | no | — | Element or function substitution. |

`MenuClearState`: `{ query: string; disabled: boolean }` —
disabled with an empty query, or when terminal.

#### `MenuEmpty` (compound roots only)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Empty-state style, caller-provided. |
| `children` | `ReactNode` | no | — | "No matches" content composed by the caller. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

Renders only when the query matches nothing (counting the same
rule items hide by: `filterText`, defaulting to bare string
children; textless items always show).

#### `MenuSubmenuRoot`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Value identifying the submenu branch in the cascade. |
| `children` | `ReactNode` | yes | — | Submenu trigger + popup/panel parts. |

#### `MenuSubmenuTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never opens and is announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<{ open: boolean; disabled: boolean }, StyleProp<ViewStyle>>` | no | — | Value or function of submenu-trigger state. |
| `children` | `ReactNode` | no | — | Trigger content. |
| `render` | `RenderProp<{ open: boolean; disabled: boolean }, SlotProps>` | no | — | Element or function substitution. |

#### `MenuSubmenuContent`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Panel style, caller-provided. |
| `children` | `ReactNode` | no | — | Nested items. Mounts only while open. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

Opening a submenu replaces the path below it (siblings close,
ancestors stay); leaf activation and scrim press dismiss the
whole stack (nested-dismiss).

### Examples

Minimal compound menu, uncontrolled:

```tsx
import { Text } from "react-native";
import { MenuItem, MenuRoot, MenuTrigger } from "@xoroh/axis";

function Actions() {
  return (
    <MenuRoot>
      <MenuTrigger accessibilityLabel="Open actions menu">
        <Text>Open</Text>
      </MenuTrigger>
      <MenuItem value="new" testID="action-new">
        New
      </MenuItem>
      <MenuItem value="open">Open</MenuItem>
    </MenuRoot>
  );
}
```

Controlled with selection handling:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { MenuItem, MenuRoot, MenuTrigger } from "@xoroh/axis";

function ControlledActions() {
  const [open, setOpen] = useState(false);
  return (
    <MenuRoot open={open} onOpenChange={setOpen}>
      <MenuTrigger accessibilityLabel="Open actions menu">
        <Text>Open</Text>
      </MenuTrigger>
      <MenuItem value="new" onSelect={(value) => console.log(value)}>
        New
      </MenuItem>
    </MenuRoot>
  );
}
```

Compound form (Base UI anatomy — root, trigger, portal, backdrop,
positioner, popup, item, separator), with filter parts so typing
narrows the list and an empty state covers no matches:

```tsx
import { Text } from "react-native";
import {
  MenuBackdrop,
  MenuClear,
  MenuEmpty,
  MenuInput,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from "@xoroh/axis";

function CompoundActions() {
  return (
    <MenuRoot>
      <MenuTrigger accessibilityLabel="Open actions menu">
        <Text>Open</Text>
      </MenuTrigger>
      <MenuPortal>
        <MenuBackdrop />
        <MenuPositioner side="bottom" align="start">
          <MenuPopup>
            <MenuInput placeholder="Filter actions" />
            <MenuItem value="new">New</MenuItem>
            <MenuSeparator />
            <MenuItem value="open" closeOnClick={false}>
              Pinned
            </MenuItem>
            <MenuEmpty>
              <Text>No matches</Text>
            </MenuEmpty>
            <MenuClear accessibilityLabel="Clear filter">
              <Text>Clear</Text>
            </MenuClear>
          </MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </MenuRoot>
  );
}
```

### Accessibility

- The content box is an accessibility element (`accessible`)
  carrying the `menu` role, so the role reaches assistive
  technology — a role on a non-element `View` would be invisible
  to it.
- Triggers (menu and submenu) are `button`-role hosts with
  `expanded` + `disabled` state; items carry `menuitem`
  (`MenuItem`), `link` (`MenuLinkItem`), `checkbox` + `checked`
  (`MenuCheckboxItem`), and `radio` + `selected`
  (`MenuRadioItem`); groups carry the `group` role; arrows and
  separators render `accessible={false}` so they never appear in
  the tree.
- The dismissable scrim is a `Pressable` labelled "Dismiss menu";
  scrim press closes through `onDismiss` + `onOpenChange(false)`.
  Taps inside the box never dismiss: the box is the scrim's
  sibling, not its child.
- Closed renders nothing at all (no scrim, no box) for assistive
  tech or tests to find — except the trigger, which stays visible.
- Explicitly deferred, each for a named reason: no animation
  (the box mounts/unmounts synchronously with state — exit
  transitions would need the `presence` model to keep it mounted,
  unneeded until a consumer needs animated dismissal — the Dialog
  precedent); no hover or keyboard traversal (no pointer on touch
  devices — parity D8; the press IS the highlight, hover nav
  deferred with rationale in-file); no focus trap (containing
  accessibility focus needs the `focusTrap` + `overlayModality`
  RN adaptation — no DOM tab order to borrow).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ open }`,
`{ open, disabled }`, `{ disabled, highlighted }`, `{ checked,
disabled, highlighted }`, `{ selected, disabled, highlighted }`,
`{ query, disabled }`), except `Separator`/`Group`/`GroupLabel`/
`Arrow`/`Empty`/`SubmenuContent`/indicators, whose styles stay
static (the `DialogTitle` precedent — a function of empty state
adds nothing); `data-*` attributes are deliberately absent on
native — state flows through those functions instead (contract
§11, parity D1). Filtering (`Input`/`Clear`/`Empty` + root
`filterValue`/`defaultFilterValue`/`onFilterChange` + item
`filterText`) publishes through the shared `collection` registry
— the same model Combobox and Select typeahead consume. The
omitted Base UI pieces (`container`, `keepMounted`, transition
attributes, hover/keyboard traversal) and the `modal` behavior
are recorded in `docs/BASE_UI_PARITY.md` (§ Menu — aligned).
Verified by the menu RNTL suites (42 tests —
`docs/COVERAGE.md`). The compound anatomy renders in
`apps/example/src/demos/menu.tsx`.
