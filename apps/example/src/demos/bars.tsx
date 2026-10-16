import {
  DropdownMenuItem,
  DropdownMenuTrigger,
  Menubar,
  MenubarMenu,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Bar menus demo: navigation flyouts and command menus with plain
 * caller styles.
 */
export const BarsDemo: Demo = {
  slug: "bars",
  title: "Bars",
  components: [
    "NavigationMenu",
    "NavigationMenuItem",
    "NavigationMenuPanel",
    "NavigationMenuTrigger",
    "Menubar",
    "MenubarMenu",
  ],
  render: function BarsScreen() {
    return (
      <View style={{ gap: 16 }}>
        <NavigationMenu>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger accessibilityLabel="Products trigger">
              <Text>Products</Text>
            </NavigationMenuTrigger>
            <NavigationMenuPanel>
              <Text>Product links</Text>
            </NavigationMenuPanel>
          </NavigationMenuItem>
        </NavigationMenu>
        <Menubar>
          <MenubarMenu value="file">
            <DropdownMenuTrigger accessibilityLabel="File trigger">
              <Text>File</Text>
            </DropdownMenuTrigger>
            <DropdownMenuItem value="new">
              <Text>New</Text>
            </DropdownMenuItem>
          </MenubarMenu>
        </Menubar>
      </View>
    );
  },
};
