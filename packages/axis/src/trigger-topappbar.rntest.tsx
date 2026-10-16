import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import {
  type Pressable as PressableType,
  Text as RNText,
  type View,
} from "react-native";
import { TopAppBar, Trigger } from "./index";

/**
 * Trigger + TopAppBar behavior through the public entry. A
 * semantics-free press container (press fires, disabled terminal,
 * no asserted role, ref forwarding) and a header bar (title,
 * slots, header role, label fallback, ref) — observed in the RN
 * runtime.
 */

async function pressTestId(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Trigger on React Native", () => {
  it("fires onPress and asserts no role of its own", async () => {
    let pressed = 0;
    await render(
      <Trigger testID="t" onPress={() => (pressed += 1)}>
        <RNText>Custom control</RNText>
      </Trigger>,
    );
    const host = screen.getByTestId("t");
    expect(host.props.accessibilityRole).toBeUndefined();
    await pressTestId("t");
    expect(pressed).toBe(1);
  });

  it("is terminal when disabled", async () => {
    let pressed = 0;
    await render(
      <Trigger
        testID="t"
        accessibilityLabel="Custom"
        disabled
        onPress={() => (pressed += 1)}
      />,
    );
    await pressTestId("t");
    expect(pressed).toBe(0);
  });

  it("announces a caller-provided label", async () => {
    await render(
      <Trigger accessibilityLabel="Close sheet">
        <RNText>X</RNText>
      </Trigger>,
    );
    expect(screen.getByLabelText("Close sheet")).toBeTruthy();
  });

  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof PressableType>>();
    await render(<Trigger ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});

describe("TopAppBar on React Native", () => {
  it("renders the header role with title and slots", async () => {
    await render(
      <TopAppBar
        testID="bar"
        title="Inbox"
        leading={<RNText>Back</RNText>}
        actions={<RNText>Search</RNText>}
      />,
    );
    expect(screen.getByRole("header")).toBeTruthy();
    expect(screen.getByText("Inbox")).toBeTruthy();
    expect(screen.getByText("Back")).toBeTruthy();
    expect(screen.getByText("Search")).toBeTruthy();
  });

  it("falls back to the title when no label is given", async () => {
    await render(<TopAppBar title="Inbox" />);
    expect(screen.getByLabelText("Inbox")).toBeTruthy();
  });

  it("prefers an explicit label over the title", async () => {
    await render(<TopAppBar title="Inbox" accessibilityLabel="Mail inbox" />);
    expect(screen.getByLabelText("Mail inbox")).toBeTruthy();
  });

  it("forwards a ref to the bar container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<TopAppBar title="Inbox" ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});
