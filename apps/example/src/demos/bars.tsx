import {
  DropdownMenuItem,
  DropdownMenuTrigger,
  Menubar,
  MenubarMenu,
  NavigationMenuItem,
  NavigationMenuPanel,
  NavigationMenuRoot,
  NavigationMenuTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Bar menus demo: navigation flyouts and command menus with clean
 * caller styles.
 */
export const BarsDemo: Demo = {
  slug: "bars",
  title: "Bars",
  components: [
    "NavigationMenuItem",
    "NavigationMenuPanel",
    "NavigationMenuTrigger",
    "Menubar",
    "MenubarMenu",
  ],
  render: function BarsScreen() {
    const { theme } = useTheme();

    return (
      <View style={{ gap: 20 }}>
        {/* NavigationMenu */}
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
            Navigation Flyout Menu:
          </Text>
          <NavigationMenuRoot
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: theme.surfaceSubtle,
            }}
          >
            <NavigationMenuItem value="products">
              <NavigationMenuTrigger
                accessibilityLabel="Products trigger"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
                >
                  Products ▾
                </Text>
              </NavigationMenuTrigger>
              <NavigationMenuPanel
                style={{
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ fontSize: 13, color: theme.text }}>
                  Axis Components • Kern System • Documentation
                </Text>
              </NavigationMenuPanel>
            </NavigationMenuItem>
          </NavigationMenuRoot>
        </View>

        {/* Menubar */}
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
            Desktop Menubar:
          </Text>
          <Menubar
            style={{
              flexDirection: "row",
              padding: 6,
              borderRadius: 8,
              backgroundColor: theme.surfaceSubtle,
              borderWidth: 1,
              borderColor: theme.borderSubtle,
            }}
          >
            <MenubarMenu value="file">
              <DropdownMenuTrigger
                accessibilityLabel="File trigger"
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
                >
                  File
                </Text>
              </DropdownMenuTrigger>
              <DropdownMenuItem
                value="new"
                style={{ paddingVertical: 6, paddingHorizontal: 10 }}
              >
                <Text style={{ fontSize: 13, color: theme.text }}>
                  New Window
                </Text>
              </DropdownMenuItem>
            </MenubarMenu>
          </Menubar>
        </View>
      </View>
    );
  },
};
