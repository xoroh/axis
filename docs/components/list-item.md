## List Item

Source of truth: `ListItemProps` in `@xoroh/axis`.

Row with `leading?`/`children`/`trailing?` slots. With `onPress`
it is a pressable row (button role, selected/disabled state);
without, a static `View` (no fake affordance).
`onPress?`, `selected?` (default `false`), `disabled?` (default
`false`), `accessibilityLabel?`, `testID?`, `style?`,
`contentStyle?` (string-children text), `ref?` (rendered host). All optional.
