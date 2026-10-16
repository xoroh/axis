import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
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
    "Dialog",
    "DialogRoot",
    "DialogTrigger",
    "DialogPortal",
    "DialogBackdrop",
    "DialogPopup",
    "DialogTitle",
    "DialogDescription",
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
            <DialogBackdrop />
            <DialogPopup
              accessibilityLabel="Demo dialog"
              style={{ margin: 32, padding: 16 }}
            >
              <DialogTitle>Example</DialogTitle>
              <DialogDescription>Details here.</DialogDescription>
              <DialogClose accessibilityLabel="Close demo dialog">
                <Text>Close</Text>
              </DialogClose>
            </DialogPopup>
          </DialogPortal>
        </DialogRoot>
        <Dialog accessibilityLabel="Inline demo dialog">
          <Text>Inline</Text>
        </Dialog>
      </View>
    );
  },
};
