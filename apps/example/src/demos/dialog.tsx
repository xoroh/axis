import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@xoroh/axis";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Dialog demo: compound anatomy (Root/Trigger/Portal/Popup/
 * Title/Close) with clean caller styles.
 */
export const DialogDemo: Demo = {
  slug: "dialog",
  title: "Dialog",
  components: [
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
    const { theme } = useTheme();
    const [inlineOpen, setInlineOpen] = useState(false);

    return (
      <View style={{ gap: 20 }}>
        {/* Compound Dialog */}
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
            Compound Modal Dialog:
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSubtle }}>
            Accessible dialog using Modal portal, backdrop dismiss, and focus
            management.
          </Text>

          <DialogRoot>
            <DialogTrigger
              accessibilityLabel="Open demo dialog"
              style={{
                alignSelf: "flex-start",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: theme.primary,
              }}
            >
              <Text
                style={{
                  color: theme.primaryFg,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Open Dialog Window
              </Text>
            </DialogTrigger>

            <DialogPortal>
              <DialogBackdrop
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme.overlay,
                }}
              />
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                }}
              >
                <DialogPopup
                  accessibilityLabel="Demo dialog"
                  style={{
                    width: "100%",
                    maxWidth: 440,
                    backgroundColor: theme.surface,
                    borderRadius: 14,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: theme.border,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                    gap: 12,
                  }}
                >
                  <DialogTitle
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: theme.text,
                    }}
                  >
                    Confirm Action
                  </DialogTitle>
                  <DialogDescription
                    style={{
                      fontSize: 14,
                      color: theme.textSubtle,
                      lineHeight: 20,
                    }}
                  >
                    This is an accessible Axis modal dialog mounted inside the
                    portal host.
                  </DialogDescription>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      marginTop: 8,
                    }}
                  >
                    <DialogClose
                      accessibilityLabel="Close demo dialog"
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
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: theme.text,
                        }}
                      >
                        Dismiss
                      </Text>
                    </DialogClose>
                  </View>
                </DialogPopup>
              </View>
            </DialogPortal>
          </DialogRoot>
        </View>

        {/* Controlled Compound Dialog */}
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
            Controlled Dialog:
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSubtle }}>
            Same parts, caller-owned open state and an external trigger.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open inline demo dialog"
            onPress={() => setInlineOpen(true)}
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
              Open Inline Dialog
            </Text>
          </Pressable>
          <DialogRoot open={inlineOpen} onOpenChange={setInlineOpen}>
            <DialogPortal>
              <DialogBackdrop style={{ backgroundColor: theme.overlay }} />
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                }}
              >
                <DialogPopup
                  accessibilityLabel="Inline demo dialog"
                  style={{
                    alignSelf: "center",
                    width: "90%",
                    maxWidth: 380,
                    padding: 20,
                    borderRadius: 12,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                    gap: 10,
                  }}
                >
                  <DialogTitle
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: theme.text,
                    }}
                  >
                    Inline dialog
                  </DialogTitle>
                  <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                    Rendered with the compound parts and caller styles.
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                    }}
                  >
                    <DialogClose
                      accessibilityLabel="Close inline demo dialog"
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
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: theme.text,
                        }}
                      >
                        Close
                      </Text>
                    </DialogClose>
                  </View>
                </DialogPopup>
              </View>
            </DialogPortal>
          </DialogRoot>
        </View>
      </View>
    );
  },
};
