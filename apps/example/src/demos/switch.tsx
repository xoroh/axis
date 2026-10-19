import { SwitchRoot, SwitchThumb } from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Switch demo: uncontrolled + controlled toggles with plain
 * caller styles. The track/thumb geometry is demo layout, not
 * design-system styling.
 */
export const SwitchDemo: Demo = {
  slug: "switch",
  title: "Switch",
  components: ["SwitchRoot", "SwitchThumb"],
  render: function SwitchScreen() {
    const [checked, setChecked] = useState(false);
    const { theme } = useTheme();

    return (
      <View style={{ gap: 24 }}>
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Uncontrolled switch:
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSubtle }}>
            Starts off, toggles on click/tap with native accessibility state.
          </Text>
          <SwitchRoot
            accessibilityLabel="Demo uncontrolled switch"
            trackStyle={{
              width: 52,
              height: 30,
              borderRadius: 15,
              backgroundColor: theme.border,
              padding: 2,
            }}
            thumbStyle={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: theme.surface,
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </View>

        <View
          style={{
            backgroundColor: theme.surface,
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Controlled switch:
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSubtle }}>
            State: {checked ? "Active / Checked" : "Inactive / Unchecked"}
          </Text>
          <SwitchRoot
            accessibilityLabel="Demo controlled switch"
            checked={checked}
            onCheckedChange={setChecked}
            trackStyle={{
              width: 52,
              height: 30,
              borderRadius: 15,
              backgroundColor: checked ? theme.primary : theme.border,
              padding: 2,
            }}
            thumbStyle={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: checked ? theme.primaryFg : theme.surface,
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </View>

        <View
          style={{
            backgroundColor: theme.surface,
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Composed thumb:
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSubtle }}>
            The thumb part reads root state for function styles.
          </Text>
          <SwitchRoot
            accessibilityLabel="Demo composed switch"
            defaultChecked
            trackStyle={{
              width: 52,
              height: 30,
              borderRadius: 15,
              backgroundColor: theme.border,
              padding: 2,
            }}
          >
            <SwitchThumb
              style={(state) => ({
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: state.checked
                  ? theme.primary
                  : theme.surface,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              })}
            />
          </SwitchRoot>
        </View>

        <View
          style={{
            backgroundColor: theme.surface,
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Read-only switch:
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSubtle }}>
            Focusable and announced as enabled, but presses change nothing.
          </Text>
          <SwitchRoot
            accessibilityLabel="Demo read-only switch"
            defaultChecked
            readOnly
            trackStyle={{
              width: 52,
              height: 30,
              borderRadius: 15,
              backgroundColor: theme.primary,
              padding: 2,
            }}
            thumbStyle={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: theme.primaryFg,
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </View>
      </View>
    );
  },
};
