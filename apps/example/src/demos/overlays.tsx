import {
  AlertDialog,
  ContextMenu,
  Drawer,
  Sheet,
  Toast,
  Tooltip,
  TooltipArrow,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  Trigger,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Overlays demo: blocking dialog, sheet, drawer, toast, tooltip,
 * long-press menu, and a semantics-free trigger — all with plain
 * caller styles. The tooltip section shows both the concise
 * monolith and the compound anatomy under one provider timing.
 */
export const OverlaysDemo: Demo = {
  slug: "overlays",
  title: "Overlays",
  components: [
    "AlertDialog",
    "Sheet",
    "Drawer",
    "Toast",
    "Tooltip",
    "TooltipArrow",
    "TooltipPopup",
    "TooltipPortal",
    "TooltipPositioner",
    "TooltipProvider",
    "TooltipRoot",
    "TooltipTrigger",
    "ContextMenu",
    "Trigger",
  ],
  render: function OverlaysScreen() {
    return (
      <View style={{ gap: 16 }}>
        <Trigger accessibilityLabel="Demo trigger" onPress={() => {}}>
          <Text>Custom pressable</Text>
        </Trigger>
        <Tooltip content={<Text>Hint text</Text>}>
          <Text>Long-press me</Text>
        </Tooltip>
        <TooltipProvider showDelay={100}>
          <TooltipRoot>
            <TooltipTrigger accessibilityLabel="Demo compound tip anchor">
              <Text>Long-press me (compound)</Text>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipPositioner side="top">
                <TooltipPopup accessibilityLabel="Compound hint">
                  <TooltipArrow />
                  <Text>Compound hint text</Text>
                </TooltipPopup>
              </TooltipPositioner>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
        <ContextMenu
          content={<Text>Menu body</Text>}
          accessibilityLabel="Demo context menu"
        >
          <Text>Anchor</Text>
        </ContextMenu>
        <Toast accessibilityLabel="Demo toast" defaultOpen={false}>
          <Text>Saved</Text>
        </Toast>
        <Sheet defaultOpen={false} title="Filters" />
        <Drawer defaultOpen={false} accessibilityLabel="Demo drawer">
          <Text>Destinations</Text>
        </Drawer>
        <AlertDialog
          defaultOpen={false}
          title="Discard changes?"
          actions={<Text>Discard</Text>}
        >
          <Text>Unsaved work will be lost.</Text>
        </AlertDialog>
      </View>
    );
  },
};
