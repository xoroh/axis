## Toggle Group

Source of truth: `ToggleGroupProps`, `ToggleGroupItemProps` in `@xoroh/axis`.

Pressed-state set (CheckboxGroup with pressed semantics):
`ToggleGroup` (`value?: readonly string[]`, `defaultValue?`,
`onValueChange?`, `disabled?`, `accessibilityLabel?`, `testID?`,
`style?`, `children` required, `ref`) + `ToggleGroupItem`
(`value` required, `disabled?`, `accessibilityLabel?`, `testID?`,
`style?`, `children?`; button role + selected state). Toggle adds,
re-press removes. All optional except listed required.
