## Switch

Unstyled on/off control. Structure only — a `Pressable` carrying the
switch role and state, with a track/thumb `View` pair the caller
styles. No default visuals.

### Props

Source of truth: `SwitchProps` in `@xoroh/axis` (re-exported from the
public entry).

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `checked` | `boolean` | no | — | Controlled state. Wins over `defaultChecked` when defined. |
| `defaultChecked` | `boolean` | no | `false` | Uncontrolled initial state. |
| `onCheckedChange` | `(checked: boolean) => void` | no | — | Fires with the next state on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: no transitions, no callbacks; announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `accessibilityLabelledBy` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host element. |
| `style` | `StyleProp<ViewStyle>` | no | — | Root pressable style, caller-provided. |
| `trackStyle` | `StyleProp<ViewStyle>` | no | — | Track container style, caller-provided. |
| `thumbStyle` | `StyleProp<ViewStyle>` | no | — | Thumb indicator style, caller-provided. |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root host element (inline documented composition). |

### Controlled example

```tsx
import { useState } from "react";
import { Switch } from "@xoroh/axis";

function Setting() {
  const [enabled, setEnabled] = useState(false);
  return (
    <Switch
      checked={enabled}
      onCheckedChange={setEnabled}
      accessibilityLabel="Airplane mode"
      trackStyle={{ backgroundColor: enabled ? "green" : "gray" }}
    />
  );
}
```

### Uncontrolled example

```tsx
import { Switch } from "@xoroh/axis";

function Setting() {
  return (
    <Switch
      defaultChecked
      onCheckedChange={(v) => console.log("now", v)}
      accessibilityLabel="Airplane mode"
    />
  );
}
```

Accessibility: `accessibilityRole="switch"` with
`accessibilityState { checked, disabled }`. Name the control with
`accessibilityLabel` (or `accessibilityLabelledBy` where supported).
