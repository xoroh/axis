import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Pressable, Text } from "react-native";
import { usePress } from "./index";

/**
 * Press model wired to a native Pressable. Proves the gesture-state model
 * (`begin`/`end`/`cancel`, `pressed`, disabled) drives a real RN control —
 * the binding the Axis contract requires for every adopted behavior.
 * Contract: `end()` from pressed reports via `onPress`; `cancel()` and a
 * release without a press never report.
 */

function PressButton({
  disabled,
  onPress,
}: {
  disabled?: boolean;
  onPress?: () => void;
}) {
  const { pressed, begin, end } = usePress({ disabled, onPress });
  return (
    <Pressable
      testID="button"
      disabled={disabled}
      onPressIn={begin}
      onPressOut={end}
    >
      <Text>{pressed ? "pressed" : "idle"}</Text>
    </Pressable>
  );
}

async function emit(testID: string, event: "pressIn" | "pressOut") {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), event);
  });
}

describe("press model on React Native", () => {
  it("tracks press-in/press-out and reports the press on release", async () => {
    let calls = 0;
    await render(<PressButton onPress={() => (calls += 1)} />);
    expect(screen.getByText("idle")).toBeTruthy();
    await emit("button", "pressIn");
    expect(screen.getByText("pressed")).toBeTruthy();
    await emit("button", "pressOut");
    expect(screen.getByText("idle")).toBeTruthy();
    expect(calls).toBe(1);
  });

  it("a release without a press reports nothing", async () => {
    let calls = 0;
    await render(<PressButton onPress={() => (calls += 1)} />);
    await emit("button", "pressOut");
    expect(calls).toBe(0);
    expect(screen.getByText("idle")).toBeTruthy();
  });

  it("disabled pressable never enters the pressed state", async () => {
    let calls = 0;
    await render(<PressButton disabled onPress={() => (calls += 1)} />);
    await emit("button", "pressIn");
    expect(screen.getByText("idle")).toBeTruthy();
    await emit("button", "pressOut");
    expect(calls).toBe(0);
  });
});
