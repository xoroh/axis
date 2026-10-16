## Button

Source of truth: `ButtonProps` in `@xoroh/axis`.

Unstyled pressable action. Caller content, caller visuals.

### Props

`onPress?: () => void` (suppressed while `disabled` or `loading`),
`disabled?: boolean`, `loading?: boolean` (suppresses `onPress`,
announced as busy; caller swaps `children` — nothing renders here),
`accessibilityLabel?: string`,
`accessibilityLabelledBy?: string`, `testID?: string`,
`style?: StyleProp<ViewStyle>`, `children?: ReactNode`, `ref`.
All optional.

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
