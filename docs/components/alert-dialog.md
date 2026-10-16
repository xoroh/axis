## Alert Dialog

Source of truth: `AlertDialogProps` in `@xoroh/axis`.

Blocking confirm: thin wrapper forcing `dismissable={false}` over
`Dialog`. `open?`, `defaultOpen?`, `onOpenChange?`, `title?`,
`children?`, `actions` (required — a blocking dialog without an
explicit action traps the user), `accessibilityLabel?`,
`testID?`, `style?` (surface), `ref` (surface). No `onDismiss`
(no scrim path exists). All optional except `actions`.
