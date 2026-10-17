import {
  Autocomplete,
  Combobox,
  Select,
  SelectArrow,
  SelectBackdrop,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
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
    const [sort, setSort] = useState<string | null>(null);
    const [fruit, setFruit] = useState("");
    const [berry, setBerry] = useState("");
    return (
      <View style={{ gap: 16 }}>
        <Select
          accessibilityLabel="Demo select"
          value={sort}
          onValueChange={setSort}
          placeholder="Sort by"
        >
          <SelectItem value="date">
            <Text>Date</Text>
          </SelectItem>
          <SelectItem value="name">
            <Text>Name</Text>
          </SelectItem>
        </Select>
        <SelectRoot
          items={[
            { value: "date", label: "Date" },
            { value: "name", label: "Name" },
          ]}
        >
          <SelectTrigger accessibilityLabel="Demo compound select">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectPositioner>
              <SelectPopup>
                <SelectArrow />
                <SelectGroup>
                  <SelectGroupLabel>
                    <Text>Fields</Text>
                  </SelectGroupLabel>
                  <SelectItem value="date">
                    <SelectItemText>Date</SelectItemText>
                    <SelectItemIndicator>
                      <Text>✓</Text>
                    </SelectItemIndicator>
                  </SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectItem value="name">
                  <SelectItemText>Name</SelectItemText>
                  <SelectItemIndicator>
                    <Text>✓</Text>
                  </SelectItemIndicator>
                </SelectItem>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
        <Combobox
          accessibilityLabel="Demo combobox"
          options={[
            { value: "apple", label: "Apple" },
            { value: "apricot", label: "Apricot" },
          ]}
          value={fruit}
          onValueChange={setFruit}
        />
        <Autocomplete
          accessibilityLabel="Demo autocomplete"
          options={["Apple", "Banana"]}
          value={berry}
          onValueChange={setBerry}
        />
        <Text>
          {sort}/{fruit}/{berry}
        </Text>
      </View>
    );
  },
};
