import {
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Dropdown menu demo: trigger, items, and submenu cascade with
 * clean caller styles.
 */
export const DropdownDemo: Demo = {
  slug: "dropdown",
  title: "Dropdown",
  components: [
    "DropdownMenuRoot",
    "DropdownMenuItem",
    "DropdownMenuSub",
    "DropdownMenuSubContent",
    "DropdownMenuSubTrigger",
    "DropdownMenuTrigger",
  ],
  render: function DropdownScreen() {
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
            Dropdown Menu with Cascading Submenu:
          </Text>

          <DropdownMenuRoot
            testID="demo-dropdown"
            style={{
              marginTop: 8,
              backgroundColor: theme.surfaceSubtle,
              borderRadius: 10,
              padding: 8,
              borderWidth: 1,
              borderColor: theme.border,
              minWidth: 240,
              maxWidth: 260,
              gap: 4,
            }}
          >
            <DropdownMenuTrigger
              accessibilityLabel="Open demo dropdown"
              style={{
                alignSelf: "flex-start",
                paddingVertical: 9,
                paddingHorizontal: 16,
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
                Dropdown Options ▾
              </Text>
            </DropdownMenuTrigger>
            <DropdownMenuItem
              value="new"
              style={{ paddingVertical: 8, paddingHorizontal: 10 }}
            >
              <Text style={{ fontSize: 13, color: theme.text }}>
                + New Project
              </Text>
            </DropdownMenuItem>

            <DropdownMenuSub value="share">
              <DropdownMenuSubTrigger
                accessibilityLabel="Share submenu"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 13, color: theme.text }}>
                  Share with Team
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSubtle }}>▸</Text>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                testID="share-panel"
                style={{
                  marginTop: 4,
                  marginLeft: 12,
                  paddingLeft: 8,
                  borderLeftWidth: 2,
                  borderLeftColor: theme.primary,
                }}
              >
                <DropdownMenuItem
                  value="email"
                  style={{ paddingVertical: 6, paddingHorizontal: 8 }}
                >
                  <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                    ✉ Via Email Invite
                  </Text>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuRoot>
        </View>
      </View>
    );
  },
};
