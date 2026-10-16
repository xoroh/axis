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
