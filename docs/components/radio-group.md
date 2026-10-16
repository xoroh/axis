## Radio Group

Source of truth: `RadioGroupProps`, `RadioGroupItemProps` in `@xoroh/axis`.

Unstyled single-selection group. A `View` carrying the radiogroup
role with `RadioGroupItem` pressables (radio role + checked state).
Selecting an item replaces the selection; re-activating the selected
item keeps it (never deselects to null).

### Props

`RadioGroupProps`: `value?: string | null`, `defaultValue?: string
| null` (default `null`), `onValueChange?: (value: string) => void`,
`disabled?: boolean` (disables every item), `accessibilityLabel?:
string`, `testID?: string`, `style?: StyleProp<ViewStyle>`,
`children: ReactNode` (the items, required), `ref` (group root).

`RadioGroupItemProps`: `value: string` (required),
`disabled?: boolean`, `accessibilityLabel?: string`,
`testID?: string`, `style?: StyleProp<ViewStyle>`,
`children?: ReactNode`. All props optional except `value`.

### Example

```tsx
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@xoroh/axis";

function SizePicker() {
  const [size, setSize] = useState<string | null>(null);
  return (
    <RadioGroup
      value={size}
      onValueChange={setSize}
      accessibilityLabel="Size"
    >
      <RadioGroupItem value="s" accessibilityLabel="Small" />
      <RadioGroupItem value="m" accessibilityLabel="Medium" />
    </RadioGroup>
  );
}
```
