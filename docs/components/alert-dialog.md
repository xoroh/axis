## Alert Dialog

Source of truth: `AlertDialogProps` in `@xoroh/axis`.

Blocking confirm: thin wrapper forcing `dismissable={false}` over
`Dialog`. `open?`, `defaultOpen?`, `onOpenChange?`, `title?`,
`children?`, `actions` (required — a blocking dialog without an
explicit action traps the user), `accessibilityLabel?`,
`testID?`, `style?` (surface), `ref` (surface). No `onDismiss`
(no scrim path exists). All optional except `actions`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
