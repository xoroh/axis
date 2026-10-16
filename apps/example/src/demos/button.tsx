import { Button } from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Button demo: default, disabled, and loading states with plain
 * caller styles.
 */
export const ButtonDemo: Demo = {
  slug: "button",
  title: "Button",
  components: ["Button"],
  render: function ButtonScreen() {
    return (
      <View style={{ gap: 16 }}>
        <Button
          accessibilityLabel="Demo button"
          onPress={() => {}}
          style={{ padding: 12 }}
        >
          <Text>Press me</Text>
        </Button>
        <Button accessibilityLabel="Disabled demo button" disabled>
          <Text>Disabled</Text>
        </Button>
        <Button accessibilityLabel="Loading demo button" loading>
          <Text>Loading</Text>
        </Button>
      </View>
    );
  },
};
