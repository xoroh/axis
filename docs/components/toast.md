## Toast

Source of truth: `ToastProps` in `@xoroh/axis`.

Transient notification with timed auto-dismiss. Renders `null` when
closed; open content announces via a polite live region.
`ToastProps`: `open?`, `defaultOpen?`,
`onOpenChange?`, `duration?: number` (ms, default 4000; `<= 0`
disables the timer), `children?` (message),
`actionLabel?: string` + `onAction?: () => void` (button rendered
only with a label; fires then dismisses), `accessibilityLabel?`,
`testID?`, `style?`, `ref?` (surface). No animation. All optional.
