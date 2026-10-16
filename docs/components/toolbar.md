## Toolbar

Source of truth: `ToolbarProps` in `@xoroh/axis`.

Control group container: `orientation?: "horizontal" | "vertical"`
(default `"horizontal"`, applied as structural flex direction),
`disabled?`, `accessibilityLabel?` (toolbar role asserted via
props — containers are not accessibility elements, so role queries
do not match; documented), `testID?`, `style?`, `children`
(required), `ref`. No roving keyboard (transfer-gated model).
All optional except `children`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
