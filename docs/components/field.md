## Field

Source of truth: `FieldProps` in `@xoroh/axis`.

Label/control/error row: `label?`, `children?` (control),
`error?` (rendered only when provided, announced politely),
`testID?`, `style?`, `labelStyle?`, `errorStyle?`, `ref?` (container). No validation
logic — validity is caller state expressed by passing `error`.
