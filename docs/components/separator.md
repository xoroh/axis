## Separator

Source of truth: `SeparatorProps` in `@xoroh/axis`.

Unstyled divider. A silent `View` (`accessible={false}` — React
Native defines no separator role, and an unbacked claim is worse than
silence). Direction is a styling decision in `style`; no orientation
prop it cannot honor.

Props: `testID?: string`, `style?: StyleProp<ViewStyle>`, `ref?`. All optional.
