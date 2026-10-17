## Tabs

Source of truth: `TabsProps`, `TabsListProps`, `TabsPanelProps`, `TabsTriggerProps` in `@xoroh/axis`.

Unstyled tabbed interface: `Tabs` (value/defaultValue/onValueChange,
`children` required, ref to root), `TabsList` (role `tablist`),
`TabsTrigger` (`value` required; role `tab` with selected state; no
deselect), `TabsPanel` (`value` required; rendered only when
selected). Orientation and keyboard roving are explicitly deferred —
native press selection suffices for v1.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
