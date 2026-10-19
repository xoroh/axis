import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Disclosure and tabs demo: accordion, collapsible, and tab
 * interfaces with clean caller styles.
 */
export const DisclosureDemo: Demo = {
  slug: "disclosure",
  title: "Disclosure",
  components: [
    "AccordionRoot",
    "AccordionItem",
    "AccordionHeader",
    "AccordionTrigger",
    "AccordionPanel",
    "Collapsible",
    "CollapsiblePanel",
    "CollapsibleTrigger",
    "Tabs",
    "TabsList",
    "TabsPanel",
    "TabsTrigger",
  ],
  render: function DisclosureScreen() {
    const { theme } = useTheme();

    return (
      <View style={{ gap: 20 }}>
        {/* Tabs */}
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
            Interactive Tabs:
          </Text>
          <Tabs testID="demo-tabs" defaultValue="a">
            <TabsList
              style={{
                flexDirection: "row",
                backgroundColor: theme.surfaceSubtle,
                borderRadius: 8,
                padding: 4,
                gap: 4,
              }}
            >
              <TabsTrigger
                value="a"
                accessibilityLabel="Overview tab"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  backgroundColor: theme.surface,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: theme.primary,
                  }}
                >
                  Overview
                </Text>
              </TabsTrigger>
              <TabsTrigger
                value="b"
                accessibilityLabel="Settings tab"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: theme.textSubtle,
                  }}
                >
                  Settings
                </Text>
              </TabsTrigger>
            </TabsList>

            <TabsPanel
              value="a"
              style={{
                paddingTop: 12,
                gap: 6,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: theme.text }}
              >
                Overview Panel
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                Axis tab panels support full keyboard and screen reader
                navigation.
              </Text>
            </TabsPanel>

            <TabsPanel
              value="b"
              style={{
                paddingTop: 12,
                gap: 6,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: theme.text }}
              >
                Settings Panel
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                Preferences and configuration options.
              </Text>
            </TabsPanel>
          </Tabs>
        </View>

        {/* Accordion */}
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
            Accordion:
          </Text>
          <AccordionRoot
            accessibilityLabel="Demo accordion"
            multiple
            defaultValue={["general"]}
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.borderSubtle,
              overflow: "hidden",
            }}
          >
            {(
              [
                [
                  "general",
                  "General Settings",
                  "General",
                  "Accordion details rendered cleanly.",
                ],
                [
                  "privacy",
                  "Privacy",
                  "Privacy",
                  "Privacy controls live here.",
                ],
                [
                  "notifications",
                  "Notifications",
                  "Notifications",
                  "Notification preferences live here.",
                ],
              ] as Array<[string, string, string, string]>
            ).map(([itemValue, title, label, panel]) => (
              <AccordionItem key={itemValue} value={itemValue}>
                <AccordionHeader>
                  <AccordionTrigger
                    accessibilityLabel={label}
                    style={{
                      padding: 12,
                      backgroundColor: theme.surfaceSubtle,
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: theme.text,
                      }}
                    >
                      {title}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSubtle }}>
                      ▼
                    </Text>
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionPanel>
                  <View style={{ padding: 12, backgroundColor: theme.surface }}>
                    <Text style={{ fontSize: 13, color: theme.text }}>
                      {panel}
                    </Text>
                  </View>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </AccordionRoot>
        </View>

        {/* Collapsible */}
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
            Collapsible Section:
          </Text>
          <Collapsible defaultOpen style={{ gap: 8 }}>
            <CollapsibleTrigger
              accessibilityLabel="Toggle more details"
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.primary,
                }}
              >
                Toggle Details
              </Text>
            </CollapsibleTrigger>
            <CollapsiblePanel
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: theme.surfaceSubtle,
                borderLeftWidth: 3,
                borderLeftColor: theme.primary,
              }}
            >
              <Text style={{ fontSize: 13, color: theme.text }}>
                Collapsible panel content is visible by default or toggled
                interactively.
              </Text>
            </CollapsiblePanel>
          </Collapsible>
        </View>
      </View>
    );
  },
};
