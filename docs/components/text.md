## Text

Source of truth: `TextProps` in `@xoroh/axis`.

Readable text host: caller `children`, `accessibilityLabel?`,
`accessibilityRole?` (passthrough, e.g. `"header"` — no default
claim), `numberOfLines?`, `ellipsizeMode?`, `selectable?`,
`testID?`, `style?`, `ref`. Carries deliberately no typographic
scale: size, weight, and color are design-system decisions in
caller `style`. Example: `<Text
accessibilityLabel="Airplane mode, on">On</Text>`.
