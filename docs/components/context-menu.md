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

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
