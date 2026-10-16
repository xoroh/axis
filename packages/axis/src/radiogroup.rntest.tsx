import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { Pressable } from "react-native";
import { RadioGroup, RadioGroupItem } from "./index";

/**
 * RadioGroup behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * single-select replacement, role/state announcements, disabled
 * terminality (group-wide and per-item), and ref forwarding are
 * observed, not assumed.
 *
 * Items render via the `RadioGroupItem` named export.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("RadioGroup on React Native", () => {
  it("renders a radiogroup with unchecked radio items", async () => {
    await render(
      <RadioGroup testID="rg" accessibilityLabel="Size">
        <RadioGroupItem value="s" testID="s" accessibilityLabel="Small" />
        <RadioGroupItem value="m" testID="m" accessibilityLabel="Medium" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByLabelText("Size")).toBeTruthy();
  });

  it("selects the pressed item and reports its value", async () => {
    const seen: string[] = [];
    await render(
      <RadioGroup testID="rg" onValueChange={(v) => seen.push(v)}>
        <RadioGroupItem value="s" testID="s" />
        <RadioGroupItem value="m" testID="m" />
      </RadioGroup>,
    );
    await press("s");
    expect(seen).toEqual(["s"]);
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("replaces the selection and keeps it on re-activation", async () => {
    const seen: string[] = [];
    await render(
      <RadioGroup testID="rg" onValueChange={(v) => seen.push(v)}>
        <RadioGroupItem value="s" testID="s" />
        <RadioGroupItem value="m" testID="m" />
      </RadioGroup>,
    );
    await press("s");
    await press("m");
    expect(seen).toEqual(["s", "m"]);
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: false,
    });
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: true,
    });
    // Activating the selected item keeps it — never deselects, no callback.
    await press("m");
    expect(seen).toEqual(["s", "m"]);
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it("follows the controlled value prop", async () => {
    function Host() {
      const [value, setValue] = useState<string | null>("s");
      return (
        <RadioGroup testID="rg" value={value} onValueChange={setValue}>
          <RadioGroupItem value="s" testID="s" />
          <RadioGroupItem value="m" testID="m" />
        </RadioGroup>
      );
    }
    await render(<Host />);
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: true,
    });
    await press("m");
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: false,
    });
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it("controlled value without an updating parent holds its selection", async () => {
    await render(
      <RadioGroup testID="rg" value="s">
        <RadioGroupItem value="s" testID="s" />
        <RadioGroupItem value="m" testID="m" />
      </RadioGroup>,
    );
    await press("m");
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("disabled group blocks every item: no selection, no callback", async () => {
    let calls = 0;
    await render(
      <RadioGroup testID="rg" disabled onValueChange={() => (calls += 1)}>
        <RadioGroupItem value="s" testID="s" />
        <RadioGroupItem value="m" testID="m" />
      </RadioGroup>,
    );
    await press("s");
    await press("m");
    expect(calls).toBe(0);
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
  });

  it("disabled item never selects while siblings work", async () => {
    const seen: string[] = [];
    await render(
      <RadioGroup testID="rg" onValueChange={(v) => seen.push(v)}>
        <RadioGroupItem value="s" testID="s" disabled />
        <RadioGroupItem value="m" testID="m" />
      </RadioGroup>,
    );
    await press("s");
    expect(seen).toEqual([]);
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
    await press("m");
    expect(seen).toEqual(["m"]);
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: true,
      disabled: false,
    });
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("forwards a ref to the group root", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(
      <RadioGroup testID="rg" ref={ref}>
        <RadioGroupItem value="s" testID="s" />
      </RadioGroup>,
    );
    expect(ref.current).not.toBeNull();
  });
});
