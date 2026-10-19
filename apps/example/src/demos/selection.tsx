import {
  CheckboxGroup,
  CheckboxGroupItem,
  CheckboxIndicator,
  CheckboxRoot,
  RadioGroup,
  RadioGroupItem,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Selection controls demo: binary, multi-select, single-select,
 * and pressed-state controls with clean caller styles.
 */
export const SelectionDemo: Demo = {
  slug: "selection",
  title: "Selection",
  components: [
    "CheckboxRoot",
    "CheckboxIndicator",
    "CheckboxGroup",
    "CheckboxGroupItem",
    "RadioGroup",
    "RadioGroupItem",
    "Toggle",
    "ToggleGroup",
    "ToggleGroupItem",
  ],
  render: function SelectionScreen() {
    const [checked, setChecked] = useState(true);
    const [pressed, setPressed] = useState(false);
    const { theme } = useTheme();

    return (
      <View style={{ gap: 20 }}>
        {/* Checkbox */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Checkbox:
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <CheckboxRoot
              accessibilityLabel="Demo standalone checkbox"
              checked={checked}
              onCheckedChange={setChecked}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: checked ? theme.primary : theme.border,
                backgroundColor: checked ? theme.primary : theme.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckboxIndicator
                style={{
                  backgroundColor: theme.primaryFg,
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                }}
              />
            </CheckboxRoot>
            <Text style={{ fontSize: 14, color: theme.text }}>
              {checked ? "Checked option" : "Unchecked option"}
            </Text>
          </View>
        </View>

        {/* Checkbox Group */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Checkbox Group:
          </Text>
          <CheckboxGroup
            accessibilityLabel="Demo checkbox group"
            style={{ gap: 10 }}
          >
            <CheckboxGroupItem
              value="a"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: theme.surfaceSubtle,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: theme.text }}
              >
                ☑ Option Alpha
              </Text>
            </CheckboxGroupItem>
            <CheckboxGroupItem
              value="b"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: theme.surfaceSubtle,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: theme.text }}
              >
                ☐ Option Beta
              </Text>
            </CheckboxGroupItem>
          </CheckboxGroup>
        </View>

        {/* Radio Group */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Radio Group:
          </Text>
          <RadioGroup
            accessibilityLabel="Demo radio group"
            style={{ flexDirection: "row", gap: 12 }}
          >
            <RadioGroupItem
              value="x"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: theme.text }}
              >
                ● Plan Standard
              </Text>
            </RadioGroupItem>
            <RadioGroupItem
              value="y"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.borderSubtle,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: theme.text }}
              >
                ○ Plan Pro
              </Text>
            </RadioGroupItem>
          </RadioGroup>
        </View>

        {/* Toggle & Toggle Group */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Toggle & Toggle Group:
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Toggle
              accessibilityLabel="Demo standalone toggle"
              pressed={pressed}
              onPressedChange={setPressed}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: pressed ? theme.primary : theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: pressed ? theme.primary : theme.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: pressed ? theme.primaryFg : theme.text,
                }}
              >
                {pressed ? "★ Starred" : "☆ Star"}
              </Text>
            </Toggle>

            <ToggleGroup
              accessibilityLabel="Demo toggle group"
              style={{
                flexDirection: "row",
                backgroundColor: theme.surfaceSubtle,
                borderRadius: 8,
                padding: 3,
                borderWidth: 1,
                borderColor: theme.borderSubtle,
              }}
            >
              <ToggleGroupItem
                value="m"
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: theme.surface,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.primary,
                  }}
                >
                  Monthly
                </Text>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="t"
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: theme.textSubtle,
                  }}
                >
                  Annual
                </Text>
              </ToggleGroupItem>
            </ToggleGroup>
          </View>
        </View>
      </View>
    );
  },
};
