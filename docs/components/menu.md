## Menu

Source of truth: `MenuProps`, `MenuItemProps`, `MenuTriggerProps`, `MenuRootProps`, `MenuInputProps`, `MenuClearProps`, `MenuEmptyProps` in `@xoroh/axis`.

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
sequence), `MenuArrow` (caller-positioned marker),
`MenuCheckboxItem` (+`Indicator`; stays open by default),
`MenuRadioGroup`/`MenuRadioItem` (+`Indicator`; closes on
select). Submenu cascade lives in `DropdownMenu` (same
dismissal-stack pattern at root level — submenus compose there,
not as `Menu` parts). Filtering (compound roots only — the
monolith partitions children by type with no filter composition
point): `MenuRoot` owns the query (`filterValue?`/
`defaultFilterValue?`/`onFilterChange?`) with `MenuInput` (text
entry bound to the query), `MenuClear` (resets; disabled with an
empty query), `MenuEmpty` (renders when the query matches
nothing); items publish `filterText?` (defaults to bare string
children; textless items always show) through the `collection`
registry, and `MenuEmpty` counts the same rule items hide by.
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
