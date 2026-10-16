import { Switch } from "@xoroh/axis";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Switch demo: uncontrolled + controlled toggles with plain
 * caller styles. The track/thumb geometry is demo layout, not
 * design-system styling.
 */
export const SwitchDemo: Demo = {
  slug: "switch",
  title: "Switch",
  components: ["Switch"],
  render: function SwitchScreen() {
    const [checked, setChecked] = useState(false);
    return (
      <View style={{ gap: 16 }}>
        <Text>Uncontrolled (starts off):</Text>
        <Switch
          accessibilityLabel="Demo uncontrolled switch"
          trackStyle={{ width: 52, height: 30, borderRadius: 15 }}
          thumbStyle={{ width: 26, height: 26, borderRadius: 13 }}
        />
        <Text>Controlled (starts {checked ? "on" : "off"}):</Text>
        <Switch
          accessibilityLabel="Demo controlled switch"
          checked={checked}
          onCheckedChange={setChecked}
          trackStyle={{ width: 52, height: 30, borderRadius: 15 }}
          thumbStyle={{ width: 26, height: 26, borderRadius: 13 }}
        />
      </View>
    );
  },
};
