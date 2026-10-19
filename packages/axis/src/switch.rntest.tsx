import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { Pressable } from "react-native";
import { SwitchRoot, SwitchThumb } from "./index";

/**
 * SwitchRoot behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * state flips, role/state announcements, disabled terminality, and ref
 * forwarding are observed, not assumed.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("SwitchRoot on React Native", () => {
  it("renders off with the switch role and unchecked state", async () => {
    await render(<SwitchRoot testID="sw" accessibilityLabel="Airplane mode" />);
    expect(screen.getByRole("switch")).toBeTruthy();
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByLabelText("Airplane mode")).toBeTruthy();
  });

  it("toggles uncontrolled state and reports through onCheckedChange", async () => {
    const seen: boolean[] = [];
    await render(
      <SwitchRoot
        testID="sw"
        defaultChecked={false}
        onCheckedChange={(v) => seen.push(v)}
      />,
    );
    await press("sw");
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: true,
    });
    await press("sw");
    expect(seen).toEqual([true, false]);
  });

  it("starts on with defaultChecked and follows the controlled prop", async () => {
    function Host() {
      const [checked, setChecked] = useState(true);
      return (
        <SwitchRoot
          testID="sw"
          checked={checked}
          onCheckedChange={setChecked}
        />
      );
    }
    await render(<Host />);
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: true,
    });
    await press("sw");
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("controlled checked without an updating parent holds its state", async () => {
    await render(<SwitchRoot testID="sw" checked={false} />);
    await press("sw");
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("disabled is terminal: no transition, no callback, announced disabled", async () => {
    let calls = 0;
    await render(
      <SwitchRoot testID="sw" disabled onCheckedChange={() => (calls += 1)} />,
    );
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: true,
    });
    await press("sw");
    expect(calls).toBe(0);
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("readOnly is focusable and announced as enabled, but presses change nothing", async () => {
    let calls = 0;
    await render(
      <SwitchRoot
        testID="sw"
        accessibilityLabel="Airplane mode"
        readOnly
        onCheckedChange={() => (calls += 1)}
      />,
    );
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: false,
      disabled: false,
    });
    expect(screen.getByTestId("sw").props.disabled).toBeFalsy();
    await press("sw");
    expect(calls).toBe(0);
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(<SwitchRoot testID="sw" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("accepts caller styles without imposing any", async () => {
    await render(
      <SwitchRoot
        testID="sw"
        style={{ opacity: 0.5 }}
        trackStyle={{ backgroundColor: "red" }}
        thumbStyle={{ width: 20 }}
      />,
    );
    expect(screen.getByTestId("sw").props.style).toMatchObject({
      opacity: 0.5,
    });
  });

  it("composes a thumb reading root state", async () => {
    await render(
      <SwitchRoot testID="sw" defaultChecked>
        <SwitchThumb testID="sw-thumb" />
      </SwitchRoot>,
    );
    expect(screen.getByTestId("sw-thumb")).toBeTruthy();
  });

  it("thumb function style observes checked state", async () => {
    await render(
      <SwitchRoot testID="sw" defaultChecked={false}>
        <SwitchThumb
          testID="sw-thumb"
          style={(state) => ({ opacity: state.checked ? 1 : 0.4 })}
        />
      </SwitchRoot>,
    );
    expect(screen.getByTestId("sw-thumb").props.style).toMatchObject({
      opacity: 0.4,
    });
    await press("sw");
    expect(screen.getByTestId("sw-thumb").props.style).toMatchObject({
      opacity: 1,
    });
  });

  it("thumb outside a root renders with default state", async () => {
    await render(<SwitchThumb testID="orphan" />);
    expect(screen.getByTestId("orphan")).toBeTruthy();
  });
});
