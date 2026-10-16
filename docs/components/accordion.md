## Accordion

Source of truth: `AccordionProps`, `AccordionItemProps` in `@xoroh/axis`.

Unstyled single-expand disclosure (multi-mode deferred):
`Accordion` (`value`/`defaultValue`/`onValueChange` over `string |
null`, re-activating the open item collapses to `null`,
`disabled` blocks all) + `AccordionItem` (`value` required;
trigger `Pressable` with expanded state; panel mounted only when
open; `header` content with an empty-accessible-trigger fallback).
No animation — presence wiring deferred with rationale in-file.
