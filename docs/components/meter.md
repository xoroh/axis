## Meter

Source of truth: `MeterProps` in `@xoroh/axis`.

Gauge readout (task progress lives in `Progress`): `value?`
(default 0), `min?` (default 0), `max?` (default 100),
`accessibilityLabel?`, `testID?`, `style?`, `fillStyle?`
(data-driven width merged underneath). Meter role with
`{min, max, now}` value, `ref?` (container). All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
