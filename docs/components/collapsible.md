## Collapsible

Source of truth: `CollapsibleProps`, `CollapsibleTriggerProps`, `CollapsiblePanelProps` in `@xoroh/axis`.

Single disclosure unit: `Collapsible` (`open`/`defaultOpen`/
`onOpenChange`, `disabled`, `testID?`, `style?`, `children`,
`ref` to root) + `CollapsibleTrigger` (Pressable with expanded
state) + `CollapsiblePanel` (mounted only when open). No animation
(deferred with rationale in-file). All props optional except
`children` where noted.
