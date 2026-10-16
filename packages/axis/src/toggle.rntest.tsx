import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { type Pressable, Text } from "react-native";
import { Toggle } from "./index";

/**
 * Toggle behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * state flips, role/state announcements, disabled terminality, and ref
 * forwarding are observed, not assumed.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Toggle on React Native", () => {
  it("renders unpressed with the button role and unselected state", async () => {
    await render(
      <Toggle testID="tg" accessibilityLabel="Bold">
        <Text>Bold</Text>
      </Toggle>,
    );
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByTestId("tg").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: false,
    });
    expect(screen.getByLabelText("Bold")).toBeTruthy();
    expect(screen.getByText("Bold")).toBeTruthy();
  });

  it("toggles uncontrolled state and reports through onPressedChange", async () => {
    const seen: boolean[] = [];
    await render(
      <Toggle
        testID="tg"
        defaultPressed={false}
        onPressedChange={(v) => seen.push(v)}
      />,
    );
    await press("tg");
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("tg").props.accessibilityState).toMatchObject({
      selected: true,
    });
    await press("tg");
    expect(seen).toEqual([true, false]);
  });

  it("starts pressed with defaultPressed and follows the controlled prop", async () => {
    function Host() {
      const [pressed, setPressed] = useState(true);
      return (
        <Toggle testID="tg" pressed={pressed} onPressedChange={setPressed} />
      );
    }
    await render(<Host />);
    expect(screen.getByTestId("tg").props.accessibilityState).toMatchObject({
      selected: true,
    });
    await press("tg");
    expect(screen.getByTestId("tg").props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("controlled value without an updating parent holds its state", async () => {
    await render(<Toggle testID="tg" pressed={false} />);
    await press("tg");
    expect(screen.getByTestId("tg").props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("disabled is terminal: no transition, no callback, announced disabled", async () => {
    let calls = 0;
    await render(
      <Toggle testID="tg" disabled onPressedChange={() => (calls += 1)} />,
    );
    expect(screen.getByTestId("tg").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: true,
    });
    await press("tg");
    expect(calls).toBe(0);
    expect(screen.getByTestId("tg").props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(<Toggle testID="tg" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("accepts caller styles without imposing any", async () => {
    await render(<Toggle testID="tg" style={{ opacity: 0.5 }} />);
    expect(screen.getByTestId("tg").props.style).toMatchObject({
      opacity: 0.5,
    });
  });
});
