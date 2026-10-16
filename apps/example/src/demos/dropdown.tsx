import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Dropdown menu demo: trigger, items, and a submenu cascade with
 * plain caller styles.
 */
export const DropdownDemo: Demo = {
  slug: "dropdown",
  title: "Dropdown",
  components: [
    "DropdownMenu",
    "DropdownMenuItem",
    "DropdownMenuSub",
    "DropdownMenuSubContent",
    "DropdownMenuSubTrigger",
    "DropdownMenuTrigger",
  ],
  render: function DropdownScreen() {
    return (
      <View>
        <DropdownMenu>
          <DropdownMenuTrigger accessibilityLabel="Open demo dropdown">
            <Text>Open</Text>
          </DropdownMenuTrigger>
          <DropdownMenuItem value="new">
            <Text>New</Text>
          </DropdownMenuItem>
          <DropdownMenuSub value="share">
            <DropdownMenuSubTrigger accessibilityLabel="Share submenu">
              <Text>Share</Text>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent testID="share-panel">
              <DropdownMenuItem value="email">
                <Text>Email</Text>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenu>
      </View>
    );
  },
};
