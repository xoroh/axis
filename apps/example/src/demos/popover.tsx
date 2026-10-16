import {
  Popover,
  PopoverArrow,
  PopoverBackdrop,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Popover demo: compound anchored overlay with plain caller styles.
 */
export const PopoverDemo: Demo = {
  slug: "popover",
  title: "Popover",
  components: [
    "Popover",
    "PopoverArrow",
    "PopoverBackdrop",
    "PopoverClose",
    "PopoverDescription",
    "PopoverPopup",
    "PopoverPortal",
    "PopoverPositioner",
    "PopoverRoot",
    "PopoverTitle",
    "PopoverTrigger",
  ],
  render: function PopoverScreen() {
    return (
      <View style={{ gap: 16 }}>
        <Popover
          accessibilityLabel="Inline demo popover"
          content={<Text>Body</Text>}
        >
          <Text>Anchor</Text>
        </Popover>
        <PopoverRoot>
          <PopoverTrigger accessibilityLabel="Open demo popover">
            <Text>Open</Text>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverPositioner>
              <PopoverPopup accessibilityLabel="Demo popover">
                <PopoverTitle>Example</PopoverTitle>
                <PopoverDescription>Details</PopoverDescription>
                <PopoverArrow />
                <PopoverClose accessibilityLabel="Close demo popover">
                  <Text>Close</Text>
                </PopoverClose>
              </PopoverPopup>
            </PopoverPositioner>
          </PopoverPortal>
        </PopoverRoot>
        <PopoverRoot modal>
          <PopoverTrigger accessibilityLabel="Open modal demo popover">
            <Text>Modal</Text>
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverBackdrop />
            <PopoverPositioner>
              <PopoverPopup accessibilityLabel="Modal demo popover">
                <Text>Modal body</Text>
              </PopoverPopup>
            </PopoverPositioner>
          </PopoverPortal>
        </PopoverRoot>
      </View>
    );
  },
};
