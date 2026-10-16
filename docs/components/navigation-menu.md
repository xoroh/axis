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
