import type { TimePickerValue } from "@xoroh/axis";
import { Calendar, Slider, TimePicker } from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Ranges and dates demo: drag slider, UTC date grid, and time
 * entry with plain caller styles.
 */
export const RangesDemo: Demo = {
  slug: "ranges",
  title: "Ranges",
  components: ["Slider", "Calendar", "TimePicker"],
  render: function RangesScreen() {
    const [volume, setVolume] = useState(40);
    const [day, setDay] = useState<string | null>(null);
    const [time, setTime] = useState<TimePickerValue | null>(null);
    return (
      <View style={{ gap: 16 }}>
        <Slider
          accessibilityLabel="Demo slider"
          value={volume}
          onValueChange={setVolume}
        />
        <Calendar
          accessibilityLabel="Demo calendar"
          value={day}
          onValueChange={setDay}
        />
        <TimePicker
          accessibilityLabel="Demo time picker"
          value={time}
          onValueChange={setTime}
        />
        <Text>
          {volume}/{day}/{time ? `${time.hours}:${time.minutes}` : ""}
        </Text>
      </View>
    );
  },
};
