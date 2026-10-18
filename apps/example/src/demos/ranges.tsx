import type { TimePickerValue } from "@xoroh/axis";
import { Calendar, Slider, TimePicker } from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Ranges and dates demo: drag slider, UTC date grid, and time
 * entry with clean caller styles.
 */
export const RangesDemo: Demo = {
  slug: "ranges",
  title: "Ranges",
  components: ["Slider", "Calendar", "TimePicker"],
  render: function RangesScreen() {
    const [volume, setVolume] = useState(60);
    const [day, setDay] = useState<string | null>("2026-10-17");
    const [time, setTime] = useState<TimePickerValue | null>({
      hours: 14,
      minutes: 30,
    });
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

        {/* TimePicker */}
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
            Time Picker:
          </Text>
          <TimePicker
            accessibilityLabel="Demo time picker"
            value={time}
            onValueChange={setTime}
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: theme.surfaceSubtle,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          />
        </View>

        {/* Calendar */}
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
              Calendar Picker:
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSubtle }}>
              Selected: {day ?? "None"}
            </Text>
          </View>
          <Calendar
            accessibilityLabel="Demo calendar"
            value={day}
            onValueChange={setDay}
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: theme.surfaceSubtle,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          />
        </View>
      </View>
    );
  },
};
