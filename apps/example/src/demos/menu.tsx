import {
  Menu,
  MenuArrow,
  MenuBackdrop,
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  MenuClear,
  MenuEmpty,
  MenuGroup,
  MenuGroupLabel,
  MenuInput,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRadioItemIndicator,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Menu demo: compound popup menu with items, groups, link item,
 * separator, and arrow — plain caller styles.
 */
export const MenuDemo: Demo = {
  slug: "menu",
  title: "Menu",
  components: [
    "Menu",
    "MenuArrow",
    "MenuBackdrop",
    "MenuCheckboxItem",
    "MenuCheckboxItemIndicator",
    "MenuClear",
    "MenuEmpty",
    "MenuGroup",
    "MenuGroupLabel",
    "MenuInput",
    "MenuItem",
    "MenuLinkItem",
    "MenuPopup",
    "MenuPortal",
    "MenuPositioner",
    "MenuRadioGroup",
    "MenuRadioItem",
    "MenuRadioItemIndicator",
    "MenuRoot",
    "MenuSeparator",
    "MenuTrigger",
  ],
  render: function MenuScreen() {
    return (
      <View style={{ gap: 16 }}>
        <MenuRoot>
          <MenuTrigger accessibilityLabel="Open demo menu">
            <Text>Open</Text>
          </MenuTrigger>
          <MenuPortal>
            <MenuBackdrop />
            <MenuPositioner>
              <MenuPopup>
                <MenuGroup>
                  <MenuGroupLabel>
                    <Text>Actions</Text>
                  </MenuGroupLabel>
                  <MenuItem value="new">
                    <Text>New</Text>
                  </MenuItem>
                  <MenuLinkItem value="docs">
                    <Text>Docs</Text>
                  </MenuLinkItem>
                </MenuGroup>
                <MenuSeparator />
                <MenuCheckboxItem defaultChecked={false}>
                  <MenuCheckboxItemIndicator>
                    <Text>✓</Text>
                  </MenuCheckboxItemIndicator>
                  <Text>Minimap</Text>
                </MenuCheckboxItem>
                <MenuRadioGroup>
                  <MenuRadioItem value="date">
                    <MenuRadioItemIndicator>
                      <Text>•</Text>
                    </MenuRadioItemIndicator>
                    <Text>Sort</Text>
                  </MenuRadioItem>
                </MenuRadioGroup>
                <MenuArrow />
              </MenuPopup>
            </MenuPositioner>
          </MenuPortal>
        </MenuRoot>
        <Menu testID="inline-menu">
          <MenuTrigger accessibilityLabel="Open inline">
            <Text>Inline</Text>
          </MenuTrigger>
          <MenuItem value="a">
            <Text>A</Text>
          </MenuItem>
        </Menu>
        <MenuRoot>
          <MenuTrigger accessibilityLabel="Open filterable menu">
            <Text>Filterable</Text>
          </MenuTrigger>
          <MenuPortal>
            <MenuBackdrop />
            <MenuPositioner>
              <MenuPopup>
                <MenuInput
                  accessibilityLabel="Filter demo menu"
                  placeholder="Filter"
                />
                <MenuItem value="new" filterText="New">
                  <Text>New</Text>
                </MenuItem>
                <MenuItem value="open" filterText="Open">
                  <Text>Open</Text>
                </MenuItem>
                <MenuEmpty>
                  <Text>No matches</Text>
                </MenuEmpty>
                <MenuClear accessibilityLabel="Clear demo filter">
                  <Text>Clear</Text>
                </MenuClear>
              </MenuPopup>
            </MenuPositioner>
          </MenuPortal>
        </MenuRoot>
      </View>
    );
  },
};
