## Calendar

Source of truth: `CalendarProps` in `@xoroh/axis`.

Date grid (plain UTC `Date` math, no date library; Sunday-start
weeks): `value?: string | null` (ISO `yyyy-mm-dd`),
`defaultValue?`, `onValueChange?`, `month?: string` (`yyyy-mm`,
controlled visible month), `onMonthChange?`, `minDate?`,
`maxDate?` (out-of-range days disabled), `disabled?`,
`accessibilityLabel?`, `testID?`, `style?`, `dayStyle?`, `ref`.
Day cells carry button role + selected/disabled state; header has
previous/next-month actions. Invalid strings never throw. All
optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
