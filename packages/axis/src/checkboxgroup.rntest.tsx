import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { View } from "react-native";
import { CheckboxGroup, CheckboxRoot } from "./index";

/**
 * CheckboxGroup behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * multi-select toggle semantics, role/state announcements, disabled
 * terminality (group-wide and per-item), and ref forwarding are
 * observed, not assumed.
 *
 * Items are `CheckboxRoot` boxes with `value` (group joining).
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("CheckboxGroup on React Native", () => {
  it("renders a group with unchecked checkbox items", async () => {
    await render(
      <CheckboxGroup testID="cg" accessibilityLabel="Toppings">
        <CheckboxRoot value="a" testID="a" accessibilityLabel="A" />
        <CheckboxRoot value="b" testID="b" accessibilityLabel="B" />
      </CheckboxGroup>,
    );
    expect(screen.getByRole("group")).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByLabelText("Toppings")).toBeTruthy();
  });

  it("adds the pressed item value and reports the array", async () => {
    const seen: (readonly string[])[] = [];
    await render(
      <CheckboxGroup testID="cg" onValueChange={(v) => seen.push(v)}>
        <CheckboxRoot value="a" testID="a" />
        <CheckboxRoot value="b" testID="b" />
      </CheckboxGroup>,
    );
    await press("a");
    expect(seen).toEqual([["a"]]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("removes the value when the selected item is pressed again", async () => {
    const seen: (readonly string[])[] = [];
    await render(
      <CheckboxGroup testID="cg" onValueChange={(v) => seen.push(v)}>
        <CheckboxRoot value="a" testID="a" />
        <CheckboxRoot value="b" testID="b" />
      </CheckboxGroup>,
    );
    await press("a");
    await press("b");
    expect(seen).toEqual([["a"], ["a", "b"]]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: true,
    });
    // Re-activating a selected item removes it — toggle semantics.
    await press("a");
    expect(seen).toEqual([["a"], ["a", "b"], ["b"]]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: false,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it("follows the controlled value prop", async () => {
    function Host() {
      const [value, setValue] = useState<readonly string[]>(["a"]);
      return (
        <CheckboxGroup testID="cg" value={value} onValueChange={setValue}>
          <CheckboxRoot value="a" testID="a" />
          <CheckboxRoot value="b" testID="b" />
        </CheckboxGroup>
      );
    }
    await render(<Host />);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: true,
    });
    await press("b");
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it("disabled group blocks every item: no toggles, no callbacks", async () => {
    let calls = 0;
    await render(
      <CheckboxGroup testID="cg" disabled onValueChange={() => (calls += 1)}>
        <CheckboxRoot value="a" testID="a" />
        <CheckboxRoot value="b" testID="b" />
      </CheckboxGroup>,
    );
    await press("a");
    await press("b");
    expect(calls).toBe(0);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
  });

  it("disabled item never toggles while siblings work", async () => {
    const seen: (readonly string[])[] = [];
    await render(
      <CheckboxGroup testID="cg" onValueChange={(v) => seen.push(v)}>
        <CheckboxRoot value="a" testID="a" disabled />
        <CheckboxRoot value="b" testID="b" />
      </CheckboxGroup>,
    );
    await press("a");
    expect(seen).toEqual([]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
    await press("b");
    expect(seen).toEqual([["b"]]);
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      checked: true,
      disabled: false,
    });
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("forwards a ref to the group root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <CheckboxGroup testID="cg" ref={ref}>
        <CheckboxRoot value="a" testID="a" />
      </CheckboxGroup>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("joined boxes report through onCheckedChange with next membership", async () => {
    const seen: boolean[] = [];
    await render(
      <CheckboxGroup testID="cg">
        <CheckboxRoot
          value="a"
          testID="a"
          onCheckedChange={(v) => seen.push(v)}
        />
      </CheckboxGroup>,
    );
    await press("a");
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it("a standalone CheckboxRoot inside a group ignores group state", async () => {
    await render(
      <CheckboxGroup testID="cg" defaultValue={["a"]}>
        <CheckboxRoot value="a" testID="joined" />
        <CheckboxRoot testID="solo" defaultChecked />
      </CheckboxGroup>,
    );
    // Joined follows membership; standalone follows its own defaultChecked.
    expect(screen.getByTestId("joined").props.accessibilityState).toMatchObject(
      { checked: true },
    );
    expect(screen.getByTestId("solo").props.accessibilityState).toMatchObject({
      checked: true,
    });
    await press("solo");
    expect(screen.getByTestId("solo").props.accessibilityState).toMatchObject({
      checked: false,
    });
    expect(screen.getByTestId("joined").props.accessibilityState).toMatchObject(
      { checked: true },
    );
  });

  it("a standalone CheckboxRoot in a disabled group stays enabled", async () => {
    let calls = 0;
    await render(
      <CheckboxGroup testID="cg" disabled>
        <CheckboxRoot testID="solo" onCheckedChange={() => (calls += 1)} />
      </CheckboxGroup>,
    );
    await press("solo");
    expect(calls).toBe(1);
    expect(screen.getByTestId("solo").props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});
