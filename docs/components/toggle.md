## Toggle

Source of truth: `ToggleProps` in `@xoroh/axis`.

Unstyled pressed-state button (not a switch): a `Pressable` with the
button role and selected state, rendering caller label content.

### Props

`pressed?: boolean`, `defaultPressed?: boolean` (default `false`),
`onPressedChange?: (pressed: boolean) => void`,
`disabled?: boolean` (terminal), `accessibilityLabel?: string`,
`accessibilityLabelledBy?: string`, `testID?: string`,
`style?: StyleProp<ViewStyle>`, `children?: ReactNode`,
`ref` (root host element). All optional.

### Example

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Toggle } from "@xoroh/axis";

function Bold() {
  const [on, setOn] = useState(false);
  return (
    <Toggle pressed={on} onPressedChange={setOn} accessibilityLabel="Bold">
      <Text>B</Text>
    </Toggle>
  );
}
```
