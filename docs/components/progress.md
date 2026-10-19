## Progress

Source of truth: `ProgressRootProps`, `ProgressTrackProps`,
`ProgressIndicatorProps`, `ProgressLabelProps`,
`ProgressValueProps` in `@xoroh/axis`.

Determinate/indeterminate indicator: `value` (default 0; `null`
is indeterminate — announces busy, no value — Base UI exact
semantics), `min` (default 0), `max` (default 100), role
`progressbar` with `{min, max, now}` value, `accessibilityLabel`,
`ref?` (container). Values clamp; the fill width is data-driven —
computed by `ProgressIndicator` from root state. Example: `<ProgressRoot value={42}
accessibilityLabel="Loading" />`.

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `ProgressRoot` | `Progress.Root` | State owner (`value`/`min`/`max`); progressbar role; renders only caller children — no built-in bar. |
| `ProgressTrack` | `Progress.Track` | Container for the indicator; style value-or-function over `{ value, indeterminate }`; renders nothing outside a root. |
| `ProgressIndicator` | `Progress.Indicator` | Fill bar; width computed from root state (clamped into `[min, max]`, `0%` while indeterminate); renders nothing outside a root. |
| `ProgressLabel` | `Progress.Label` | Static label text; renders anywhere. |
| `ProgressValue` | `Progress.Value` | Current value as text (caller `children` override); renders nothing while indeterminate and nothing outside a root. |

### Examples

Compound track and indicator with label and value:

```tsx
import {
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot,
  ProgressTrack,
  ProgressValue,
} from "@xoroh/axis";

function Download() {
  return (
    <ProgressRoot value={65} accessibilityLabel="Download">
      <ProgressLabel>Download</ProgressLabel>
      <ProgressValue />
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressRoot>
  );
}
```

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
