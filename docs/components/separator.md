## Separator

Source of truth: `SeparatorProps` in `@xoroh/axis`.

Unstyled divider. A silent `View` (`accessible={false}` — React
Native defines no separator role, and an unbacked claim is worse than
silence). Direction is a styling decision in `style`; no orientation
prop it cannot honor.

Props: `testID?: string`, `style?: StyleProp<ViewStyle>`, `ref?`. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
