## Menu

Source of truth: `MenuProps`, `MenuItemProps`, `MenuTriggerProps` in `@xoroh/axis`.

Popup menu: `Menu` (`open?`, `defaultOpen?`, `onOpenChange?`,
`onDismiss?`, `testID?`, `style?`, `children`, `ref`) +
`MenuTrigger` (Pressable toggling open) + `MenuItem` (`value?`,
`disabled?`, `onSelect?` (needs `value`), `onClick?`,
`closeOnClick?` default `true`). Bare-element
children in the trigger zone get toggle composed; scrim fills the
menu container (no Modal/portal host — taps inside never dismiss).
No submenus (see `DropdownMenu`), animation, or hover/keyboard nav
(each deferred with rationale in-file). All props optional.

Compound form (Base UI parity — same names, same state
semantics): `MenuRoot` (`open?`/`defaultOpen?`/`onOpenChange?`/
`onDismiss?`/`disablePointerDismissal?`/`modal?` (default true;
`false` renders in-box with no scrim); renders no element) with
`MenuTrigger` (button role, expanded state, anchor-registering),
`MenuPortal` (RN `Modal` host — escapes clipped parents, unlike
the inline monolith), `MenuBackdrop` (scrim), `MenuPositioner`
(`side?`/`align?`/`sideOffset?`/`alignOffset?`, measured against
the trigger), `MenuPopup` (content box, menu role), `MenuItem`
(`highlighted` press state in style fns), `MenuSeparator`,
`MenuGroup`/`MenuGroupLabel`, `MenuLinkItem` (link role, same
sequence), `MenuArrow` (caller-positioned marker).
Every part takes `render` (element or `(props, state)` function)
and value-or-function `style`; `data-*` attributes are
deliberately absent on native (contract §11). Example:

```tsx
<MenuRoot>
  <MenuTrigger><Text>Open</Text></MenuTrigger>
  <MenuPortal>
    <MenuBackdrop />
    <MenuPositioner side="bottom" align="start">
      <MenuPopup>
        <MenuItem value="new" onSelect={pick}>New</MenuItem>
        <MenuSeparator />
        <MenuItem closeOnClick={false}>Pinned</MenuItem>
      </MenuPopup>
    </MenuPositioner>
  </MenuPortal>
</MenuRoot>
```
