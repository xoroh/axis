## Tooltip

Source of truth: `TooltipProps` in `@xoroh/axis`.

Anchored hint on long-press: `content` (required), `children`
(anchor, required), `open?`, `defaultOpen?` (default `false`),
`onOpenChange?`, `placement?` (default `"top"`, clamped into the
viewport), `accessibilityLabel?`, `testID?`, `style?` (anchor),
`tipStyle?`, `ref` (anchor wrapper). The tip carries the tooltip
role; it is measured and placed with the shared floating-placement
plumbing (anchor `measure()` + viewport + rect math) and stays
transparent until measured. Pixel placement needs the native
runtime — covered by placement-math unit tests, not asserted in
jsdom-free RNTL. No hover model, no scrim. All props optional
except `content`/`children`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
