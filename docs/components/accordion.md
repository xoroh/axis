## Accordion

Source of truth: `AccordionProps`, `AccordionItemProps` in `@xoroh/axis`.

Unstyled single-expand disclosure (multi-mode deferred):
`Accordion` (`value`/`defaultValue`/`onValueChange` over `string |
null`, re-activating the open item collapses to `null`,
`disabled` blocks all) + `AccordionItem` (`value` required;
trigger `Pressable` with expanded state; panel mounted only when
open; `header` content with an empty-accessible-trigger fallback).
No animation — presence wiring deferred with rationale in-file.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
