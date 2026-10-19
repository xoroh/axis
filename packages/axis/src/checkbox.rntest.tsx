import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Pressable, Text } from "react-native";
import { CheckboxIndicator, CheckboxRoot } from "./index";

/**
 * Checkbox behavior through the public entry. Rendered in the RN
 * runtime, interacted through RN events: Root/Indicator assembly,
 * checked toggling, the `mixed` indeterminate mapping (RN types
 * `checked` as `boolean | 'mixed'`), indicator mounting for both
 * checked and indeterminate, disabled terminality, and ref
 * forwarding are observed, not assumed.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Checkbox on React Native", () => {
  it("renders unchecked with the checkbox role and no indicator", async () => {
    await render(
      <CheckboxRoot testID="cb" accessibilityLabel="Accept terms">
        <CheckboxIndicator testID="cb-mark" />
      </CheckboxRoot>,
    );
    expect(screen.getByRole("checkbox")).toBeTruthy();
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByLabelText("Accept terms")).toBeTruthy();
    expect(screen.queryByTestId("cb-mark")).toBeNull();
  });

  it("toggles uncontrolled state, reports, and shows the indicator", async () => {
    const seen: boolean[] = [];
    await render(
      <CheckboxRoot
        testID="cb"
        defaultChecked={false}
        onCheckedChange={(v) => seen.push(v)}
      >
        <CheckboxIndicator testID="cb-mark" />
      </CheckboxRoot>,
    );
    await press("cb");
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId("cb-mark")).toBeTruthy();
    await press("cb");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByTestId("cb-mark")).toBeNull();
  });

  it("indeterminate announces mixed and mounts the indicator with state", async () => {
    await render(
      <CheckboxRoot testID="cb" indeterminate accessibilityLabel="All items">
        <CheckboxIndicator testID="cb-mark" />
      </CheckboxRoot>,
    );
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: "mixed",
      disabled: false,
    });
    // The indicator mounts for the mixed state too.
    expect(screen.getByTestId("cb-mark")).toBeTruthy();
  });

  it("indicator function render observes checked and indeterminate", async () => {
    await render(
      <CheckboxRoot testID="cb" indeterminate>
        <CheckboxIndicator
          render={(_props, state) => (
            <Text testID="cb-state">
              {state.indeterminate ? "mixed" : "plain"}
            </Text>
          )}
        />
      </CheckboxRoot>,
    );
    expect(screen.getByTestId("cb-state")).toBeTruthy();
    expect(screen.getByText("mixed")).toBeTruthy();
  });

  it("indicator outside a root never mounts", async () => {
    await render(<CheckboxIndicator testID="orphan" />);
    expect(screen.queryByTestId("orphan")).toBeNull();
  });

  it("disabled root blocks toggles: no transitions, no callbacks", async () => {
    let calls = 0;
    await render(
      <CheckboxRoot testID="cb" disabled onCheckedChange={() => (calls += 1)}>
        <CheckboxIndicator testID="cb-mark" />
      </CheckboxRoot>,
    );
    await press("cb");
    expect(calls).toBe(0);
    expect(screen.getByTestId("cb").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
    expect(screen.queryByTestId("cb-mark")).toBeNull();
  });

  it("forwards a ref to the root host", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(
      <CheckboxRoot ref={ref} testID="cb">
        <CheckboxIndicator />
      </CheckboxRoot>,
    );
    expect(ref.current).toBeTruthy();
  });
});
