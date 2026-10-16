## Time Picker

Source of truth: `TimePickerProps` in `@xoroh/axis`.

Time entry composed from Axis `Input` + `Button`, reusing the
`time` math (`normalizeTimeValue`, step grid, formatting):
`value?: {hours, minutes} | null`, `defaultValue?`,
`onValueChange?`, `step?: number` (minutes, default 1),
`disabled?`, `accessibilityLabel?`, `testID?`, `style?`, `ref`.
Steppers walk the step grid and clamp at its ends. All optional.
