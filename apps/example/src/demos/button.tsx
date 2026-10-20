import { Button } from "@xoroh/axis";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Button demo: default, disabled, and loading states with clean
 * caller styles.
 */
export const ButtonDemo: Demo = {
  slug: "button",
  title: "Button",
  components: ["Button"],
  render: function ButtonScreen() {
    const { theme } = useTheme();

    return (
      <View style={{ gap: 20 }}>
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Button Variants & States:
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {/* Primary Button */}
            <Button
              aria-label="Demo primary button"
              onPress={() => {}}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 8,
                backgroundColor: theme.primary,
              }}
            >
              <Text
                style={{
                  color: theme.primaryFg,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Primary Button
              </Text>
            </Button>

            {/* Outline Button */}
            <Button
              aria-label="Demo outline button"
              onPress={() => {}}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 8,
                backgroundColor: theme.surface,
                borderWidth: 1.5,
                borderColor: theme.primary,
              }}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Outline Button
              </Text>
            </Button>

            {/* Disabled Button */}
            <Button
              aria-label="Disabled demo button"
              disabled
              style={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 8,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.borderSubtle,
                opacity: 0.6,
              }}
            >
              <Text
                style={{
                  color: theme.muted,
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                Disabled
              </Text>
            </Button>

            {/* Loading Button */}
            <Button
              aria-label="Loading demo button"
              loading
              style={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 8,
                backgroundColor: theme.primary,
                opacity: 0.85,
              }}
            >
              <Text
                style={{
                  color: theme.primaryFg,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Processing...
              </Text>
            </Button>
          </View>
        </View>
      </View>
    );
  },
};
