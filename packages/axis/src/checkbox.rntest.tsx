import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { Pressable } from "react-native";
import { Checkbox } from "./index";

/**
 * Checkbox behavior through the public entry. Rendered in the RN
 * runtime, interacted through RN events: state flips, role/state
 * announcements, checkmark presence, disabled terminality, and ref
 * forwarding are observed, not assumed.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Checkbox on React Native", () => {
  it("renders unchecked with the checkbox role and no checkmark", async () => {
    await render(<Checkbox testID="cb" accessibilityLabel="Accept terms" />);
    expect(screen.getByRole("checkbox")).toBeTruthy();
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByLabelText("Accept terms")).toBeTruthy();
    expect(screen.queryByTestId("cb-checkmark")).toBeNull();
  });

  it("toggles uncontrolled state, reports, and shows the checkmark", async () => {
    const seen: boolean[] = [];
    await render(
      <Checkbox
        testID="cb"
        defaultChecked={false}
        onCheckedChange={(v) => seen.push(v)}
      />,
    );
    await press("cb");
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId("cb-checkmark")).toBeTruthy();
    await press("cb");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByTestId("cb-checkmark")).toBeNull();
  });

  it("follows the controlled prop", async () => {
    function Host() {
      const [value, setValue] = useState(false);
      return (
        <Checkbox testID="cb" checked={value} onCheckedChange={setValue} />
      );
    }
    await render(<Host />);
    await press("cb");
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: true,
    });
    await press("cb");
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("controlled value without an updating parent holds its state", async () => {
    await render(<Checkbox testID="cb" checked={false} />);
    await press("cb");
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("disabled is terminal: no transition, no callback, announced disabled", async () => {
    let calls = 0;
    await render(
      <Checkbox testID="cb" disabled onCheckedChange={() => (calls += 1)} />,
    );
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
    await press("cb");
    expect(calls).toBe(0);
    expect(screen.queryByTestId("cb-checkmark")).toBeNull();
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(<Checkbox testID="cb" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("accepts caller styles without imposing any", async () => {
    await render(
      <Checkbox
        testID="cb"
        defaultChecked
        style={{ opacity: 0.5 }}
        boxStyle={{ borderWidth: 1 }}
        checkmarkStyle={{ width: 12 }}
      />,
    );
    expect(screen.getByTestId("cb").props.style).toMatchObject({
      opacity: 0.5,
    });
    expect(screen.getByTestId("cb-checkmark")).toBeTruthy();
  });
});
