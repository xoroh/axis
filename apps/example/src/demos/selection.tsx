import {
  Checkbox,
  CheckboxGroup,
  CheckboxGroupItem,
  RadioGroup,
  RadioGroupItem,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Selection controls demo: binary, multi-select, single-select,
 * and pressed-state controls with plain caller styles.
 */
export const SelectionDemo: Demo = {
  slug: "selection",
  title: "Selection",
  components: [
    "Checkbox",
    "CheckboxGroup",
    "CheckboxGroupItem",
    "RadioGroup",
    "RadioGroupItem",
    "Toggle",
    "ToggleGroup",
    "ToggleGroupItem",
  ],
  render: function SelectionScreen() {
    const [checked, setChecked] = useState(false);
    const [pressed, setPressed] = useState(false);
    return (
      <View style={{ gap: 16 }}>
        <Checkbox
          accessibilityLabel="Demo checkbox"
          checked={checked}
          onCheckedChange={setChecked}
        />
        <CheckboxGroup accessibilityLabel="Demo checkbox group">
          <CheckboxGroupItem value="a">
            <Text>A</Text>
          </CheckboxGroupItem>
          <CheckboxGroupItem value="b">
            <Text>B</Text>
          </CheckboxGroupItem>
        </CheckboxGroup>
        <RadioGroup accessibilityLabel="Demo radio group">
          <RadioGroupItem value="x">
            <Text>X</Text>
          </RadioGroupItem>
          <RadioGroupItem value="y">
            <Text>Y</Text>
          </RadioGroupItem>
        </RadioGroup>
        <Toggle
          accessibilityLabel="Demo toggle"
          pressed={pressed}
          onPressedChange={setPressed}
        >
          <Text>Toggle</Text>
        </Toggle>
        <ToggleGroup accessibilityLabel="Demo toggle group">
          <ToggleGroupItem value="m">
            <Text>M</Text>
          </ToggleGroupItem>
          <ToggleGroupItem value="t">
            <Text>T</Text>
          </ToggleGroupItem>
        </ToggleGroup>
      </View>
    );
  },
};
