## Avatar

Source of truth: `AvatarProps` in `@xoroh/axis`.

Identity image with fallback: `source` renders an `Image` with the
image role and label; absence or load error renders caller
`children` in a fallback `View`. Props: `source?:
ImageSourcePropType`, `children?`, `accessibilityLabel?`,
`testID?`, `style?` (image), `fallbackStyle?`, `ref?` (rendered host).

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
