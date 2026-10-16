## Table

Source of truth: `TableProps`, `TableHeaderProps`, `TableRowProps`, `TableCellProps` in `@xoroh/axis`.

Tabular structure: `Table` (container + `ref`) with `TableHeader`,
`TableRow` (`header?` maps to the header role), and `TableCell`
parts. Plain `View`s — no table/row/cell roles exist in the native
role set, so none are claimed. No sorting, pagination, or selection.
`testID?`/`style?` throughout. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
