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

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
