## Field

Source of truth: `FieldProps` in `@xoroh/axis`.

Label/control/error row: `label?`, `children?` (control),
`error?` (rendered only when provided, announced politely),
`testID?`, `style?`, `labelStyle?`, `errorStyle?`, `ref?` (container). No validation
logic — validity is caller state expressed by passing `error`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
