## Checkbox

Unstyled binary selection control. A `Pressable` carrying the
checkbox role and state, with a box/checkmark `View` pair the caller
styles. The checkmark renders only when checked.

### Props

Source of truth: `CheckboxProps` in `@xoroh/axis`.

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `checked` | `boolean` | no | — | Controlled state. Wins over `defaultChecked` when defined. |
| `defaultChecked` | `boolean` | no | `false` | Uncontrolled initial state. |
| `onCheckedChange` | `(checked: boolean) => void` | no | — | Fires with the next state on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: no transitions, no callbacks; announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `accessibilityLabelledBy` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier; checkmark is `${testID}-checkmark` when set. |
| `style` | `StyleProp<ViewStyle>` | no | — | Root pressable style, caller-provided. |
| `boxStyle` | `StyleProp<ViewStyle>` | no | — | Box container style, caller-provided. |
| `checkmarkStyle` | `StyleProp<ViewStyle>` | no | — | Check indicator style, caller-provided. |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root host element. |

### Controlled example

```tsx
import { useState } from "react";
import { Checkbox } from "@xoroh/axis";

function Consent() {
  const [accepted, setAccepted] = useState(false);
  return (
    <Checkbox
      checked={accepted}
      onCheckedChange={setAccepted}
      accessibilityLabel="Accept the terms"
      boxStyle={{ borderWidth: accepted ? 0 : 1 }}
    />
  );
}
```

### Uncontrolled example

```tsx
import { Checkbox } from "@xoroh/axis";

function Consent() {
  return (
    <Checkbox
      defaultChecked
      onCheckedChange={(v) => console.log("accepted", v)}
      accessibilityLabel="Accept the terms"
    />
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
