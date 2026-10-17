## Navigation Menu

Source of truth: `NavigationMenuProps` (+ part props) in `@xoroh/axis`.

Top-level navigation bar with flyout panels: `NavigationMenu`
root (`openValue?`/`defaultOpenValue?`/`onOpenValueChange?`
(`null` closed), `onDismiss?`, `testID?`, `style?`, `ref`) with
`NavigationMenuItem` (`value` required) pairs of
`NavigationMenuTrigger` (button role, expanded state) and
`NavigationMenuPanel` (`testID?`, `style?`). Exactly one panel
open at a time; scrim press dismisses. All optional except item
`value`. Example: `<NavigationMenu><NavigationMenuItem
value="products">…</NavigationMenuItem>…</NavigationMenu>`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
