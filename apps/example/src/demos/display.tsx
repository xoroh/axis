import {
  AspectRatio,
  Avatar,
  Text as AxisText,
  Label,
  Loader,
  Meter,
  Progress,
  Separator,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Toolbar,
} from "@xoroh/axis";
import { Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Display primitives demo: boxes, image, adornments, gauges, and
 * structure with clean caller styles.
 */
export const DisplayDemo: Demo = {
  slug: "display",
  title: "Display",
  components: [
    "AspectRatio",
    "Avatar",
    "Label",
    "Loader",
    "Meter",
    "Progress",
    "Separator",
    "Table",
    "TableCell",
    "TableHeader",
    "TableRow",
    "Text",
    "Toolbar",
  ],
  render: function DisplayScreen() {
    const { theme } = useTheme();

    return (
      <View style={{ gap: 20 }}>
        {/* Typography & Label */}
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
          <Label
            nativeID="demo-label"
            style={{ fontSize: 13, fontWeight: "600", color: theme.textSubtle }}
          >
            System Label
          </Label>
          <AxisText
            accessibilityLabel="Demo text"
            style={{ fontSize: 18, fontWeight: "700", color: theme.text }}
          >
            Axis Primitive Typography
          </AxisText>
        </View>

        {/* Avatar & Loader */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar
              accessibilityLabel="Demo avatar"
              source={{
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: theme.primary,
                backgroundColor: theme.surfaceSubtle,
              }}
            />
            <View>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
              >
                Profile Identity
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                Avatar with fallback
              </Text>
            </View>
          </View>
          <Loader
            accessibilityLabel="Demo loader"
            size="small"
            color={theme.primary}
          />
        </View>

        {/* Progress & Meter */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Gauges: Progress & Meter
          </Text>

          <View style={{ gap: 6 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 13, color: theme.text }}>Progress</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.primary,
                }}
              >
                65%
              </Text>
            </View>
            <Progress
              accessibilityLabel="Demo progress"
              value={65}
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.surfaceSubtle,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: theme.borderSubtle,
              }}
              barStyle={{
                height: "100%",
                backgroundColor: theme.primary,
                borderRadius: 4,
              }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 13, color: theme.text }}>
                Capacity Meter
              </Text>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: theme.accent }}
              >
                85%
              </Text>
            </View>
            <Meter
              accessibilityLabel="Demo meter"
              value={85}
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.surfaceSubtle,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: theme.borderSubtle,
              }}
              fillStyle={{
                height: "100%",
                backgroundColor: theme.accent,
                borderRadius: 4,
              }}
            />
          </View>
        </View>

        {/* AspectRatio Box */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Aspect Ratio (16 : 9):
          </Text>
          <AspectRatio
            ratio={16 / 9}
            style={{
              borderRadius: 8,
              backgroundColor: theme.surfaceSubtle,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: theme.textSubtle,
              }}
            >
              16 : 9 Widescreen container
            </Text>
          </AspectRatio>
        </View>

        <Separator style={{ height: 1, backgroundColor: theme.borderSubtle }} />

        {/* Toolbar & Table */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>
            Toolbar & Table
          </Text>
          <Toolbar
            accessibilityLabel="Demo toolbar"
            style={{
              flexDirection: "row",
              gap: 8,
              padding: 8,
              backgroundColor: theme.surfaceSubtle,
              borderRadius: 8,
            }}
          >
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: theme.text }}
            >
              Toolbar: Bold | Italic | Code
            </Text>
          </Toolbar>

          <Table
            accessibilityLabel="Demo table"
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.borderSubtle,
              overflow: "hidden",
            }}
          >
            <TableHeader style={{ backgroundColor: theme.surfaceSubtle }}>
              <TableRow
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: theme.borderSubtle,
                }}
              >
                <TableCell style={{ flex: 1, padding: 10 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: theme.text,
                    }}
                  >
                    Primitive
                  </Text>
                </TableCell>
                <TableCell style={{ flex: 1, padding: 10 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: theme.text,
                    }}
                  >
                    Status
                  </Text>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableRow style={{ flexDirection: "row" }}>
              <TableCell style={{ flex: 1, padding: 10 }}>
                <Text style={{ fontSize: 13, color: theme.text }}>
                  Progress
                </Text>
              </TableCell>
              <TableCell style={{ flex: 1, padding: 10 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.primary,
                    fontWeight: "600",
                  }}
                >
                  Verified
                </Text>
              </TableCell>
            </TableRow>
          </Table>
        </View>
      </View>
    );
  },
};
