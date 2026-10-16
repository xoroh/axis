## Loader

Source of truth: `LoaderProps` in `@xoroh/axis`.

Busy indicator: host `ActivityIndicator` with announced busy
state. `size?: number | "small" | "large"`, `color?: string`,
`accessibilityLabel?`, `testID?`, `style?`, `ref?` (container). All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
