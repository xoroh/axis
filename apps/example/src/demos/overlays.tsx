import {
  AlertDialog,
  Button,
  ContextMenu,
  Drawer,
  Portal,
  PortalHost,
  Sheet,
  Toast,
  ToastProvider,
  ToastViewport,
  Tooltip,
  Trigger,
  useToast,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import type { Demo } from "./registry";

/**
 * Overlays demo: blocking dialog, sheet, drawer, toast (single-shot
 * and queued), tooltip, long-press menu, standalone portal host, and
 * a semantics-free trigger — all with plain caller styles.
 */
export const OverlaysDemo: Demo = {
  slug: "overlays",
  title: "Overlays",
  components: [
    "AlertDialog",
    "Sheet",
    "Drawer",
    "Toast",
    "ToastProvider",
    "ToastViewport",
    "Portal",
    "PortalHost",
    "Tooltip",
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
        <ContextMenu
          content={<Text>Menu body</Text>}
          accessibilityLabel="Demo context menu"
        >
          <Text>Anchor</Text>
        </ContextMenu>
        <Toast accessibilityLabel="Demo toast" defaultOpen={false}>
          <Text>Saved</Text>
        </Toast>
        <ToastProvider>
          <QueueDemoButton />
          <ToastViewport />
        </ToastProvider>
        <PortalHost>
          <Text>Host anchor</Text>
          <Portal>
            <Text>Portaled content</Text>
          </Portal>
        </PortalHost>
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

function QueueDemoButton() {
  const toast = useToast();
  return (
    <Button
      accessibilityLabel="Queue a toast"
      onPress={() => {
        toast.add({ message: "Queued hello" });
      }}
    >
      <Text>Queue a toast</Text>
    </Button>
  );
}
