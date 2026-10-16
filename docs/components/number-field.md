## Number Field

Source of truth: `NumberFieldProps` in `@xoroh/axis`.

Numeric entry with steppers, composed from Axis `Input` + `Button`
(no reimplemented text entry or press handling): `value?: number |
null` (`null` = empty), `defaultValue?`, `onValueChange?`,
`min?`, `max?`, `step?: number` (default 1, clamped to >0),
`disabled?` (disables input + steppers),
`accessibilityLabel?`, `testID?`, `style?`, `inputStyle?`,
`buttonStyle?` (both steppers), `ref` (container). Invalid text
parses to `null`; stepping clamps into `[min, max]`. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
