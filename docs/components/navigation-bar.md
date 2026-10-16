## Navigation Bar

Source of truth: `NavigationBarProps` (+ item props) in `@xoroh/axis`.

Destination tab bar: `value?`, `defaultValue?` (defaults to the
first item), `onValueChange?`, `orientation?` (horizontal default),
`accessibilityLabel?`, `testID?`, `style?`, `ref`, with
`NavigationBarItem` (`value` + `label` required, `icon?`,
`disabled?`, `accessibilityLabel?`, `testID?`, `style?`,
`activeStyle?`, `labelStyle?`). Tablist/tab semantics, exactly one
destination active, no deselect on re-press. Screens and navigation
live with the caller. Example: `<NavigationBar><NavigationBarItem
value="home" label="Home" />…</NavigationBar>`.
