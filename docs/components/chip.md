## Chip

Source of truth: `ChipProps` in `@xoroh/axis`.

Compact select/remove control: outer `View` with sibling main and
remove `Pressable`s. `selected?`, `defaultSelected?`,
`onSelectedChange?`, `onPress?` (tap action, fires after the
internal toggle), `onRemove?` (remove path only, never toggles),
`disabled?` (blocks all three), `accessibilityLabel?`, `testID?`,
`style?`, `removeStyle?`, `children?`, `ref`. Main carries button
role + selected state. All optional.
