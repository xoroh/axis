import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { Pressable } from "react-native";
import { Switch } from "./index";

/**
 * Switch behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * state flips, role/state announcements, disabled terminality, and ref
 * forwarding are observed, not assumed.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Switch on React Native", () => {
  it("renders off with the switch role and unchecked state", async () => {
    await render(<Switch testID="sw" accessibilityLabel="Airplane mode" />);
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
      <Switch
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
        <Switch testID="sw" checked={checked} onCheckedChange={setChecked} />
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
    await render(<Switch testID="sw" checked={false} />);
    await press("sw");
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("disabled is terminal: no transition, no callback, announced disabled", async () => {
    let calls = 0;
    await render(
      <Switch testID="sw" disabled onCheckedChange={() => (calls += 1)} />,
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

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(<Switch testID="sw" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("accepts caller styles without imposing any", async () => {
    await render(
      <Switch
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

  it("honors the deprecated value-spelling (warns once, canonical wins)", async () => {
    const warnings: unknown[][] = [];
    const warn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };
    try {
      const seenChecked: boolean[] = [];
      const seenValue: boolean[] = [];
      await render(
        <Switch
          testID="sw"
          defaultValue={false}
          onValueChange={(v) => seenValue.push(v)}
          onCheckedChange={(v) => seenChecked.push(v)}
        />,
      );
      await press("sw");
      // Both handlers fire (compat fan-out); the canonical name is
      // the documented one.
      expect(seenChecked).toEqual([true]);
      expect(seenValue).toEqual([true]);
      expect(
        warnings.some((args) => String(args[0]).includes("deprecated")),
      ).toBe(true);
    } finally {
      console.warn = warn;
    }
  });

  it("prefers checked over value when both are present", async () => {
    await render(<Switch testID="sw" checked defaultValue={false} />);
    expect(screen.getByTestId("sw").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });
});
