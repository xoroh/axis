## Split Button

Source of truth: `SplitButtonProps` in `@xoroh/axis`.

Primary action + secondary trigger side by side: `onPress?`,
`onSecondaryPress?`, `disabled?` (shared),
`secondaryLabel?` (default `"More actions"`),
`accessibilityLabel?`, `testID?` (secondary is
`${testID}-secondary`), `style?` (primary), `secondaryStyle?`,
`children?` (primary label), `ref` (container). Two independent
press paths. All optional.
