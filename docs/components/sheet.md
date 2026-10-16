## Sheet

Source of truth: `SheetProps` in `@xoroh/axis`.

Bottom sheet with detents and drag: `open?`, `defaultOpen?`,
`onOpenChange?`, `onDismiss?`, `dismissable?` (default true —
scrim press, drag-down, and request-close all close; `false`
renders an inert scrim), `detents?` (fractions of measured
container height, default `[1]`; sorted, clamped, deduped),
`snapIndex?`, `defaultSnapIndex?`, `onSnapIndexChange?` (fires on
change), `title?`, `children?`, `accessibilityLabel?`,
`testID?` (surface; scrim takes `<testID>-scrim`), `overlayStyle?`,
`surfaceStyle?`, `titleStyle?`, `ref` (surface). The surface
follows the finger while dragged and settles to the nearest detent
on release; `expand`/`collapse` accessibility actions give
screen-reader users the same moves. No animation, no back-handler
beyond the Modal, no focus trap — each deferred with rationale in
the component header. Example: `<Sheet defaultOpen
detents={[0.5, 1]} title="Filters" />`.
