import {
  Field,
  Fieldset,
  Input,
  Label,
  NumberField,
  OtpField,
  Search,
  Textarea,
} from "@xoroh/axis";
import { useState } from "react";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Text entry demo: inputs, multiline, numeric, OTP, search, and
 * field wrappers with plain caller styles.
 */
export const EntryDemo: Demo = {
  slug: "entry",
  title: "Entry",
  components: [
    "Input",
    "Textarea",
    "NumberField",
    "OtpField",
    "Search",
    "Field",
    "Fieldset",
    "Label",
  ],
  render: function EntryScreen() {
    const [name, setName] = useState("");
    const [notes, setNotes] = useState("");
    const [count, setCount] = useState<number | null>(null);
    const [code, setCode] = useState("");
    const [query, setQuery] = useState("");
    return (
      <View style={{ gap: 16 }}>
        <Field label="Name">
          <Input
            accessibilityLabel="Name input"
            value={name}
            onValueChange={setName}
            placeholder="Ada"
          />
        </Field>
        <Field label="Notes">
          <Textarea
            accessibilityLabel="Notes input"
            value={notes}
            onValueChange={setNotes}
            placeholder="Details"
          />
        </Field>
        <Fieldset legend="Counts">
          <NumberField
            accessibilityLabel="Count input"
            value={count}
            onValueChange={setCount}
          />
          <OtpField
            accessibilityLabel="Code input"
            value={code}
            onValueChange={setCode}
            length={4}
          />
        </Fieldset>
        <Label nativeID="search-label">Search label</Label>
        <Search
          accessibilityLabel="Demo search"
          value={query}
          onValueChange={setQuery}
        />
        <Text>
          {name}/{notes}/{count}/{code}/{query}
        </Text>
      </View>
    );
  },
};
