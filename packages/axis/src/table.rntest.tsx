import { render, screen } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import { TableCell, TableHeader, TableRoot, TableRow } from "./index";

/**
 * TableRoot through the public entry. Every assertion renders the real
 * compound parts in the RN runtime: structure, header/body order,
 * style passthrough per part, testIDs, and ref forwarding are
 * observed, not assumed.
 *
 * No role is asserted on `TableRoot`/`TableHeader`/`TableCell`: React
 * Native's `accessibilityRole` defines no tabular value, so none is
 * declared (see `Table.tsx`). The one role assertion here is the
 * header row's generic `header` role.
 */

describe("TableRoot on React Native", () => {
  it("renders the header/body structure with a header-announced row", async () => {
    await render(
      <TableRoot testID="tbl" accessibilityLabel="Order history">
        <TableHeader testID="hdr">
          <TableRow header testID="hdr-row">
            <TableCell>
              <Text>Item</Text>
            </TableCell>
            <TableCell>
              <Text>Price</Text>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableRow testID="row-1">
          <TableCell>
            <Text>Apples</Text>
          </TableCell>
          <TableCell>
            <Text>$4</Text>
          </TableCell>
        </TableRow>
      </TableRoot>,
    );
    expect(screen.getByText("Item")).toBeTruthy();
    expect(screen.getByText("Price")).toBeTruthy();
    expect(screen.getByText("Apples")).toBeTruthy();
    expect(screen.getByText("$4")).toBeTruthy();
    expect(screen.getByTestId("hdr-row").props.accessibilityRole).toBe(
      "header",
    );
    expect(screen.getByTestId("row-1").props.accessibilityRole).toBeUndefined();
    expect(screen.getByTestId("tbl").props.accessibilityRole).toBeUndefined();
  });

  it("keeps header before body rows in tree order", async () => {
    await render(
      <TableRoot testID="tbl">
        <TableHeader testID="hdr">
          <TableRow header testID="hdr-row">
            <TableCell>
              <Text>Item</Text>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableRow testID="row-1">
          <TableCell>
            <Text>Apples</Text>
          </TableCell>
        </TableRow>
        <TableRow testID="row-2">
          <TableCell>
            <Text>Pears</Text>
          </TableCell>
        </TableRow>
      </TableRoot>,
    );
    const order = screen
      .getByTestId("tbl")
      .children.filter((child) => typeof child !== "string")
      .map((child) => child.props.testID);
    expect(order).toEqual(["hdr", "row-1", "row-2"]);
  });

  it("passes styles through to each part", async () => {
    const rootStyle = { padding: 8 };
    const headerStyle = { marginBottom: 4 };
    const rowStyle = { flexDirection: "row" as const };
    const cellStyle = { flex: 1 };
    await render(
      <TableRoot testID="tbl" style={rootStyle}>
        <TableHeader testID="hdr" style={headerStyle}>
          <TableRow testID="hdr-row" header style={rowStyle}>
            <TableCell testID="cell" style={cellStyle}>
              <Text>Item</Text>
            </TableCell>
          </TableRow>
        </TableHeader>
      </TableRoot>,
    );
    expect(screen.getByTestId("tbl").props.style).toEqual(rootStyle);
    expect(screen.getByTestId("hdr").props.style).toEqual(headerStyle);
    expect(screen.getByTestId("hdr-row").props.style).toEqual(rowStyle);
    expect(screen.getByTestId("cell").props.style).toEqual(cellStyle);
  });

  it("renders testIDs on every part", async () => {
    await render(
      <TableRoot testID="tbl">
        <TableHeader testID="hdr">
          <TableRow testID="hdr-row" header>
            <TableCell testID="cell">
              <Text>Item</Text>
            </TableCell>
          </TableRow>
        </TableHeader>
      </TableRoot>,
    );
    expect(screen.getByTestId("tbl")).toBeTruthy();
    expect(screen.getByTestId("hdr")).toBeTruthy();
    expect(screen.getByTestId("hdr-row")).toBeTruthy();
    expect(screen.getByTestId("cell")).toBeTruthy();
  });

  it("forwards a ref to the table root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <TableRoot testID="tbl" ref={ref}>
        <TableRow testID="row-1">
          <TableCell>
            <Text>Apples</Text>
          </TableCell>
        </TableRow>
      </TableRoot>,
    );
    expect(ref.current).not.toBeNull();
  });
});
