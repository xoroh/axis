## Trigger

Source of truth: `TriggerProps` in `@xoroh/axis`.

Semantics-free press container for custom controls whose role
the caller asserts: `onPress?`, `disabled?` (terminal),
`accessibilityLabel?` (no default), `testID?`, `style?`,
`children?`, `ref`. Asserts no role — a `Trigger` with a button
role and a label is a `Button` written the long way (reach for
`Button`/`Switch` when the control owns those semantics; icon
actions are `Button` with a required `accessibilityLabel`).
Example: `<Trigger onPress={activate}><Dot
active={on} /></Trigger>`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
