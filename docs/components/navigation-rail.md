## Navigation Rail

Source of truth: `NavigationRailProps` (+ item props) in `@xoroh/axis`.

Vertical destination rail: a rail IS a vertical bar — thin wrapper
over `NavigationBar` (vertical default, overridable, `ref?`
forwarded), and
`NavigationRailItem` is `NavigationBarItem` under its rail name.
One implementation, one inventory row. Example:
`<NavigationRail><NavigationRailItem value="home" label="Home"
/>…</NavigationRail>`.
