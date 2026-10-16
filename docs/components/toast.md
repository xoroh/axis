## Toast

Source of truth: `ToastProps` in `@xoroh/axis`.

Transient notification with timed auto-dismiss. Renders `null` when
closed; open content announces via a polite live region.
`ToastProps`: `open?`, `defaultOpen?`,
`onOpenChange?`, `duration?: number` (ms, default 4000; `<= 0`
disables the timer), `children?` (message),
`actionLabel?: string` + `onAction?: () => void` (button rendered
only with a label; fires then dismisses), `accessibilityLabel?`,
`testID?`, `style?: StateStyle<ToastState, ...>` (value or function
of `{ open }`), `render?: RenderProp<ToastState, SlotProps>`,
`ref?` (surface). No animation. All optional.

Queued toasts (Base UI Provider + Viewport parity): `ToastProvider`
owns the queue (renders no element); `useToast()` returns the
`toast.add()` manager (`add(options): id`, `dismiss(id)`, `clear()`);
`ToastViewport` paints one single-shot `Toast` per queued id with an
optional `limit` (oldest-first). Each queued `Toast` is the `Root`;
`children` composes the title/description text, `actionLabel` /
`onAction` is the action, timed auto-dismiss is the close. M3
Snackbar stays separate in Kern — never conflate the two.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
