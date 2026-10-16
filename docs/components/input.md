## Input

Source of truth: `InputProps` in `@xoroh/axis`.

Single-line text entry: `value?`, `defaultValue?` (default `""`),
`onValueChange?: (text: string) => void` (Base UI name — contract §6;
the host `TextInput` still receives RN `onChangeText`),
`placeholder?`, `secureTextEntry?` (default `false`), `editable?`
(default `true`, `false` is read-only), `accessibilityLabel?`,
`testID?`, `style?: StateStyle<InputState, StyleProp<TextStyle>>`
(value or function of `{ value, editable }`),
`render?: RenderProp<InputState, SlotProps>`, `ref` (host input).
Payloads stay primitive strings. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
