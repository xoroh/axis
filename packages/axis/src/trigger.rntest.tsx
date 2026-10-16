import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Pressable as PressableType, Text as RNText } from "react-native";
import { Trigger } from "./index";

/**
 * Trigger through the public entry. A semantics-free press
 * container (press fires, disabled terminal, no asserted role,
 * ref forwarding) — observed in the RN runtime.
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
