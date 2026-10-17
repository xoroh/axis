## Text

Source of truth: `TextProps` in `@xoroh/axis`.

Readable text host: caller `children`, `accessibilityLabel?`,
`accessibilityRole?` (passthrough, e.g. `"header"` — no default
claim), `numberOfLines?`, `ellipsizeMode?`, `selectable?`,
`testID?`, `style?`, `ref`. Carries deliberately no typographic
scale: size, weight, and color are design-system decisions in
caller `style`. Example: `<Text
accessibilityLabel="Airplane mode, on">On</Text>`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
