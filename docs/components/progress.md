## Progress

Source of truth: `ProgressProps` in `@xoroh/axis`.

Determinate/indeterminate indicator: `value` (default 0), `min`
(default 0), `max` (default 100), `indeterminate` (announces busy,
no value), role `progressbar` with `{min, max, now}` value,
`accessibilityLabel`, `ref?` (container). Values clamp; fill width is data-driven under
caller `barStyle`. Example: `<Progress value={42}
accessibilityLabel="Loading" />`.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
