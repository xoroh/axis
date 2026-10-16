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
import type { Demo } from "./registry";

/**
 * Display primitives demo: boxes, image, adornments, gauges, and
 * structure with plain caller styles.
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
    return (
      <View style={{ gap: 16 }}>
        <AxisText accessibilityLabel="Demo text">Hello</AxisText>
        <Label nativeID="demo-label">A label</Label>
        <Avatar
          accessibilityLabel="Demo avatar"
          source={{ uri: "https://example.com/a.png" }}
        />
        <AspectRatio ratio={16 / 9}>
          <View />
        </AspectRatio>
        <Loader accessibilityLabel="Demo loader" />
        <Progress accessibilityLabel="Demo progress" value={42} />
        <Meter accessibilityLabel="Demo meter" value={70} />
        <Separator />
        <Toolbar accessibilityLabel="Demo toolbar">
          <Text>Tools</Text>
        </Toolbar>
        <Table accessibilityLabel="Demo table">
          <TableHeader>
            <TableRow>
              <TableCell>
                <Text>H</Text>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableRow>
            <TableCell>
              <Text>C</Text>
            </TableCell>
          </TableRow>
        </Table>
      </View>
    );
  },
};
