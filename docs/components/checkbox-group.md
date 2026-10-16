## Checkbox Group

Source of truth: `CheckboxGroupProps`, `CheckboxGroupItemProps` in `@xoroh/axis`.

Unstyled multi-selection group. Items toggle membership in a shared
value array; re-activating a selected item removes it.

`CheckboxGroupProps`: `value?: readonly string[]`,
`defaultValue?: readonly string[]`,
`onValueChange?: (value: readonly string[]) => void`,
`disabled?: boolean` (disables every item), `accessibilityLabel?:
string`, `testID?: string`, `style?: StyleProp<ViewStyle>`,
`children: ReactNode` (required), `ref` (group root).

`CheckboxGroupItemProps`: `value: string` (required),
`disabled?: boolean`, `accessibilityLabel?: string`,
`testID?: string`, `style?: StyleProp<ViewStyle>`,
`children?: ReactNode`. Items render role `checkbox` with checked
state. All props optional except item `value`.
