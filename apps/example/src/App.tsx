import { PortalHost } from "@xoroh/axis";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DEMOS } from "./demos/registry";
import { ThemeProvider, ThemeToggle, useTheme } from "./theme";

function AppShell(): React.JSX.Element {
  const [active, setActive] = useState<string | null>(null);
  const demo = DEMOS.find((d) => d.slug === active);
  const DemoScreen = demo?.render;
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          paddingTop: 54,
          paddingHorizontal: 20,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderSubtle,
          backgroundColor: theme.surface,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text }}>
          {demo ? demo.title : `Axis examples (${DEMOS.length})`}
        </Text>
        <ThemeToggle />
      </View>

      {demo === undefined || DemoScreen === undefined ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
          <Text
            style={{
              fontSize: 14,
              color: theme.textSubtle,
              marginBottom: 12,
            }}
          >
            Select a component family to inspect styled interactive web demos.
          </Text>
          {DEMOS.map((d) => (
            <Pressable
              key={d.slug}
              accessibilityRole="button"
              accessibilityLabel={`Open ${d.title} demo`}
              onPress={() => setActive(d.slug)}
              style={({ pressed }) => ({
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: pressed ? theme.surfaceSubtle : theme.surface,
                borderWidth: 1,
                borderColor: theme.borderSubtle,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              })}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: theme.text }}
              >
                {d.title}
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                {d.components.length} components →
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to demo list"
            onPress={() => setActive(null)}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 20,
              backgroundColor: pressed ? theme.surfaceSubtle : "transparent",
              flexDirection: "row",
              alignItems: "center",
            })}
          >
            <Text
              style={{
                color: theme.primary,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              ← Back to demos
            </Text>
          </Pressable>
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 60,
              backgroundColor: theme.bg,
            }}
          >
            <DemoScreen key={demo.slug} />
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      {/* The app-wide portal host: every floating popup paints here,
        above sibling content, instead of inside its trigger's box. */}
      <PortalHost style={{ flex: 1 }}>
        <AppShell />
      </PortalHost>
    </ThemeProvider>
  );
}
