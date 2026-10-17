## Collapsible

Source of truth: `CollapsibleProps`, `CollapsibleTriggerProps`, `CollapsiblePanelProps` in `@xoroh/axis`.

Single disclosure unit: `Collapsible` (`open`/`defaultOpen`/
`onOpenChange`, `disabled`, `testID?`, `style?`, `children`,
`ref` to root) + `CollapsibleTrigger` (Pressable with expanded
state) + `CollapsiblePanel` (mounted only when open). No animation
(deferred with rationale in-file). All props optional except
`children` where noted.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
