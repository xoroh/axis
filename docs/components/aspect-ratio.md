## Aspect Ratio

Source of truth: `AspectRatioProps` in `@xoroh/axis`.

Ratio box: `ratio?: number` (default 1; non-finite and non-positive
clamp to 1, never throw), `testID?`, `style?`, `children?`,
`ref`. Merges `{aspectRatio}` under caller style. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
