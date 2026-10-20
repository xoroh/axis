import {
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
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Popover demo: compound anchored overlay with clean caller styles.
 */
export const PopoverDemo: Demo = {
  slug: "popover",
  title: "Popovers",
  components: [
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
    const { theme } = useTheme();

    return (
      <View style={{ gap: 20 }}>
        {/* Modal Compound Popover */}
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
            Inline Anchored Popover:
          </Text>
          <PopoverRoot modal>
            <PopoverTrigger
              aria-label="Inline demo popover"
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
                Toggle Popover Anchor
              </Text>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverBackdrop />
              <PopoverPositioner>
                <PopoverPopup
                  style={{
                    padding: 12,
                    backgroundColor: theme.surface,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.text }}>
                    Popover content aligned to anchor
                  </Text>
                </PopoverPopup>
              </PopoverPositioner>
            </PopoverPortal>
          </PopoverRoot>
        </View>

        {/* Compound Non-Modal Popover */}
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
            Compound Non-Modal Popover:
          </Text>
          <PopoverRoot>
            <PopoverTrigger
              aria-label="Open demo popover"
              style={{
                alignSelf: "flex-start",
                paddingVertical: 9,
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
                Open Anchored Info
              </Text>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverPositioner align="start">
                <PopoverPopup
                  aria-label="Demo popover"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 10,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                    gap: 8,
                    maxWidth: 280,
                  }}
                >
                  <PopoverTitle
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.text,
                    }}
                  >
                    Contextual Info
                  </PopoverTitle>
                  <PopoverDescription
                    style={{ fontSize: 13, color: theme.textSubtle }}
                  >
                    Non-modal popover stays within caller flow and dismisses on
                    outside tap.
                  </PopoverDescription>
                  <PopoverArrow style={{ borderTopColor: theme.border }} />
                  <PopoverClose
                    aria-label="Close demo popover"
                    style={{
                      alignSelf: "flex-end",
                      marginTop: 4,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 4,
                      backgroundColor: theme.surfaceSubtle,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: theme.text,
                      }}
                    >
                      Close
                    </Text>
                  </PopoverClose>
                </PopoverPopup>
              </PopoverPositioner>
            </PopoverPortal>
          </PopoverRoot>
        </View>

        {/* Modal Popover */}
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
            Modal Popover (Backdrop):
          </Text>
          <PopoverRoot modal>
            <PopoverTrigger
              aria-label="Open modal demo popover"
              style={{
                alignSelf: "flex-start",
                paddingVertical: 9,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: theme.text }}
              >
                Open Modal Popover
              </Text>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverBackdrop
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme.overlay,
                }}
              />
              <PopoverPositioner align="start">
                <PopoverPopup
                  aria-label="Modal demo popover"
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 10,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: theme.border,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.text,
                    }}
                  >
                    Modal Popover Window
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                    Modal popover with scrim backdrop.
                  </Text>
                </PopoverPopup>
              </PopoverPositioner>
            </PopoverPortal>
          </PopoverRoot>
        </View>
      </View>
    );
  },
};
