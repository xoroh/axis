import {
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  FieldsetLegend,
  FieldsetRoot,
  Input,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
  NumberFieldScrubArea,
  OtpField,
} from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Text entry demo: inputs, multiline, numeric, OTP, and
 * field wrappers with clean caller styles.
 */
export const EntryDemo: Demo = {
  slug: "entry",
  title: "Entry",
  components: [
    "Input",
    "NumberFieldRoot",
    "NumberFieldGroup",
    "NumberFieldInput",
    "NumberFieldDecrement",
    "NumberFieldIncrement",
    "NumberFieldScrubArea",
    "OtpField",
    "FieldControl",
    "FieldDescription",
    "FieldError",
    "FieldLabel",
    "FieldRoot",
    "FieldsetLegend",
    "FieldsetRoot",
    "Label",
  ],
  render: function EntryScreen() {
    const [name, setName] = useState("Ada Lovelace");
    const [notes, setNotes] = useState("Pioneering computer programmer.");
    const [count, setCount] = useState<number | null>(42);
    const [limited, setLimited] = useState<number | null>(0);
    const [code, setCode] = useState("1234");
    const { theme } = useTheme();

    const inputStyle = {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      color: theme.text,
      fontSize: 14,
    };

    return (
      <View style={{ gap: 20 }}>
        {/* Basic Fields */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 16,
          }}
        >
          <FieldRoot style={{ gap: 8 }}>
            <FieldLabel
              style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
            >
              Full Name
            </FieldLabel>
            <Input
              accessibilityLabel="Name input"
              value={name}
              onValueChange={setName}
              placeholder="e.g. Ada"
              style={inputStyle}
            />
          </FieldRoot>

          <FieldRoot invalid={notes === ""} style={{ gap: 8 }}>
            <FieldLabel
              style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
            >
              Biography Notes
            </FieldLabel>
            <FieldControl>
              <Input
                accessibilityLabel="Notes input"
                value={notes}
                onValueChange={setNotes}
                placeholder="Enter notes..."
                multiline
                autoGrow
                minRows={2}
                maxRows={6}
                style={[inputStyle, { minHeight: 70 }]}
              />
            </FieldControl>
            <FieldDescription style={{ fontSize: 12, color: theme.textSubtle }}>
              A sentence or two is plenty.
            </FieldDescription>
            <FieldError style={{ fontSize: 12, color: theme.danger }}>
              Notes are required
            </FieldError>
          </FieldRoot>
        </View>

        {/* Fieldset with Number & OTP */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 16,
          }}
        >
          <FieldsetRoot>
            <FieldsetLegend
              style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
            >
              Numeric & Verification Codes
            </FieldsetLegend>
            <View style={{ gap: 14 }}>
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.text,
                  }}
                >
                  Quantity Stepper:
                </Text>
                <NumberFieldRoot value={count} onValueChange={setCount}>
                  <NumberFieldGroup
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      width: 220,
                    }}
                  >
                    <NumberFieldDecrement
                      accessibilityLabel="Decrease count"
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.text }}>−</Text>
                    </NumberFieldDecrement>
                    <NumberFieldInput
                      accessibilityLabel="Count input"
                      style={[inputStyle, { flex: 1, textAlign: "center" }]}
                    />
                    <NumberFieldIncrement
                      accessibilityLabel="Increase count"
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.text }}>+</Text>
                    </NumberFieldIncrement>
                  </NumberFieldGroup>
                  <NumberFieldScrubArea
                    style={{
                      marginTop: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      backgroundColor: theme.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                      Scrub horizontally to change the count
                    </Text>
                  </NumberFieldScrubArea>
                </NumberFieldRoot>
                <Text style={{ fontSize: 12, color: theme.textSubtle }}>
                  Press and hold − or + to repeat.
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.text,
                  }}
                >
                  Capped 0 to 10 (at the min, decrement is disabled):
                </Text>
                <NumberFieldRoot
                  value={limited}
                  onValueChange={setLimited}
                  min={0}
                  max={10}
                >
                  <NumberFieldGroup
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      width: 220,
                    }}
                  >
                    <NumberFieldDecrement
                      accessibilityLabel="Decrease capped"
                      style={(s) => [
                        {
                          width: 44,
                          height: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          backgroundColor: theme.surfaceSubtle,
                          borderWidth: 1,
                          borderColor: theme.border,
                        },
                        s.value === 0 && { opacity: 0.4 },
                      ]}
                    >
                      <Text style={{ color: theme.text }}>−</Text>
                    </NumberFieldDecrement>
                    <NumberFieldInput
                      accessibilityLabel="capped input"
                      style={[inputStyle, { flex: 1, textAlign: "center" }]}
                    />
                    <NumberFieldIncrement
                      accessibilityLabel="Increase capped"
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.text }}>+</Text>
                    </NumberFieldIncrement>
                  </NumberFieldGroup>
                </NumberFieldRoot>
              </View>

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.text,
                  }}
                >
                  Read-only:
                </Text>
                <NumberFieldRoot defaultValue={7} readOnly>
                  <NumberFieldGroup
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      width: 220,
                    }}
                  >
                    <NumberFieldDecrement
                      accessibilityLabel="Decrease read-only"
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.text }}>−</Text>
                    </NumberFieldDecrement>
                    <NumberFieldInput
                      accessibilityLabel="read-only input"
                      style={[inputStyle, { flex: 1, textAlign: "center" }]}
                    />
                    <NumberFieldIncrement
                      accessibilityLabel="Increase read-only"
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.text }}>+</Text>
                    </NumberFieldIncrement>
                  </NumberFieldGroup>
                </NumberFieldRoot>
              </View>

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.text,
                  }}
                >
                  Disabled:
                </Text>
                <NumberFieldRoot defaultValue={3} disabled>
                  <NumberFieldGroup
                    style={(s) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        width: 220,
                      },
                      s.disabled && { opacity: 0.5 },
                    ]}
                  >
                    <NumberFieldDecrement
                      accessibilityLabel="Decrease disabled"
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.text }}>−</Text>
                    </NumberFieldDecrement>
                    <NumberFieldInput
                      accessibilityLabel="disabled input"
                      style={[inputStyle, { flex: 1, textAlign: "center" }]}
                    />
                    <NumberFieldIncrement
                      accessibilityLabel="Increase disabled"
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.text }}>+</Text>
                    </NumberFieldIncrement>
                  </NumberFieldGroup>
                </NumberFieldRoot>
              </View>
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.text,
                  }}
                >
                  4-Digit OTP Code:
                </Text>
                <OtpField
                  accessibilityLabel="Code input"
                  value={code}
                  onValueChange={setCode}
                  length={4}
                  style={{ flexDirection: "row", gap: 8 }}
                  cellStyle={{
                    width: 52,
                    height: 60,
                    borderRadius: 10,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  textStyle={{
                    fontSize: 22,
                    fontWeight: "700",
                    color: theme.text,
                  }}
                />
              </View>
            </View>
          </FieldsetRoot>
        </View>
      </View>
    );
  },
};
