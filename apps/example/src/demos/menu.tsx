import {
  MenuArrow,
  MenuBackdrop,
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  MenuClear,
  MenuEmpty,
  MenuGroup,
  MenuGroupLabel,
  MenuInput,
  type MenuInputProps,
  MenuItem,
  type MenuItemProps,
  MenuLinkItem,
  MenuPopup,
  type MenuPopupProps,
  MenuPortal,
  MenuPositioner,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRadioItemIndicator,
  MenuRoot,
  MenuSeparator,
  MenuSubmenuContent,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  MenuTrigger,
  type MenuTriggerProps,
} from "@xoroh/axis";
import { Text, type TextStyle, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Menu demo: compound popup menu with items, groups, link item,
 * separator, and arrow — plain caller styles.
 */
export const MenuDemo: Demo = {
  slug: "menu",
  title: "Menu",
  components: [
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
    "MenuSubmenuContent",
    "MenuSubmenuRoot",
    "MenuSubmenuTrigger",
    "MenuTrigger",
  ],
  render: function MenuScreen() {
    const { theme } = useTheme();
    const triggerStyle: MenuTriggerProps["style"] = {
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 6,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
    };
    const labelStyle: TextStyle = { fontSize: 14, color: theme.text };
    const subtleStyle: TextStyle = { fontSize: 12, color: theme.textSubtle };
    const popupStyle: MenuPopupProps["style"] = {
      backgroundColor: theme.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 6,
      paddingHorizontal: 4,
      minWidth: 210,
      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
      gap: 2,
    };
    const itemStyle: MenuItemProps["style"] = {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 6,
    };
    const inputStyle: MenuInputProps["style"] = {
      fontSize: 14,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginBottom: 4,
    };
    // Inline box: same surface; the positioner matches the box to
    // the trigger row width, so no `width` here — `width: 100%`
    // would mean the viewport once the box portals to the app host.
    const inlineBoxStyle: MenuPopupProps["style"] = {
      ...popupStyle,
      minWidth: undefined,
    };
    const wideTriggerStyle: MenuTriggerProps["style"] = {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 6,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
    };
    return (
      <View style={{ gap: 16 }}>
        <MenuRoot>
          <MenuTrigger accessibilityLabel="Open demo menu" style={triggerStyle}>
            <Text style={labelStyle}>Open</Text>
          </MenuTrigger>
          <MenuPortal>
            <MenuBackdrop />
            <MenuPositioner align="start">
              <MenuPopup style={popupStyle}>
                <MenuGroup>
                  <MenuGroupLabel>
                    <Text style={subtleStyle}>Actions</Text>
                  </MenuGroupLabel>
                  <MenuItem value="new" style={itemStyle}>
                    <Text style={labelStyle}>New</Text>
                  </MenuItem>
                  <MenuLinkItem value="docs" style={itemStyle}>
                    <Text style={labelStyle}>Docs</Text>
                  </MenuLinkItem>
                </MenuGroup>
                <MenuSeparator />
                <MenuSubmenuRoot value="more">
                  <MenuSubmenuTrigger
                    accessibilityLabel="More options"
                    style={itemStyle}
                  >
                    <Text style={labelStyle}>More</Text>
                  </MenuSubmenuTrigger>
                  <MenuSubmenuContent>
                    <MenuItem value="share" style={itemStyle}>
                      <Text style={labelStyle}>Share</Text>
                    </MenuItem>
                  </MenuSubmenuContent>
                </MenuSubmenuRoot>
                <MenuCheckboxItem defaultChecked={false} style={itemStyle}>
                  <MenuCheckboxItemIndicator>
                    <Text style={labelStyle}>✓</Text>
                  </MenuCheckboxItemIndicator>
                  <Text style={labelStyle}>Minimap</Text>
                </MenuCheckboxItem>
                <MenuRadioGroup>
                  <MenuRadioItem value="date" style={itemStyle}>
                    <MenuRadioItemIndicator>
                      <Text style={labelStyle}>•</Text>
                    </MenuRadioItemIndicator>
                    <Text style={labelStyle}>Sort</Text>
                  </MenuRadioItem>
                </MenuRadioGroup>
                <MenuArrow />
              </MenuPopup>
            </MenuPositioner>
          </MenuPortal>
        </MenuRoot>
        <MenuRoot modal={false}>
          <MenuTrigger
            accessibilityLabel="Open inline"
            style={wideTriggerStyle}
          >
            <Text style={labelStyle}>Inline</Text>
          </MenuTrigger>
          <MenuPortal>
            <MenuPopup testID="inline-menu" style={inlineBoxStyle}>
              <MenuItem value="a" style={itemStyle}>
                <Text style={labelStyle}>A</Text>
              </MenuItem>
            </MenuPopup>
          </MenuPortal>
        </MenuRoot>
        <MenuRoot>
          <MenuTrigger
            accessibilityLabel="Open filterable menu"
            style={triggerStyle}
          >
            <Text style={labelStyle}>Filterable</Text>
          </MenuTrigger>
          <MenuPortal>
            <MenuBackdrop />
            <MenuPositioner align="start">
              <MenuPopup style={popupStyle}>
                <MenuInput
                  accessibilityLabel="Filter demo menu"
                  placeholder="Filter"
                  style={inputStyle}
                />
                <MenuItem value="new" filterText="New" style={itemStyle}>
                  <Text style={labelStyle}>New</Text>
                </MenuItem>
                <MenuItem value="open" filterText="Open" style={itemStyle}>
                  <Text style={labelStyle}>Open</Text>
                </MenuItem>
                <MenuEmpty>
                  <Text style={subtleStyle}>No matches</Text>
                </MenuEmpty>
                <MenuClear accessibilityLabel="Clear demo filter">
                  <Text style={subtleStyle}>Clear</Text>
                </MenuClear>
              </MenuPopup>
            </MenuPositioner>
          </MenuPortal>
        </MenuRoot>
      </View>
    );
  },
};
