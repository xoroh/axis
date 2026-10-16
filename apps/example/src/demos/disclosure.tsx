import {
  Accordion,
  AccordionItem,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Disclosure and tabs demo: accordion, collapsible, and tab
 * interfaces with plain caller styles.
 */
export const DisclosureDemo: Demo = {
  slug: "disclosure",
  title: "Disclosure",
  components: [
    "Accordion",
    "AccordionItem",
    "Collapsible",
    "CollapsiblePanel",
    "CollapsibleTrigger",
    "Tabs",
    "TabsList",
    "TabsPanel",
    "TabsTrigger",
  ],
  render: function DisclosureScreen() {
    return (
      <View style={{ gap: 16 }}>
        <Accordion accessibilityLabel="Demo accordion">
          <AccordionItem
            value="a"
            accessibilityLabel="General"
            header={<Text>General</Text>}
          >
            <Text>General panel</Text>
          </AccordionItem>
        </Accordion>
        <Collapsible>
          <CollapsibleTrigger accessibilityLabel="More">
            <Text>More</Text>
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <Text>Hidden details</Text>
          </CollapsiblePanel>
        </Collapsible>
        <Tabs testID="demo-tabs">
          <TabsList>
            <TabsTrigger value="a" accessibilityLabel="Alpha" />
            <TabsTrigger value="b" accessibilityLabel="Beta" />
          </TabsList>
          <TabsPanel value="a">
            <Text>Panel A</Text>
          </TabsPanel>
          <TabsPanel value="b">
            <Text>Panel B</Text>
          </TabsPanel>
        </Tabs>
      </View>
    );
  },
};
