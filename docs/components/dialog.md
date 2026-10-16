## Dialog

Source of truth: `DialogProps` in `@xoroh/axis`.

Unstyled modal dialog. Renders `null` when closed; when open, a
transparent RN `Modal` with a scrim `Pressable` and a surface `View`
carrying the dialog role. Scrim press and `onRequestClose` dismiss
(iff `dismissable`, default `true` — set `false` for the AlertDialog
pattern with explicit actions). Hardware-back beyond
`onRequestClose`, animations, and focus trap are explicitly deferred
with rationale in-file.

`DialogProps`: `open?: boolean`, `defaultOpen?: boolean`,
`onOpenChange?: (open: boolean) => void`,
`onDismiss?: () => void`, `dismissable?: boolean` (default `true`),
`title?: ReactNode`, `children?: ReactNode` (content),
`actions?: ReactNode`, `accessibilityLabel?: string`,
`testID?: string` (scrim is `${testID}-scrim`),
`overlayStyle?`, `surfaceStyle?`, `titleStyle?` (all
caller-provided), `ref` (surface host). All optional.

Compound form (Base UI parity — same names, same state
semantics): `DialogRoot` (`open?`/`defaultOpen?`/`onOpenChange?`,
`disablePointerDismissal?`, `modal?`; renders no element) with
`DialogTrigger` (button role, expanded state), `DialogPortal` (RN
`Modal` host), `DialogBackdrop` (scrim; inert `View` when pointer
dismissal is disabled), `DialogPopup` (surface, dialog role),
`DialogTitle` (`header` role), `DialogDescription`, `DialogClose`.
Every part takes `render` (element or `(props, state)` function)
and value-or-function `style`; `data-*` attributes are
deliberately absent on native (state flows through those
functions — contract §11). Omitted Base pieces (`Viewport`,
`initialFocus`/`finalFocus`, nested coordination, `createHandle`,
`Portal` container/keepMounted) are documented deviations in
`docs/BASE_UI_PARITY.md`. Example:

```tsx
<DialogRoot>
  <DialogTrigger><Text>Open</Text></DialogTrigger>
  <DialogPortal>
    <DialogBackdrop />
    <DialogPopup>
      <DialogTitle>Example</DialogTitle>
      <DialogDescription>Details</DialogDescription>
      <DialogClose><Text>Close</Text></DialogClose>
    </DialogPopup>
  </DialogPortal>
</DialogRoot>
```
