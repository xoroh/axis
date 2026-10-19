import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { NumberField } from "./index";

/**
 * NumberField behavior through the public entry. Every assertion renders
 * the real composed component (Axis Input + two Axis Buttons) in the RN
 * runtime and interacts through RN events — text parsing, stepper
 * clamping, disabled terminality, and container ref forwarding are
 * observed, not assumed.
 */

function getInput() {
  const root = screen.root;
  if (root === null) throw new Error("NumberField test: no render root");
  const match = root.queryAll((node) => node.type === "TextInput")[0];
  if (match === undefined)
    throw new Error("NumberField test: expected one host TextInput");
  return match;
}

async function typeText(text: string) {
  await act(async () => {
    fireEvent.changeText(getInput(), text);
  });
}

async function pressStepper(label: "Decrement" | "Increment") {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("NumberField on React Native", () => {
  it("renders the input with both steppers", async () => {
    await render(<NumberField testID="nf" defaultValue={3} />);
    expect(screen.getByTestId("nf")).toBeTruthy();
    expect(screen.getByLabelText("Decrement")).toBeTruthy();
    expect(screen.getByLabelText("Increment")).toBeTruthy();
    expect(screen.getByDisplayValue("3")).toBeTruthy();
  });

  it("typing a valid number reports the parsed float", async () => {
    const seen: (number | null)[] = [];
    await render(<NumberField onValueChange={(v) => seen.push(v)} />);
    await typeText("12.5");
    expect(seen).toEqual([12.5]);
    expect(screen.getByDisplayValue("12.5")).toBeTruthy();
  });

  it("invalid text clears to null", async () => {
    const seen: (number | null)[] = [];
    await render(
      <NumberField defaultValue={5} onValueChange={(v) => seen.push(v)} />,
    );
    await typeText("abc");
    expect(seen).toEqual([null]);
    expect(getInput().props.value).toBe("");
  });

  it("increment steps and clamps at max", async () => {
    const seen: (number | null)[] = [];
    await render(
      <NumberField
        defaultValue={9}
        max={10}
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await pressStepper("Increment");
    expect(seen).toEqual([10]);
    expect(screen.getByDisplayValue("10")).toBeTruthy();
    await pressStepper("Increment");
    expect(seen).toEqual([10]);
  });

  it("decrement steps and clamps at min", async () => {
    const seen: (number | null)[] = [];
    await render(
      <NumberField
        defaultValue={1}
        min={0}
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await pressStepper("Decrement");
    expect(seen).toEqual([0]);
    expect(screen.getByDisplayValue("0")).toBeTruthy();
    await pressStepper("Decrement");
    expect(seen).toEqual([0]);
  });

  it("disabled blocks the input and both steppers", async () => {
    const seen: (number | null)[] = [];
    await render(
      <NumberField
        testID="nf"
        defaultValue={5}
        disabled
        onValueChange={(v) => seen.push(v)}
      />,
    );
    expect(getInput().props.editable).toBe(false);
    await typeText("9");
    await pressStepper("Decrement");
    await pressStepper("Increment");
    expect(seen).toEqual([]);
    expect(getInput().props.value).toBe("5");
  });

  it("forwards a ref to the container view", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<NumberField testID="nf" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("caller container style reaches the surface", async () => {
    await render(
      <NumberField testID="nf" style={{ flexDirection: "column", gap: 4 }} />,
    );
    const style = screen.getByTestId("nf").props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ flexDirection: "column", gap: 4 });
  });
});
