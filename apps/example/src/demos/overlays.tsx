import {
  AlertDialog,
  Button,
  ContextMenu,
  Drawer,
  OverlayBackdrop,
  OverlayClose,
  OverlayPopup,
  OverlayPortal,
  OverlayRoot,
  OverlayTrigger,
  Portal,
  PortalHost,
  Toast,
  ToastProvider,
  ToastViewport,
  Tooltip,
  TooltipArrow,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  useToast,
} from "@xoroh/axis";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Overlays demo: blocking dialog, sheet, drawer, toast (single-shot
 * and queued), tooltip (monolith and compound), long-press menu,
 * shared overlay root primitives and standalone portal host —
 * all with clean caller styles.
 */
export const OverlaysDemo: Demo = {
  slug: "overlays",
  title: "Overlays",
  components: [
    "AlertDialog",
    "Drawer",
    "Toast",
    "ToastProvider",
    "ToastViewport",
    "Portal",
    "PortalHost",
    "Overlay",
    "OverlayRoot",
    "OverlayPortal",
    "OverlayBackdrop",
    "OverlayPopup",
    "OverlayTrigger",
    "OverlayClose",
    "Tooltip",
    "TooltipArrow",
    "TooltipPopup",
    "TooltipPortal",
    "TooltipPositioner",
    "TooltipProvider",
    "TooltipRoot",
    "TooltipTrigger",
    "ContextMenu",
  ],
  render: function OverlaysScreen() {
    const { theme } = useTheme();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetPoint, setSheetPoint] = useState<number | string>(1);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [toastVisible, setToastVisible] = useState(true);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);

    return (
      <View style={{ gap: 20 }}>
        <Tooltip
          content={
            <Text style={{ fontSize: 12, color: theme.text }}>Hint text</Text>
          }
          style={{ alignSelf: "flex-start" }}
          tipStyle={{
            backgroundColor: theme.surface,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: 6,
            paddingHorizontal: 10,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <Text style={{ color: theme.text }}>Long-press me</Text>
        </Tooltip>
        <TooltipProvider delay={100}>
          <TooltipRoot>
            <TooltipTrigger
              accessibilityLabel="Demo compound tip anchor"
              style={{ alignSelf: "flex-start" }}
            >
              <Text style={{ fontSize: 13, color: theme.text }}>
                Long-press me (compound)
              </Text>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipPositioner side="top">
                <TooltipPopup
                  accessibilityLabel="Compound hint"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                  }}
                >
                  <TooltipArrow />
                  <Text style={{ fontSize: 12, color: theme.text }}>
                    Compound hint text
                  </Text>
                </TooltipPopup>
              </TooltipPositioner>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
        {/* ContextMenu */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Context Menu:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button
              accessibilityLabel="Open context menu"
              onPress={() => setContextMenuOpen(true)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
              >
                Open Context Menu
              </Text>
            </Button>

            <ContextMenu
              open={contextMenuOpen}
              onOpenChange={setContextMenuOpen}
              content={
                <View
                  style={{
                    padding: 8,
                    backgroundColor: theme.surface,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.text }}>
                    Context Menu Options
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close context menu"
                    onPress={() => setContextMenuOpen(false)}
                    style={{
                      marginTop: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      backgroundColor: theme.surfaceSubtle,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.text,
                        fontWeight: "600",
                      }}
                    >
                      Close menu
                    </Text>
                  </Pressable>
                </View>
              }
              accessibilityLabel="Demo context menu"
              menuStyle={{
                minWidth: 180,
                backgroundColor: theme.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              }}
            >
              <View
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 6,
                  backgroundColor: theme.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
                >
                  Context Menu
                </Text>
              </View>
            </ContextMenu>
          </View>
        </View>

        {/* Toast & Queued Toast */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Toasts & Queue:
          </Text>

          {toastVisible && (
            <Toast
              accessibilityLabel="Demo toast"
              defaultOpen={true}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: theme.primary,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: theme.primaryFg,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                ✓ Profile changes saved successfully
              </Text>
              <Button
                accessibilityLabel="Dismiss toast"
                onPress={() => setToastVisible(false)}
                style={{ paddingLeft: 12 }}
              >
                <Text style={{ color: theme.primaryFg, fontSize: 12 }}>✕</Text>
              </Button>
            </Toast>
          )}

          <ToastProvider>
            <QueueDemoButton />
            <ToastViewport style={{ paddingVertical: 4 }} />
          </ToastProvider>
        </View>

        {/* Bottom sheet (Drawer), side Drawer & AlertDialog */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Modal Sheets & Drawers:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Button
              accessibilityLabel="Open bottom sheet"
              onPress={() => setSheetOpen(true)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
              >
                Open Bottom Sheet
              </Text>
            </Button>

            <Button
              accessibilityLabel="Open bottom sheet at half snap"
              onPress={() => {
                setSheetPoint(0.5);
                setSheetOpen(true);
              }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
              >
                Open Half Sheet
              </Text>
            </Button>

            <Button
              accessibilityLabel="Open Drawer"
              onPress={() => setDrawerOpen(true)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
              >
                Open Drawer
              </Text>
            </Button>

            <Button
              accessibilityLabel="Open Alert Dialog"
              onPress={() => setAlertOpen(true)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: "#ef4444",
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#ffffff" }}
              >
                Open Alert Dialog
              </Text>
            </Button>
          </View>

          <Drawer
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            side="bottom"
            snapPoints={[0.5, 1]}
            snapPoint={sheetPoint}
            onSnapPointChange={setSheetPoint}
            accessibilityLabel="Demo filter settings"
            overlayStyle={{ backgroundColor: theme.overlay, padding: 16 }}
            surfaceStyle={{
              top: 0,
              backgroundColor: theme.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 20,
              gap: 14,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "700", color: theme.text }}
            >
              Filter Settings
            </Text>
            <Text style={{ color: theme.textSubtle, fontSize: 14 }}>
              Choose which updates appear in your activity feed.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close filter sheet"
              onPress={() => setSheetOpen(false)}
              style={{
                alignSelf: "flex-end",
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>Done</Text>
            </Pressable>
          </Drawer>
          <Drawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            accessibilityLabel="Demo drawer"
            side="right"
            overlayStyle={{ backgroundColor: theme.overlay }}
            surfaceStyle={{
              width: 320,
              maxWidth: "85%",
              backgroundColor: theme.surface,
              borderLeftWidth: 1,
              borderLeftColor: theme.border,
              padding: 24,
              gap: 16,
            }}
          >
            <Text
              style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}
            >
              Navigation
            </Text>
            <Text style={{ color: theme.textSubtle, fontSize: 14 }}>
              Move between sections of the example app.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close demo drawer"
              onPress={() => setDrawerOpen(false)}
              style={{
                alignSelf: "flex-start",
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>
                Close drawer
              </Text>
            </Pressable>
          </Drawer>
          <AlertDialog
            open={alertOpen}
            onOpenChange={setAlertOpen}
            title="Discard changes?"
            accessibilityLabel="Discard changes dialog"
            style={{
              position: "absolute",
              top: "30%",
              width: "90%",
              maxWidth: 420,
              alignSelf: "center",
              padding: 24,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
              boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
              gap: 12,
            }}
            actions={
              <Button
                accessibilityLabel="Confirm discard"
                onPress={() => setAlertOpen(false)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  backgroundColor: theme.primary,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: theme.primaryFg, fontWeight: "600" }}>
                  Confirm Discard
                </Text>
              </Button>
            }
          >
            <Text style={{ color: theme.textSubtle, fontSize: 14 }}>
              Are you sure? Unsaved modifications will be permanently lost.
            </Text>
          </AlertDialog>
        </View>

        {/* Overlay Root Primitives */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Overlay Root & Stacking:
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSubtle }}>
            One root owns Android back, stacking, focus and scroll lock; the
            portal paints at the app host.
          </Text>
          <OverlayRoot>
            <OverlayTrigger
              accessibilityLabel="Open overlay root demo"
              style={{
                alignSelf: "flex-start",
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
              >
                Open Overlay
              </Text>
            </OverlayTrigger>
            <OverlayPortal testID="overlay-demo-portal">
              <OverlayBackdrop testID="overlay-demo-backdrop" />
              <OverlayPopup
                accessibilityLabel="Overlay root demo"
                testID="overlay-demo-popup"
                style={{
                  position: "absolute",
                  top: "30%",
                  width: "90%",
                  maxWidth: 420,
                  alignSelf: "center",
                  padding: 24,
                  borderRadius: 14,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: theme.text,
                  }}
                >
                  Presented by the shared overlay root
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                  Backdrop press, Android back and the button below all dismiss
                  through the same root.
                </Text>
                <OverlayClose
                  accessibilityLabel="Close overlay root demo"
                  style={{
                    alignSelf: "flex-end",
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 6,
                    backgroundColor: theme.primary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.primaryFg,
                    }}
                  >
                    Close Overlay
                  </Text>
                </OverlayClose>
              </OverlayPopup>
            </OverlayPortal>
          </OverlayRoot>
        </View>

        {/* Portal Host */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Portal Primitives:
          </Text>
          <PortalHost>
            <Text style={{ fontSize: 13, color: theme.textSubtle }}>
              Host container active.
            </Text>
            <Portal>
              <View
                style={{
                  padding: 8,
                  marginTop: 6,
                  backgroundColor: theme.surfaceSubtle,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: theme.primary,
                  }}
                >
                  ⚡ Content successfully mounted through Portal
                </Text>
              </View>
            </Portal>
          </PortalHost>
        </View>
      </View>
    );
  },
};

function QueueDemoButton() {
  const toast = useToast();
  const { theme } = useTheme();

  return (
    <Button
      accessibilityLabel="Queue a toast"
      onPress={() => {
        toast.add({ message: "Queued system notification" });
      }}
      style={{
        alignSelf: "flex-start",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
        backgroundColor: theme.surfaceSubtle,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>
        + Dispatch Queued Toast
      </Text>
    </Button>
  );
}
