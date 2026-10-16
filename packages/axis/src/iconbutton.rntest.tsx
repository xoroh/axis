import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Pressable, Text } from "react-native";
import { IconButton } from "./index";

/**
 * IconButton behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN
 * events — icon content, press delivery, disabled/loading suppression,
 * busy announcement, and ref forwarding are observed, not assumed.
 *
 * An icon-only control has no visible label, so the suite always
 * passes an `accessibilityLabel`: without one the control would be
 * nameless to assistive technology.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("IconButton on React Native", () => {
  it("renders button role with icon content and its accessible name", async () => {
    await render(
      <IconButton testID="ib" accessibilityLabel="Close">
        <Text>×</Text>
      </IconButton>,
    );
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByText("×")).toBeTruthy();
    expect(screen.getByLabelText("Close")).toBeTruthy();
    expect(screen.getByTestId("ib").props.accessibilityState).toMatchObject({
      disabled: false,
      busy: false,
    });
  });

  it("press fires onPress once", async () => {
    let calls = 0;
    await render(
      <IconButton
        testID="ib"
        accessibilityLabel="Close"
        onPress={() => (calls += 1)}
      >
        <Text>×</Text>
      </IconButton>,
    );
    await press("ib");
    expect(calls).toBe(1);
  });

  it("disabled blocks: no callback, announced disabled", async () => {
    let calls = 0;
    await render(
      <IconButton
        testID="ib"
        accessibilityLabel="Close"
        disabled
        onPress={() => (calls += 1)}
      >
        <Text>×</Text>
      </IconButton>,
    );
    expect(screen.getByTestId("ib").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await press("ib");
    expect(calls).toBe(0);
  });

  it("loading blocks and announces busy", async () => {
    let calls = 0;
    await render(
      <IconButton
        testID="ib"
        accessibilityLabel="Close"
        loading
        onPress={() => (calls += 1)}
      >
        <Text>×</Text>
      </IconButton>,
    );
    expect(screen.getByTestId("ib").props.accessibilityState).toMatchObject({
      disabled: false,
      busy: true,
    });
    await press("ib");
    expect(calls).toBe(0);
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(
      <IconButton testID="ib" accessibilityLabel="Close" ref={ref}>
        <Text>×</Text>
      </IconButton>,
    );
    expect(ref.current).not.toBeNull();
  });
});
