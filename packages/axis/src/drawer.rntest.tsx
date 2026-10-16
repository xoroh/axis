import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text as RNText, type View } from "react-native";
import { Drawer } from "./index";

/**
 * Drawer behavior through the public entry. Edge-anchored panel with
 * scrim dismissal — observed in the RN runtime.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("Drawer on React Native", () => {
  it("renders nothing when closed", async () => {
    await render(
      <Drawer testID="drawer" accessibilityLabel="App navigation">
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the dialog surface when open", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen accessibilityLabel="App navigation">
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Destinations")).toBeTruthy();
  });

  it("dismisses through the scrim with onDismiss before onOpenChange", async () => {
    const order: string[] = [];
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        onDismiss={() => order.push("dismiss")}
        onOpenChange={() => order.push("change")}
      >
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    await pressLabel("Dismiss");
    expect(order).toEqual(["dismiss", "change"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders an inert scrim when not dismissable", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen dismissable={false}>
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("anchors to the trailing edge on the right side", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen side="right">
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    const flat: Record<string, unknown> = Object.assign(
      {},
      ...(Array.isArray(screen.getByTestId("drawer").props.style)
        ? screen.getByTestId("drawer").props.style
        : [screen.getByTestId("drawer").props.style]
      ).filter(Boolean),
    );
    expect(flat.right).toBe(0);
    expect(flat.left).toBeUndefined();
  });

  it("forwards a ref to the surface", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Drawer defaultOpen ref={ref}>
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(ref.current).toBeTruthy();
  });
});
