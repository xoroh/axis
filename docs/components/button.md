## Button

Source of truth: `ButtonProps` in `@xoroh/axis`.

Unstyled pressable action. Caller content, caller visuals.

### Props

`onPress?: () => void` (suppressed while `disabled` or `loading`),
`disabled?: boolean`, `loading?: boolean` (suppresses `onPress`,
announced as busy; caller swaps `children` — nothing renders here),
`accessibilityLabel?: string`,
`accessibilityLabelledBy?: string`, `testID?: string`,
`style?: StateStyle<ButtonState, StyleProp<ViewStyle>>` (value or
function of `{ disabled, loading }`), `children?: ReactNode`,
`render?: RenderProp<ButtonState, SlotProps>` (element or
`(props, state)` substitution — Base UI `render` parity, covering the
icon/loading/link press cases with no separate components),
`ref`. All optional.

### Example

```tsx
import { Text } from "react-native";
import { Button } from "@xoroh/axis";

function Save({ onSave }: { onSave: () => void }) {
  return (
    <Button onPress={onSave} accessibilityLabel="Save">
      <Text>Save</Text>
    </Button>
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
