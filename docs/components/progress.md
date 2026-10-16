## Progress

Source of truth: `ProgressProps` in `@xoroh/axis`.

Determinate/indeterminate indicator: `value` (default 0), `min`
(default 0), `max` (default 100), `indeterminate` (announces busy,
no value), role `progressbar` with `{min, max, now}` value,
`accessibilityLabel`, `ref?` (container). Values clamp; fill width is data-driven under
caller `barStyle`. Example: `<Progress value={42}
accessibilityLabel="Loading" />`.
