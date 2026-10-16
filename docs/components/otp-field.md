## OTP Field

Source of truth: `OtpFieldProps` in `@xoroh/axis`.

Segmented code entry with auto-advance: one hidden host `TextInput`
(`keyboardType` number-pad) plus digit cells. `value?`,
`defaultValue?`, `onValueChange?`, `length?: number` (default 6,
clamped to ≥1), `disabled?` (read-only), `secureTextEntry?`,
`autoSubmit?` (default `false`; with `onComplete?` fires exactly once
per completion, re-arming after the value drops below full length),
`accessibilityLabel?`, `testID?` (cells are `${testID}-cell-{i}`),
`style?`, `cellStyle?`, `textStyle?`, `ref` (container). All optional.
