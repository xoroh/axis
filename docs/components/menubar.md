## Menubar

Source of truth: `MenubarProps` (+ menu props) in `@xoroh/axis`.

Menu-command bar: `Menubar` root (`openValue?`/
`defaultOpenValue?`/`onOpenValueChange?` (`null` closed),
`accessibilityLabel?`, `testID?`, `style?`, `ref`) with
`MenubarMenu` (`value` required, trigger content plus
`DropdownMenuItem`/`DropdownMenuSub` elements). Each menu IS a
`DropdownMenu` — same parts, stack, and scrim — controlled by the
root so exactly one panel opens; opening another menu's trigger
switches panels (each scrim fills only its own container). Menu
panels (`menuitem` content, cascade-capable), not navigation
panels — that is `NavigationMenu`. All optional except menu
`value`. Example: `<Menubar><MenubarMenu
value="file">…</MenubarMenu>…</Menubar>`.
