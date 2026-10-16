## Popover

Source of truth: `PopoverProps` in `@xoroh/axis`.

Non-modal anchored overlay: `children` (anchor, required),
`content` (body, required), `open?`, `defaultOpen?`,
`onOpenChange?`, `onDismiss?`, `placement?`,
`accessibilityLabel?` (announced on the region),
`testID?`, `style?` (anchor), `popoverStyle?`, `ref` (anchor).
Tap toggles; scrim dismisses (siblings, so box taps never dismiss);
measured placement, transparent until measured. No role claim —
React Native defines no popover role. No animation, arrow, hover,
or focus trap (each deferred with rationale in-file). All optional
except `children`/`content`.
