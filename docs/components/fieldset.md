## Fieldset

Source of truth: `FieldsetProps` in `@xoroh/axis`.

Group of related fields with a legend: `legend?`, `children?`,
`testID?`, `style?`, `legendStyle?`, `ref?` (container). No invented group role; legend
read as text. No validation logic — validity is caller state.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
