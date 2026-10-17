## Dropdown Menu

Source of truth: `DropdownMenuProps` (+ part props) in `@xoroh/axis`.

Popup menu with submenu cascade: `DropdownMenu` root
(`open?`/`defaultOpen?`/`onOpenChange?`/`onDismiss?`, `testID?`,
`style?`, `ref`) owns one dismissal stack —
`DropdownMenuTrigger`, leaf `DropdownMenuItem` (`value` required,
`onSelect?`), and `DropdownMenuSub` (`value` required) levels of
`DropdownMenuSubTrigger` + `DropdownMenuSubContent` (`testID?`,
`style?` carries fly-out geometry). Opening a submenu replaces the
path below it (siblings close, ancestors stay); leaf selection and
scrim press close everything. Sub panels render in flow after
their trigger. All optional except item/sub `value`. Example:
`<DropdownMenu><DropdownMenuTrigger … />…</DropdownMenu>`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
