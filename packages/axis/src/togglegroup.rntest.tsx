import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { ToggleGroup, ToggleGroupItem } from "./index";

/**
 * ToggleGroup behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * pressed (not checked) multi-toggle semantics, button role/state
 * announcements, group-wide disabled terminality, and ref forwarding
 * are observed, not assumed.
 *
 * Items render via the `ToggleGroupItem` named export.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("ToggleGroup on React Native", () => {
  it("renders a group with unpressed button items", async () => {
    await render(
      <ToggleGroup testID="tg" accessibilityLabel="Styles">
        <ToggleGroupItem value="a" testID="a" accessibilityLabel="A" />
        <ToggleGroupItem value="b" testID="b" accessibilityLabel="B" />
      </ToggleGroup>,
    );
    expect(screen.getByRole("group")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: false,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: false,
    });
    expect(screen.getByLabelText("Styles")).toBeTruthy();
  });

  it("adds the pressed item value and reports the array", async () => {
    const seen: (readonly string[])[] = [];
    await render(
      <ToggleGroup testID="tg" onValueChange={(v) => seen.push(v)}>
        <ToggleGroupItem value="a" testID="a" />
        <ToggleGroupItem value="b" testID="b" />
      </ToggleGroup>,
    );
    await press("a");
    expect(seen).toEqual([["a"]]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("removes the value when the pressed item is pressed again", async () => {
    const seen: (readonly string[])[] = [];
    await render(
      <ToggleGroup testID="tg" onValueChange={(v) => seen.push(v)}>
        <ToggleGroupItem value="a" testID="a" />
        <ToggleGroupItem value="b" testID="b" />
      </ToggleGroup>,
    );
    await press("a");
    await press("b");
    expect(seen).toEqual([["a"], ["a", "b"]]);
    // Re-activating a pressed item removes it — toggle semantics.
    await press("a");
    expect(seen).toEqual([["a"], ["a", "b"], ["b"]]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      selected: false,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("disabled group blocks every item: no toggles, no callbacks", async () => {
    let calls = 0;
    await render(
      <ToggleGroup testID="tg" disabled onValueChange={() => (calls += 1)}>
        <ToggleGroupItem value="a" testID="a" />
        <ToggleGroupItem value="b" testID="b" />
      </ToggleGroup>,
    );
    await press("a");
    await press("b");
    expect(calls).toBe(0);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: true,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: true,
    });
  });

  it("forwards a ref to the group root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <ToggleGroup testID="tg" ref={ref}>
        <ToggleGroupItem value="a" testID="a" />
      </ToggleGroup>,
    );
    expect(ref.current).not.toBeNull();
  });
});
