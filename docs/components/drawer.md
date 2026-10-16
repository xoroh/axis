## Drawer

Source of truth: `DrawerProps` in `@xoroh/axis`.

Edge-anchored navigation panel (Base UI naming): `open?`,
`defaultOpen?`, `onOpenChange?`, `onDismiss?`, `dismissable?`
(default true — scrim press and request-close close; `false`
renders an inert scrim), `side?` (`"left"` default, `"right"`),
`children?`, `accessibilityLabel?`, `testID?` (surface; scrim
takes `<testID>-scrim`), `overlayStyle?`, `surfaceStyle?`
(width lives here), `ref` (surface). No drag gestures (the
`Sheet` pattern covers drag — detents and snap make `Sheet` a
genuinely different primitive, not an alias), no animation, no
back-handler beyond the Modal, no focus trap — each deferred
with rationale in the component header.
`NavigationDrawer` remains as a warn-once deprecated alias.
Example: `<Drawer defaultOpen
accessibilityLabel="App navigation" />`.
