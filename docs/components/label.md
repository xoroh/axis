## Label

Source of truth: `LabelProps` in `@xoroh/axis`.

Unstyled text label. Associates with a control via `nativeID`
(mirrored on the control's `accessibilityLabelledBy`); focus behavior
belongs to the control. No invented role — read as text.

Props: `children?: ReactNode`, `nativeID?: string`,
`testID?: string`, `style?: StyleProp<TextStyle>`, `ref?`. All optional.
