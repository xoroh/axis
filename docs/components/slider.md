## Slider

Source of truth: `SliderProps` in `@xoroh/axis`.

Drag value control (PanResponder, no Reanimated/Gesture Handler):
`value?`, `defaultValue?` (default `min`), `onValueChange?`,
`min?` (default 0), `max?` (default 100), `step?: number`
(default 0 = continuous, >0 snaps), `disabled?`,
`accessibilityLabel?`, `testID?`, `style?`, `trackStyle?`,
`fillStyle?`, `thumbStyle?`, `ref` (track). Role `slider` with
`{min, max, now}` value plus `increment`/`decrement` actions.
Degenerate `min > max` collapses safely. All optional.

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
