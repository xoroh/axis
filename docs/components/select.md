## Select

Source of truth: `SelectProps`, `SelectItemProps` in `@xoroh/axis`.

Single-select dropdown: `value?: string | null`,
`defaultValue?`, `onValueChange?`, `open?`, `defaultOpen?`,
`onOpenChange?`, `placeholder?` (ReactNode, shown when empty),
`disabled?`, `accessibilityLabel?`, `testID?`, `style?` (trigger),
`listStyle?`, `children` (SelectItems, required), `ref`.
Trigger shows current label or placeholder with expanded state;
list positioned with floating placement + scrim dismiss; option
press selects + closes (re-press keeps, no extra fire). No
filtering (that's Combobox), no multi. All optional except
`children`.

`SelectItemProps`: `value: string` (required), `disabled?`,
`accessibilityLabel?`, `testID?`, `style?`, `children?`; role
`option` with selected state where supported, else button with
selected state (verified per platform types, documented in-file).

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
