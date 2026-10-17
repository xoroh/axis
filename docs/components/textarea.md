## Textarea

Source of truth: `TextareaProps` in `@xoroh/axis`.

Multiline entry: `value?`, `defaultValue?` (default `""`),
`onValueChange?` (Base UI name — contract §6; the host `TextInput`
still receives RN `onChangeText`), `placeholder?`, `editable?`
(default `true`), `numberOfLines?` (default 3), `autoGrow?`
(measured height merged under caller style, no animation),
`accessibilityLabel?`, `testID?`,
`style?: StateStyle<TextareaState, StyleProp<TextStyle>>` (value or
function of `{ value, editable }`),
`render?: RenderProp<TextareaState, SlotProps>`, `ref`. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
