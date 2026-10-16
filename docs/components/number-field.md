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
