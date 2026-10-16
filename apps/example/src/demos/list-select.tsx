import { Autocomplete, Combobox, Select, SelectItem } from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * List selection demo: dropdown, filterable combo, and filter-as-type
 * autocomplete with plain caller styles.
 */
export const ListSelectDemo: Demo = {
  slug: "list-select",
  title: "List select",
  components: ["Select", "SelectItem", "Combobox", "Autocomplete"],
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
