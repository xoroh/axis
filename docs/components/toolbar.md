## Toolbar

Source of truth: `ToolbarProps` in `@xoroh/axis`.

Control group container: `orientation?: "horizontal" | "vertical"`
(default `"horizontal"`, applied as structural flex direction),
`disabled?`, `accessibilityLabel?` (toolbar role asserted via
props — containers are not accessibility elements, so role queries
do not match; documented), `testID?`, `style?`, `children`
(required), `ref`. No roving keyboard (transfer-gated model).
All optional except `children`.
