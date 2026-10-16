## Label

Source of truth: `LabelProps` in `@xoroh/axis`.

Unstyled text label. Associates with a control via `nativeID`
(mirrored on the control's `accessibilityLabelledBy`); focus behavior
belongs to the control. No invented role — read as text.

Props: `children?: ReactNode`, `nativeID?: string`,
`testID?: string`, `style?: StyleProp<TextStyle>`, `ref?`. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
