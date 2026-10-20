import { fireEvent, render, screen } from "@testing-library/react-native";
import type * as React from "react";
import { act, createRef, type ElementRef, useState } from "react";
import { type Pressable, Text } from "react-native";
import { RadioGroup, RadioIndicator, RadioRoot } from "./index";

/**
 * RadioGroup behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * single-select replacement, role/state announcements, disabled
 * terminality (group-wide and per-item), and ref forwarding are
 * observed, not assumed.
 *
 * Items render via the `RadioRoot` named export, with a caller-composed
 * `RadioIndicator` that mounts while checked.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("RadioGroup on React Native", () => {
  it("renders a radiogroup with unchecked radio items", async () => {
    await render(
      <RadioGroup testID="rg" aria-label="Size">
        <RadioRoot value="s" testID="s" aria-label="Small" />
        <RadioRoot value="m" testID="m" aria-label="Medium" />
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
        <RadioRoot value="s" testID="s" />
        <RadioRoot value="m" testID="m" />
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
        <RadioRoot value="s" testID="s" />
        <RadioRoot value="m" testID="m" />
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
          <RadioRoot value="s" testID="s" />
          <RadioRoot value="m" testID="m" />
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
        <RadioRoot value="s" testID="s" />
        <RadioRoot value="m" testID="m" />
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
        <RadioRoot value="s" testID="s" />
        <RadioRoot value="m" testID="m" />
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

  it("readOnly group stays focusable and announced as enabled, but selections never change", async () => {
    let calls = 0;
    await render(
      <RadioGroup
        testID="rg"
        aria-label="Size"
        readOnly
        onValueChange={() => (calls += 1)}
      >
        <RadioRoot value="s" testID="s" />
        <RadioRoot value="m" testID="m" />
      </RadioGroup>,
    );
    await press("s");
    await press("m");
    expect(calls).toBe(0);
    // Items stay enabled and focusable — only the selection is frozen.
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByTestId("m").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByTestId("s").props.disabled).toBeFalsy();
  });

  it("per-item readOnly freezes that item only", async () => {
    const seen: string[] = [];
    await render(
      <RadioGroup testID="rg" onValueChange={(v) => seen.push(v)}>
        <RadioRoot value="s" testID="s" readOnly />
        <RadioRoot value="m" testID="m" />
      </RadioGroup>,
    );
    await press("s");
    expect(seen).toEqual([]);
    expect(screen.getByTestId("s").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    await press("m");
    expect(seen).toEqual(["m"]);
  });

  it("disabled item never selects while siblings work", async () => {
    const seen: string[] = [];
    await render(
      <RadioGroup testID="rg" onValueChange={(v) => seen.push(v)}>
        <RadioRoot value="s" testID="s" disabled />
        <RadioRoot value="m" testID="m" />
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
        <RadioRoot value="s" testID="s" />
      </RadioGroup>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("indicator mounts only while its radio is checked", async () => {
    await render(
      <RadioGroup testID="rg" defaultValue="m">
        <RadioRoot value="s" testID="s">
          <RadioIndicator testID="s-mark" />
        </RadioRoot>
        <RadioRoot value="m" testID="m">
          <RadioIndicator testID="m-mark" />
        </RadioRoot>
      </RadioGroup>,
    );
    expect(screen.queryByTestId("s-mark")).toBeNull();
    expect(screen.getByTestId("m-mark")).toBeTruthy();
    await press("s");
    expect(screen.getByTestId("s-mark")).toBeTruthy();
    expect(screen.queryByTestId("m-mark")).toBeNull();
  });

  it("keepMounted keeps the indicator mounted but hidden while unchecked", async () => {
    await render(
      <RadioGroup testID="rg">
        <RadioRoot value="s" testID="s">
          <RadioIndicator testID="s-mark" keepMounted />
        </RadioRoot>
      </RadioGroup>,
    );
    // Mounted (layout present) but hidden from assistive tech on all
    // three platforms, with unchecked state. (RNTL hides hidden-from-AT
    // elements from queries by default — which is itself the proof —
    // so the hidden assertions query with `includeHiddenElements`.)
    expect(
      screen.getByTestId("s-mark", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.queryByTestId("s-mark")).toBeNull();
    const hidden = screen.getByTestId("s-mark", {
      includeHiddenElements: true,
    }).props;
    // ADR-112 aria-only: the indicator sets `aria-hidden` alone.
    expect(hidden["aria-hidden"]).toBe(true);
    expect(hidden.accessibilityElementsHidden).toBeUndefined();
    expect(hidden.importantForAccessibility).toBeUndefined();
    await press("s");
    // Checked: visible and exposed again.
    expect(screen.getByTestId("s-mark").props["aria-hidden"]).toBe(false);
  });

  it("indicator function render observes checked state", async () => {
    await render(
      <RadioGroup testID="rg" defaultValue="m">
        <RadioRoot value="m" testID="m">
          <RadioIndicator
            render={(_props, state) => (
              <Text testID="m-state">{state.checked ? "on" : "off"}</Text>
            )}
          />
        </RadioRoot>
      </RadioGroup>,
    );
    expect(screen.getByText("on")).toBeTruthy();
  });

  it("indicator outside a root never mounts", async () => {
    await render(<RadioIndicator testID="orphan" />);
    expect(screen.queryByTestId("orphan")).toBeNull();
  });

  it("indicator mounts under a render-substituted root", async () => {
    await render(
      <RadioGroup testID="rg" defaultValue="s">
        <RadioRoot
          value="s"
          testID="s"
          render={(props) => (
            <Text testID="s-sub">{props.children as React.ReactNode}</Text>
          )}
        >
          <RadioIndicator testID="s-mark">
            <Text>●</Text>
          </RadioIndicator>
        </RadioRoot>
      </RadioGroup>,
    );
    expect(screen.getByTestId("s-sub")).toBeTruthy();
    expect(screen.getByTestId("s-mark")).toBeTruthy();
  });
});
