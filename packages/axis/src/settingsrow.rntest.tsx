import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { SettingsRow, Switch } from "./index";

/**
 * SettingsRow behavior through the public entry. Title and description
 * render, the control slot stays independently operable in a static
 * row, the pressable row navigates with the button role and selected
 * state, disabled is terminal, and refs reach the host — all observed
 * in the RN runtime.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("SettingsRow on React Native", () => {
  it("renders title and description in a static row", async () => {
    await render(
      <SettingsRow
        testID="row"
        title="Airplane mode"
        description="Disable all radios"
      />,
    );
    expect(screen.getByText("Airplane mode")).toBeTruthy();
    expect(screen.getByText("Disable all radios")).toBeTruthy();
    expect(screen.getByTestId("row")).toBeTruthy();
  });

  it("keeps the control independently operable in a static row", async () => {
    const seen: boolean[] = [];
    await render(
      <SettingsRow
        title="Airplane mode"
        control={
          <Switch
            accessibilityLabel="Airplane mode switch"
            defaultValue={false}
            onValueChange={(v) => seen.push(v)}
          />
        }
      />,
    );
    await pressLabel("Airplane mode switch");
    expect(seen).toEqual([true]);
  });

  it("navigates through the pressable row with the button role", async () => {
    let navigated = 0;
    await render(
      <SettingsRow
        title="Wi-Fi"
        description="Home network"
        onPress={() => (navigated += 1)}
      />,
    );
    expect(screen.getByRole("button", { name: "Wi-Fi" })).toBeTruthy();
    await pressLabel("Wi-Fi");
    expect(navigated).toBe(1);
  });

  it("announces selected state on the pressable row", async () => {
    await render(<SettingsRow title="Wi-Fi" selected onPress={() => {}} />);
    expect(
      screen.getByLabelText("Wi-Fi").props.accessibilityState,
    ).toMatchObject({ selected: true, disabled: false });
  });

  it("is terminal when disabled: no press, no navigation", async () => {
    let navigated = 0;
    await render(
      <SettingsRow title="Wi-Fi" disabled onPress={() => (navigated += 1)} />,
    );
    expect(
      screen.getByLabelText("Wi-Fi").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await pressLabel("Wi-Fi");
    expect(navigated).toBe(0);
  });

  it("falls back to the title when no label is given", async () => {
    await render(<SettingsRow title="Bluetooth" onPress={() => {}} />);
    expect(screen.getByLabelText("Bluetooth")).toBeTruthy();
  });

  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<SettingsRow title="Ref row" ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});
