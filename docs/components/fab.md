## Fab

Source of truth: `FabProps` in `@xoroh/axis`.

Floating action button: icon-only pressable with the button role
and disabled/busy states. `onPress?`, `disabled?`, `loading?`
(announces busy), `size?` (square dp box; caller `style` wins),
`accessibilityLabel?` (required in practice — icon-only),
`testID?`, `style?`, `children?` (icon), `ref`. Shape, size
system, elevation, and color are caller decisions in `style`.
Example: `<Fab accessibilityLabel="Create" size={56}
onPress={create} />`.
