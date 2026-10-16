import {
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Dialog demo: the compound anatomy (Root/Trigger/Portal/Popup/
 * Title/Close) with plain caller styles.
 */
export const DialogDemo: Demo = {
  slug: "dialog",
  title: "Dialog",
  components: [
    "DialogRoot",
    "DialogTrigger",
    "DialogPortal",
    "DialogPopup",
    "DialogTitle",
    "DialogClose",
  ],
  render: function DialogScreen() {
    return (
      <View>
        <DialogRoot>
          <DialogTrigger accessibilityLabel="Open demo dialog">
            <Text>Open dialog</Text>
          </DialogTrigger>
          <DialogPortal>
            <DialogPopup
              accessibilityLabel="Demo dialog"
              style={{ margin: 32, padding: 16 }}
            >
              <DialogTitle>Example</DialogTitle>
              <DialogClose accessibilityLabel="Close demo dialog">
                <Text>Close</Text>
              </DialogClose>
            </DialogPopup>
          </DialogPortal>
        </DialogRoot>
      </View>
    );
  },
};
