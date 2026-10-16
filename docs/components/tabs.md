## Tabs

Source of truth: `TabsProps`, `TabsListProps`, `TabsPanelProps`, `TabsTriggerProps` in `@xoroh/axis`.

Unstyled tabbed interface: `Tabs` (value/defaultValue/onValueChange,
`children` required, ref to root), `TabsList` (role `tablist`),
`TabsTrigger` (`value` required; role `tab` with selected state; no
deselect), `TabsPanel` (`value` required; rendered only when
selected). Orientation and keyboard roving are explicitly deferred —
native press selection suffices for v1.
