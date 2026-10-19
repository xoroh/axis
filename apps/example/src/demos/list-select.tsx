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
  SelectScrollDownArrow,
  SelectScrollUpArrow,
  SelectSeparator,
  SelectTrigger,
  type SelectTriggerProps,
  SelectValue,
} from "@xoroh/axis";
import { useRef, useState } from "react";
import { ScrollView, Text, type TextStyle, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Long option list shared by the multiple demos: enough rows to
 * overflow the popup so scroll arrows have something to move.
 */
const LONG_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "apple", label: "Apple" },
  { value: "apricot", label: "Apricot" },
  { value: "banana", label: "Banana" },
  { value: "blackberry", label: "Blackberry" },
  { value: "blueberry", label: "Blueberry" },
  { value: "cherry", label: "Cherry" },
  { value: "coconut", label: "Coconut" },
  { value: "cranberry", label: "Cranberry" },
  { value: "date", label: "Date" },
  { value: "dragonfruit", label: "Dragonfruit" },
  { value: "elderberry", label: "Elderberry" },
  { value: "fig", label: "Fig" },
  { value: "grape", label: "Grape" },
  { value: "grapefruit", label: "Grapefruit" },
  { value: "guava", label: "Guava" },
  { value: "kiwi", label: "Kiwi" },
  { value: "lemon", label: "Lemon" },
  { value: "lime", label: "Lime" },
  { value: "lychee", label: "Lychee" },
  { value: "mango", label: "Mango" },
  { value: "melon", label: "Melon" },
  { value: "nectarine", label: "Nectarine" },
  { value: "orange", label: "Orange" },
  { value: "papaya", label: "Papaya" },
  { value: "peach", label: "Peach" },
  { value: "pear", label: "Pear" },
  { value: "pineapple", label: "Pineapple" },
  { value: "plum", label: "Plum" },
  { value: "raspberry", label: "Raspberry" },
  { value: "strawberry", label: "Strawberry" },
];

/**
 * List selection demo: dropdown, filterable combo, and filter-as-type
 * autocomplete with plain caller styles — plus the compound select
 * anatomy (root/trigger/value/portal/backdrop/positioner/popup with
 * grouped items and indicators), a multiple monolith over a long
 * list, and a compound multiple with scroll arrows around a
 * scrolling option list.
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
    "SelectScrollUpArrow",
    "SelectScrollDownArrow",
    "Combobox",
    "Autocomplete",
  ],
  render: function ListSelectScreen() {
    const { theme } = useTheme();
    const [sort, setSort] = useState<string | null>(null);
    const [toppings, setToppings] = useState<string[]>([]);
    const [fruit, setFruit] = useState("");
    const [berry, setBerry] = useState("");
    const longListRef = useRef<ScrollView>(null);
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
    // Multiple trigger row: labels join as sibling nodes, so pack
    // from the start (space-between would fling first/last apart).
    const multiRowStyle: SelectProps["style"] = {
      ...rowStyle,
      justifyContent: "flex-start",
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
    const arrowStyle = {
      alignItems: "center" as const,
      paddingVertical: 6,
    };
    const arrowTextStyle: TextStyle = {
      fontSize: 12,
      color: theme.textSubtle,
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
          onValueChange={(next) => {
            if (!Array.isArray(next)) setSort(next);
          }}
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
        <Text style={headingStyle}>Multiple Select (long list):</Text>
        <Text style={{ fontSize: 12, color: theme.textSubtle }}>
          Choosing toggles without closing; the trigger joins the labels.
        </Text>
        <Select
          accessibilityLabel="Demo multiple select"
          multiple
          value={toppings}
          onValueChange={(next) => setToppings(Array.isArray(next) ? next : [])}
          placeholder={<Text style={placeholderStyle}>Pick fruits</Text>}
          style={multiRowStyle}
          listStyle={listStyle}
        >
          {LONG_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              style={itemStyle}
            >
              <Text style={textStyle}>{option.label}</Text>
            </SelectItem>
          ))}
        </Select>
        <Text style={headingStyle}>
          Compound multiple + scroll arrows (long list):
        </Text>
        <Text style={{ fontSize: 12, color: theme.textSubtle }}>
          The selected item opens aligned over the trigger; arrows jump the
          scroller to either end.
        </Text>
        <SelectRoot
          multiple
          defaultValue={["apricot"]}
          items={[...LONG_OPTIONS]}
        >
          <SelectTrigger
            accessibilityLabel="Demo compound multiple select"
            style={triggerStyle}
          >
            <SelectValue placeholder="Pick fruits" style={axisLabelStyle} />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectPositioner align="start">
              <SelectPopup style={popupStyle}>
                <SelectScrollUpArrow
                  accessibilityLabel="Scroll list to top"
                  scrollRef={longListRef}
                  style={arrowStyle}
                >
                  <Text style={arrowTextStyle}>▲ Top</Text>
                </SelectScrollUpArrow>
                <ScrollView
                  ref={longListRef}
                  style={{ maxHeight: 220 }}
                  accessibilityLabel="Fruit options"
                >
                  {LONG_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      style={itemStyle}
                    >
                      <SelectItemText style={axisLabelStyle}>
                        {option.label}
                      </SelectItemText>
                      <SelectItemIndicator>
                        <Text style={textStyle}>✓</Text>
                      </SelectItemIndicator>
                    </SelectItem>
                  ))}
                </ScrollView>
                <SelectScrollDownArrow
                  accessibilityLabel="Scroll list to bottom"
                  scrollRef={longListRef}
                  style={arrowStyle}
                >
                  <Text style={arrowTextStyle}>▼ Bottom</Text>
                </SelectScrollDownArrow>
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
