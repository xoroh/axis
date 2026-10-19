import { Field, Fieldset, Input, NumberField, OtpField } from "@xoroh/axis";
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
    "NumberField",
    "OtpField",
    "Field",
    "Fieldset",
    "Label",
  ],
  render: function EntryScreen() {
    const [name, setName] = useState("Ada Lovelace");
    const [notes, setNotes] = useState("Pioneering computer programmer.");
    const [count, setCount] = useState<number | null>(42);
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
          <Field label="Full Name">
            <Input
              accessibilityLabel="Name input"
              value={name}
              onValueChange={setName}
              placeholder="e.g. Ada"
              style={inputStyle}
            />
          </Field>

          <Field label="Biography Notes">
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
          </Field>
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
          <Fieldset legend="Numeric & Verification Codes">
            <View style={{ gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.textSubtle,
                  }}
                >
                  Quantity Stepper:
                </Text>
                <NumberField
                  accessibilityLabel="Count input"
                  value={count}
                  onValueChange={setCount}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                  inputStyle={[inputStyle, { flex: 1, textAlign: "center" }]}
                  buttonStyle={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: theme.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.textSubtle,
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
          </Fieldset>
        </View>
      </View>
    );
  },
};
