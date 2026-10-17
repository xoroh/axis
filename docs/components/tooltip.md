## Tooltip

Source of truth: `TooltipProps`, `TooltipProviderProps`, `TooltipRootProps`, `TooltipTriggerProps`, `TooltipPortalProps`, `TooltipPositionerProps`, `TooltipPopupProps`, `TooltipArrowProps` in `@xoroh/axis`.

Anchored hint on long-press: `content` (required), `children`
(anchor, required), `open?`, `defaultOpen?` (default `false`),
`onOpenChange?`, `placement?` (default `"top"`, clamped into the
viewport), `accessibilityLabel?`, `delayLongPress?` (host timing,
platform default when absent), `testID?`, `style?` (anchor),
`tipStyle?`, `ref` (anchor wrapper). The tip carries the tooltip
role; it is measured and placed with the shared floating-placement
plumbing (anchor `measure()` + viewport + rect math) and stays
transparent until measured. Pixel placement needs the native
runtime — covered by placement-math unit tests, not asserted in
jsdom-free RNTL. No hover model, no scrim. All props optional
except `content`/`children`.

Compound form (Base UI parity — same names, same state
semantics): `TooltipProvider` (`delay?`/`closeDelay?` in ms,
default `0` — one timing for a group of tips; delays run from
the long-press commit since hover has no touch equivalent;
renders no element) with `TooltipRoot` (`open?`/`defaultOpen?`/
`onOpenChange?`, `disabled?` (terminal — forces hidden); renders
no element), `TooltipTrigger` (long-press toggle,
anchor-registering, `delayLongPress?`), `TooltipPortal` (in-box
host — a non-modal hint never takes a `Modal` host; when the
shared overlay root lands, tips can host there with positioning
kept separable), `TooltipPositioner` (`side?` (default `"top"`)/
`align?`/`sideOffset?`/`alignOffset?`, measured against the
trigger), `TooltipPopup` (tooltip role), `TooltipArrow`
(caller-positioned marker). A pending show cancels when a dismiss
lands first (no ghost tips). Every part takes `render` (element
or `(props, state)` function) and value-or-function `style`;
`data-*` attributes are deliberately absent on native (contract
§11). No `Modal` host, no hover, no Backdrop (dismissal is a
second long-press — there is no scrim). Example:

```tsx
<TooltipProvider delay={100}>
  <TooltipRoot>
    <TooltipTrigger accessibilityLabel="More info">
      <Text>Info</Text>
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipPositioner side="top">
        <TooltipPopup accessibilityLabel="Details">
          <Text>Details here</Text>
        </TooltipPopup>
      </TooltipPositioner>
    </TooltipPortal>
  </TooltipRoot>
</TooltipProvider>
```

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
