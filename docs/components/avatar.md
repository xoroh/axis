## Avatar

Source of truth: `AvatarProps` in `@xoroh/axis`.

Identity image with fallback: `source` renders an `Image` with the
image role and label; absence or load error renders caller
`children` in a fallback `View`. Props: `source?:
ImageSourcePropType`, `children?`, `accessibilityLabel?`,
`testID?`, `style?` (image), `fallbackStyle?`, `ref?` (rendered host).
