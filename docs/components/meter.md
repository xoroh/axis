## Meter

Source of truth: `MeterProps` in `@xoroh/axis`.

Gauge readout (task progress lives in `Progress`): `value?`
(default 0), `min?` (default 0), `max?` (default 100),
`accessibilityLabel?`, `testID?`, `style?`, `fillStyle?`
(data-driven width merged underneath). Meter role with
`{min, max, now}` value, `ref?` (container). All optional.
