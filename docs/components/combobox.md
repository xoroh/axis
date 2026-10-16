## Combobox

Source of truth: `ComboboxProps` in `@xoroh/axis`.

Filterable single-select: `options: ReadonlyArray<{value, label,
disabled?}>` (required), `value?: string | null`,
`defaultValue?`, `onValueChange?`, `open?`, `defaultOpen?`,
`onOpenChange?`, `placeholder?`, `disabled?`,
`accessibilityLabel?`, `testID?` (entry; toggle is
`${testID}-toggle`, scrim `${testID}-scrim`, options
`${testID}-option-{value}`), `style?` (entry), `listStyle?`,
`inputStyle?`, `ref` (root). Entry is an Axis `Input`; a chevron
toggle opens the list (the Axis Input exposes no focus API by
design) and typing filters case-insensitively, auto-opening.
Option press selects + sets query + closes. Empty filter renders
an empty listbox, no chrome. All optional except `options`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
