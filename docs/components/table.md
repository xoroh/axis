## Table

Source of truth: `TableProps`, `TableHeaderProps`, `TableRowProps`, `TableCellProps` in `@xoroh/axis`.

Tabular structure: `Table` (container + `ref`) with `TableHeader`,
`TableRow` (`header?` maps to the header role), and `TableCell`
parts. Plain `View`s — no table/row/cell roles exist in the native
role set, so none are claimed. No sorting, pagination, or selection.
`testID?`/`style?` throughout. All optional.
