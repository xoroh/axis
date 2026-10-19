import { Slider } from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Ranges demo: drag slider with clean caller styles.
 */
export const RangesDemo: Demo = {
  slug: "ranges",
  title: "Ranges",
  components: ["Slider"],
  render: function RangesScreen() {
    const [volume, setVolume] = useState(60);
    const { theme } = useTheme();

    return (
      <View style={{ gap: 20 }}>
        {/* Slider */}
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
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
            >
              Slider Control
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.primary,
              }}
            >
              {volume}%
            </Text>
          </View>
          <View style={{ paddingVertical: 10 }}>
            <Slider
              accessibilityLabel="Demo volume slider"
              value={volume}
              onValueChange={setVolume}
              trackStyle={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              fillStyle={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.primary,
              }}
              thumbStyle={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: theme.surface,
                borderWidth: 2,
                borderColor: theme.primary,
                boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              }}
            />
          </View>
        </View>
      </View>
    );
  },
};
