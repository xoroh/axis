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
