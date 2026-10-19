## OTP Field

Source of truth: `OtpFieldProps` in `@xoroh/axis`.

Segmented code entry with auto-advance: one hidden host `TextInput`
(`keyboardType` number-pad; behavior-hidden but focusable —
invisible 1×1, override with `inputStyle?`) plus digit cells. `value?`,
`defaultValue?`, `onValueChange?`, `length?: number` (default 6,
clamped to ≥1), `disabled?` (read-only), `secureTextEntry?`,
`autoSubmit?` (default `false`; with `onComplete?` fires exactly once
per completion, re-arming after the value drops below full length),
`accessibilityLabel?`, `testID?` (cells are `${testID}-cell-{i}`),
`style?`, `cellStyle?`, `textStyle?`, `inputStyle?`, `ref` (container). All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
