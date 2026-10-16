## Autocomplete

Source of truth: `AutocompleteProps` in `@xoroh/axis`.

Filter-as-type where the text IS the value: `options:
ReadonlyArray<string>` (required), `value?`, `defaultValue?`,
`onValueChange?` (text), `onCommit?` (option press or submit),
`open?`, `defaultOpen?`, `onOpenChange?`, `placeholder?`,
`disabled?`, `accessibilityLabel?`, `testID?`, `style?`,
`listStyle?`, `inputStyle?`, `ref`. Options are commit actions
(button role), not a selection set — no selected state is promised.
Empty query closes the list. All optional except `options`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
