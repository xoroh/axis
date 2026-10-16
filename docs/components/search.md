## Search

Source of truth: `SearchProps` in `@xoroh/axis`.

Search entry composing Axis `Input` with a clear button (rendered
only while the query is non-empty): `value?`, `defaultValue?`
(default `""`), `onValueChange?`, `onSubmit?` (return key),
`placeholder?`, `accessibilityLabel?`, `testID?`, `style?`
(container), `inputStyle?`,
`clearAccessibilityLabel?` (default `"Clear search"`), `ref`
(container). Filtering belongs to the caller. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
