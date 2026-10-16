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

Compound form (Base UI parity — same names, same state
semantics): `PopoverRoot` (`open?`/`defaultOpen?`/`onOpenChange?`/
`onDismiss?`/`disablePointerDismissal?`/`modal?` (default `false`
— popovers are non-modal; `true` uses a `Modal` host with scrim);
renders no element) with `PopoverTrigger` (tap toggle, button
role, expanded state, anchor-registering), `PopoverPortal` (Modal
host when modal, in-box otherwise), `PopoverBackdrop` (scrim,
modal only), `PopoverPositioner` (`side?`/`align?`/`sideOffset?`/
`alignOffset?`, measured against the trigger), `PopoverPopup`
(content region, no role by design), `PopoverTitle` (`header`
role), `PopoverDescription`, `PopoverClose`,
`PopoverArrow` (caller-positioned marker).
Every part takes `render` (element or `(props, state)` function)
and value-or-function `style`; `data-*` attributes are
deliberately absent on native (contract §11). Example:

```tsx
<PopoverRoot>
  <PopoverTrigger><Text>Open</Text></PopoverTrigger>
  <PopoverPortal>
    <PopoverPositioner side="bottom" align="start">
      <PopoverPopup accessibilityLabel="Example">
        <PopoverTitle>Example</PopoverTitle>
        <PopoverClose><Text>Close</Text></PopoverClose>
      </PopoverPopup>
    </PopoverPositioner>
  </PopoverPortal>
</PopoverRoot>
```
