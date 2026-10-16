## Toggle Group

Source of truth: `ToggleGroupProps`, `ToggleGroupItemProps` in `@xoroh/axis`.

Pressed-state set (CheckboxGroup with pressed semantics):
`ToggleGroup` (`value?: readonly string[]`, `defaultValue?`,
`onValueChange?`, `disabled?`, `accessibilityLabel?`, `testID?`,
`style?`, `children` required, `ref`) + `ToggleGroupItem`
(`value` required, `disabled?`, `accessibilityLabel?`, `testID?`,
`style?`, `children?`; button role + selected state). Toggle adds,
re-press removes. All optional except listed required.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
