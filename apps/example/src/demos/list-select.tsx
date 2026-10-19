import {
  Autocomplete,
  type AutocompleteProps,
  Combobox,
  type ComboboxProps,
  Select,
  SelectArrow,
  SelectBackdrop,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectItemIndicator,
  type SelectItemProps,
  SelectItemText,
  type SelectItemTextProps,
  SelectPopup,
  type SelectPopupProps,
  SelectPortal,
  SelectPositioner,
  type SelectProps,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  type SelectTriggerProps,
  SelectValue,
} from "@xoroh/axis";
import { useState } from "react";
import { Text, type TextStyle, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * List selection demo: dropdown, filterable combo, and filter-as-type
 * autocomplete with plain caller styles — plus the compound select
 * anatomy (root/trigger/value/portal/backdrop/positioner/popup with
 * grouped items and indicators).
 */
export const ListSelectDemo: Demo = {
  slug: "list-select",
  title: "List select",
  components: [
    "Select",
    "SelectItem",
    "SelectRoot",
    "SelectTrigger",
    "SelectValue",
    "SelectPortal",
    "SelectBackdrop",
    "SelectPositioner",
    "SelectPopup",
    "SelectArrow",
    "SelectItemText",
    "SelectItemIndicator",
    "SelectGroup",
    "SelectGroupLabel",
    "SelectSeparator",
    "Combobox",
    "Autocomplete",
  ],
  render: function ListSelectScreen() {
    const { theme } = useTheme();
    const [sort, setSort] = useState<string | null>(null);
    const [fruit, setFruit] = useState("");
    const [berry, setBerry] = useState("");
    const triggerStyle: SelectTriggerProps["style"] = {
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 6,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
    };
    const textStyle: TextStyle = { fontSize: 14, color: theme.text };
    const axisLabelStyle: SelectItemTextProps["style"] = {
      fontSize: 14,
      color: theme.text,
    };
    const headingStyle: TextStyle = {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    };
    const rowStyle: SelectProps["style"] = {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    };
    const popupStyle: SelectPopupProps["style"] = {
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
    const listStyle: SelectProps["listStyle"] = {
      ...popupStyle,
      // No width here: the hook matches the box to the trigger row
      // (`matchAnchorWidth`); `width: 100%` would mean the viewport
      // once the box portals to the app host.
      minWidth: undefined,
    };
    // Autocomplete's list lays out in flow (never portals), so a
    // full-width box is relative to its own row and stays correct.
    const inlineListStyle: AutocompleteProps["listStyle"] = {
      ...popupStyle,
      width: "100%",
      minWidth: undefined,
    };
    const itemStyle: SelectItemProps["style"] = {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 6,
    };
    const inputStyle: ComboboxProps["inputStyle"] = {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    };
    const placeholderStyle: TextStyle = {
      fontSize: 14,
      color: theme.textSubtle,
    };
    return (
      <View style={{ gap: 16 }}>
        <Text style={headingStyle}>Inline Select:</Text>
        <Select
          accessibilityLabel="Demo select"
          value={sort}
          onValueChange={setSort}
          placeholder={<Text style={placeholderStyle}>Sort by</Text>}
          style={rowStyle}
          listStyle={listStyle}
        >
          <SelectItem value="date" label="Date" style={itemStyle}>
            <Text style={textStyle}>Date</Text>
          </SelectItem>
          <SelectItem value="name" label="Name" style={itemStyle}>
            <Text style={textStyle}>Name</Text>
          </SelectItem>
        </Select>
        <Text style={headingStyle}>Compound Select on OverlayRoot:</Text>
        <SelectRoot
          items={[
            { value: "date", label: "Date" },
            { value: "name", label: "Name" },
          ]}
        >
          <SelectTrigger
            accessibilityLabel="Demo compound select"
            style={triggerStyle}
          >
            <SelectValue placeholder="Sort by" style={axisLabelStyle} />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectPositioner align="start">
              <SelectPopup style={popupStyle}>
                <SelectArrow />
                <SelectGroup>
                  <SelectGroupLabel>
                    <Text style={{ fontSize: 12, color: theme.textSubtle }}>
                      Fields
                    </Text>
                  </SelectGroupLabel>
                  <SelectItem value="date" label="Date" style={itemStyle}>
                    <SelectItemText style={axisLabelStyle}>Date</SelectItemText>
                    <SelectItemIndicator>
                      <Text style={textStyle}>✓</Text>
                    </SelectItemIndicator>
                  </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectItem value="name" label="Name" style={itemStyle}>
                  <SelectItemText style={axisLabelStyle}>Name</SelectItemText>
                  <SelectItemIndicator>
                    <Text style={textStyle}>✓</Text>
                  </SelectItemIndicator>
                </SelectItem>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
        <Text style={headingStyle}>Combobox:</Text>
        <Combobox
          accessibilityLabel="Demo combobox"
          options={[
            { value: "apple", label: "Apple" },
            { value: "apricot", label: "Apricot" },
          ]}
          value={fruit}
          onValueChange={setFruit}
          placeholder="Search fruit"
          style={rowStyle}
          inputStyle={inputStyle}
          listStyle={listStyle}
        />
        <Text style={headingStyle}>Autocomplete:</Text>
        <Autocomplete
          accessibilityLabel="Demo autocomplete"
          options={["Apple", "Banana"]}
          value={berry}
          onValueChange={setBerry}
          placeholder="Type a fruit"
          style={rowStyle}
          inputStyle={inputStyle}
          listStyle={inlineListStyle}
        />
      </View>
    );
  },
};
