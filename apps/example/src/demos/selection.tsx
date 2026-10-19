import {
  CheckboxGroup,
  CheckboxGroupItem,
  CheckboxIndicator,
  CheckboxRoot,
  RadioGroup,
  RadioIndicator,
  RadioRoot,
  Toggle,
  ToggleGroup,
} from "@xoroh/axis";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
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
    "RadioIndicator",
    "RadioRoot",
    "Toggle",
    "ToggleGroup",
  ],
  render: function SelectionScreen() {
    const [checked, setChecked] = useState(true);
    const [pressed, setPressed] = useState(false);
    const [allChecked, setAllChecked] = useState(false);
    const [mixed, setMixed] = useState(true);
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 12,
            }}
          >
            <CheckboxRoot
              accessibilityLabel="Demo select-all checkbox"
              checked={allChecked}
              onCheckedChange={(next) => {
                setAllChecked(next);
                setMixed(false);
              }}
              indeterminate={mixed}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: theme.border,
                backgroundColor: theme.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckboxIndicator>
                <Text style={{ fontSize: 12, color: theme.text }}>
                  {mixed ? "–" : "✓"}
                </Text>
              </CheckboxIndicator>
            </CheckboxRoot>
            <Text style={{ fontSize: 14, color: theme.text }}>
              Select all (mixed)
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 12,
            }}
          >
            <CheckboxRoot accessibilityLabel="Demo locked checkbox" readOnly>
              <CheckboxIndicator
                keepMounted
                testID="demo-locked-mark"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: theme.border,
                  backgroundColor: "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </CheckboxRoot>
            <Text style={{ fontSize: 14, color: theme.text }}>
              Locked (read-only, kept)
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
            defaultValue={["a"]}
            style={{ gap: 10 }}
          >
            {(
              [
                ["a", "Option Alpha"],
                ["b", "Option Beta"],
              ] as Array<[string, string]>
            ).map(([itemValue, label]) => (
              <CheckboxGroupItem
                key={itemValue}
                value={itemValue}
                render={(props, state) => {
                  const onPress =
                    typeof props.onPress === "function"
                      ? (props.onPress as () => void)
                      : undefined;
                  return (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{
                        checked: state.checked,
                        disabled: state.disabled,
                      }}
                      accessibilityLabel={label}
                      testID={`demo-opt-${itemValue}`}
                      disabled={state.disabled}
                      onPress={onPress}
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
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          borderWidth: 1.5,
                          borderColor: state.checked
                            ? theme.primary
                            : theme.border,
                          backgroundColor: state.checked
                            ? theme.primary
                            : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {state.checked ? (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              backgroundColor: theme.primaryFg,
                            }}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: theme.text,
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            ))}
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
            defaultValue="x"
            style={{ flexDirection: "row", gap: 12 }}
          >
            {(
              [
                ["x", "Plan Standard"],
                ["y", "Plan Pro"],
              ] as Array<[string, string]>
            ).map(([itemValue, label]) => (
              <RadioRoot
                key={itemValue}
                value={itemValue}
                render={(props, state) => {
                  const onPress =
                    typeof props.onPress === "function"
                      ? (props.onPress as () => void)
                      : undefined;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: state.checked,
                        disabled: state.disabled,
                      }}
                      accessibilityLabel={label}
                      testID={`demo-plan-${itemValue}`}
                      disabled={state.disabled}
                      onPress={onPress}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 8,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: state.checked
                          ? theme.primary
                          : theme.borderSubtle,
                      }}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          borderColor: state.checked
                            ? theme.primary
                            : theme.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {state.checked ? (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: theme.primary,
                            }}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: theme.text,
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            ))}
          </RadioGroup>
          <Text
            style={{
              fontSize: 13,
              color: theme.textSubtle,
              marginTop: 12,
            }}
          >
            Frozen (read-only — presses change nothing):
          </Text>
          <RadioGroup
            accessibilityLabel="Demo frozen radio group"
            defaultValue="x"
            readOnly
            style={{ flexDirection: "row", gap: 12 }}
          >
            <RadioRoot value="x" testID="demo-frozen-x">
              <RadioIndicator
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: theme.primary,
                }}
              />
              <Text style={{ fontSize: 13, color: theme.text }}>Std</Text>
            </RadioRoot>
            <RadioRoot value="y" testID="demo-frozen-y">
              <RadioIndicator
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: theme.primary,
                }}
              />
              <Text style={{ fontSize: 13, color: theme.text }}>Pro</Text>
            </RadioRoot>
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
              defaultValue={["m"]}
              style={{
                flexDirection: "row",
                backgroundColor: theme.surfaceSubtle,
                borderRadius: 8,
                padding: 3,
                borderWidth: 1,
                borderColor: theme.borderSubtle,
              }}
            >
              <Toggle
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
              </Toggle>
              <Toggle
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
              </Toggle>
            </ToggleGroup>
            <ToggleGroup
              accessibilityLabel="Demo multiple toggle group"
              multiple
              defaultValue={["bold"]}
              style={{
                flexDirection: "row",
                backgroundColor: theme.surfaceSubtle,
                borderRadius: 8,
                padding: 3,
                borderWidth: 1,
                borderColor: theme.borderSubtle,
              }}
            >
              {(
                [
                  ["bold", "B"],
                  ["italic", "I"],
                  ["underline", "U"],
                ] as Array<[string, string]>
              ).map(([itemValue, label]) => (
                <Toggle
                  key={itemValue}
                  value={itemValue}
                  style={(state) => ({
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: state.pressed
                      ? theme.surface
                      : "transparent",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.text,
                    }}
                  >
                    {label}
                  </Text>
                </Toggle>
              ))}
            </ToggleGroup>
            <ToggleGroup
              accessibilityLabel="Demo vertical toggle group"
              orientation="vertical"
              defaultValue={["left"]}
              style={{
                backgroundColor: theme.surfaceSubtle,
                borderRadius: 8,
                padding: 3,
                borderWidth: 1,
                borderColor: theme.borderSubtle,
                alignSelf: "flex-start",
                gap: 2,
              }}
            >
              {(
                [
                  ["left", "Left"],
                  ["center", "Center"],
                  ["right", "Right"],
                ] as Array<[string, string]>
              ).map(([itemValue, label]) => (
                <Toggle
                  key={itemValue}
                  value={itemValue}
                  style={(state) => ({
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: state.pressed
                      ? theme.surface
                      : "transparent",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.text,
                    }}
                  >
                    {label}
                  </Text>
                </Toggle>
              ))}
            </ToggleGroup>
          </View>
        </View>
      </View>
    );
  },
};
