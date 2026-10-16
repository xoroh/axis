import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DEMOS } from "./demos/registry";

/**
 * Example app shell: a demo list, a viewer with a back affordance,
 * and nothing else. Navigation is `useState` by design — no
 * navigation library, no extra dependencies to rot.
 */
export function App(): React.JSX.Element {
  const [active, setActive] = useState<string | null>(null);
  const demo = DEMOS.find((d) => d.slug === active);

  return (
    <View style={{ flex: 1, paddingTop: 64 }}>
      {demo === undefined ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 4 }}>
          <Text style={{ fontSize: 22, marginBottom: 12 }}>
            Axis examples ({DEMOS.length})
          </Text>
          {DEMOS.map((d) => (
            <Pressable
              key={d.slug}
              accessibilityRole="button"
              accessibilityLabel={`Open ${d.title} demo`}
              onPress={() => setActive(d.slug)}
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ fontSize: 17 }}>{d.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to demo list"
            onPress={() => setActive(null)}
            style={{ padding: 16 }}
          >
            <Text>← {demo.title}</Text>
          </Pressable>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {demo.render()}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
