## ContextMenu

Source of truth: `ContextMenuProps` in `@xoroh/axis`.

Long-press popup menu: `children` (anchor, required), `content`
(menu body, required), `open?`, `defaultOpen?`, `onOpenChange?`,
`onDismiss?`, `placement?` (default `"bottom"`, clamped),
`accessibilityLabel?` (menu region), `testID?` (scrim is
`${testID}-scrim`), `style?` (anchor), `menuStyle?`, `ref`
(anchor). Long-press toggles; scrim dismisses through `onDismiss` +
`onOpenChange(false)`. Positions below the anchor — press-point
positioning deferred, not faked. All optional except
`children`/`content`.
