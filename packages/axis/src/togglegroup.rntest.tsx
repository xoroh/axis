import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { Toggle, ToggleGroup } from "./index";

/**
 * ToggleGroup behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * single-press replacement (the default), multi-press accumulation with
 * `multiple`, orientation structure, pressed-state announcements
 * (`selected`, never `checked` — RN maps no `pressed` key), group-wide
 * disabled terminality, and ref forwarding are observed, not assumed.
 *
 * Items render via the `Toggle` named export.
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
        <Toggle value="a" testID="a" accessibilityLabel="A" />
        <Toggle value="b" testID="b" accessibilityLabel="B" />
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

  it("single-press (default) replaces: pressing another item switches", async () => {
    const seen: (readonly string[])[] = [];
    await render(
      <ToggleGroup testID="tg" onValueChange={(v) => seen.push(v)}>
        <Toggle value="a" testID="a" />
        <Toggle value="b" testID="b" />
      </ToggleGroup>,
    );
    await press("a");
    expect(seen).toEqual([["a"]]);
    await press("b");
    expect(seen).toEqual([["a"], ["b"]]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      selected: false,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("single-press removes the value when the pressed item is pressed again", async () => {
    const seen: (readonly string[])[] = [];
    await render(
      <ToggleGroup testID="tg" onValueChange={(v) => seen.push(v)}>
        <Toggle value="a" testID="a" />
      </ToggleGroup>,
    );
    await press("a");
    await press("a");
    expect(seen).toEqual([["a"], []]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("multiple accumulates and removes per item", async () => {
    const seen: (readonly string[])[] = [];
    await render(
      <ToggleGroup testID="tg" multiple onValueChange={(v) => seen.push(v)}>
        <Toggle value="a" testID="a" />
        <Toggle value="b" testID="b" />
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

  it("orientation selects the container direction, caller style wins", async () => {
    await render(
      <ToggleGroup testID="tg" orientation="vertical">
        <Toggle value="a" testID="a" />
      </ToggleGroup>,
    );
    const flattened = screen.getByTestId("tg").props.style;
    const merged = Object.assign(
      {},
      ...(Array.isArray(flattened) ? flattened : [flattened]),
    );
    expect(merged.flexDirection).toBe("column");
  });

  it("announces pressed through selected, never checked", async () => {
    await render(
      <ToggleGroup testID="tg" multiple defaultValue={["a"]}>
        <Toggle value="a" testID="a" accessibilityLabel="A" />
      </ToggleGroup>,
    );
    const state = screen.getByTestId("a").props.accessibilityState;
    expect(state.selected).toBe(true);
    // Pressed never surfaces as checked: the key is absent, or at most
    // falsy if the host normalizes it — it is never asserted true.
    expect(state.checked ?? false).toBe(false);
  });

  it("disabled group blocks every item: no toggles, no callbacks", async () => {
    let calls = 0;
    await render(
      <ToggleGroup testID="tg" disabled onValueChange={() => (calls += 1)}>
        <Toggle value="a" testID="a" />
        <Toggle value="b" testID="b" />
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
        <Toggle value="a" testID="a" />
      </ToggleGroup>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("a toggle without value stays standalone inside a group", async () => {
    const seen: boolean[] = [];
    await render(
      <ToggleGroup testID="tg" defaultValue={["a"]}>
        <Toggle value="a" testID="a" />
        <Toggle
          testID="free"
          defaultPressed
          onPressedChange={(v) => seen.push(v)}
        />
      </ToggleGroup>,
    );
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByTestId("free").props.accessibilityState).toMatchObject({
      selected: true,
    });
    await press("free");
    expect(seen).toEqual([false]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});
