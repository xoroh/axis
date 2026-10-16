## Time Picker

Source of truth: `TimePickerProps` in `@xoroh/axis`.

Time entry composed from Axis `Input` + `Button`, reusing the
`time` math (`normalizeTimeValue`, step grid, formatting):
`value?: {hours, minutes} | null`, `defaultValue?`,
`onValueChange?`, `step?: number` (minutes, default 1),
`disabled?`, `accessibilityLabel?`, `testID?`, `style?`, `ref`.
Steppers walk the step grid and clamp at its ends. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
