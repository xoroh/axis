import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text, type View } from "react-native";
import { Chip } from "./index";

/**
 * Chip behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * selection flips, the remove affordance firing without toggling,
 * controlled following, disabled terminality across both pressables,
 * and ref forwarding are observed, not assumed.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("Chip on React Native", () => {
  it("renders unselected with the button role", async () => {
    await render(
      <Chip testID="chip" accessibilityLabel="Mint">
        <Text>Mint</Text>
      </Chip>,
    );
    expect(screen.getByRole("button", { name: "Mint" })).toBeTruthy();
    expect(
      screen.getByLabelText("Mint").props.accessibilityState,
    ).toMatchObject({ selected: false, disabled: false });
    expect(screen.getByText("Mint")).toBeTruthy();
  });

  it("toggles uncontrolled selection and reports through onSelectedChange", async () => {
    const seen: boolean[] = [];
    const taps: number[] = [];
    await render(
      <Chip
        accessibilityLabel="Mint"
        defaultSelected={false}
        onSelectedChange={(v) => seen.push(v)}
        onPress={() => taps.push(1)}
      />,
    );
    await pressLabel("Mint");
    expect(seen).toEqual([true]);
    expect(taps).toEqual([1]);
    expect(
      screen.getByLabelText("Mint").props.accessibilityState,
    ).toMatchObject({ selected: true });
    await pressLabel("Mint");
    expect(seen).toEqual([true, false]);
  });

  it("fires onRemove without toggling selection", async () => {
    const seen: boolean[] = [];
    let removed = 0;
    await render(
      <Chip
        accessibilityLabel="Mint"
        defaultSelected={false}
        onSelectedChange={(v) => seen.push(v)}
        onRemove={() => (removed += 1)}
      />,
    );
    expect(screen.getByLabelText("Remove")).toBeTruthy();
    await pressLabel("Remove");
    expect(removed).toBe(1);
    expect(seen).toEqual([]);
    expect(
      screen.getByLabelText("Mint").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("follows the controlled selected prop", async () => {
    function Host() {
      const [selected, setSelected] = useState(false);
      return (
        <Chip
          accessibilityLabel="Mint"
          selected={selected}
          onSelectedChange={setSelected}
        />
      );
    }
    await render(<Host />);
    expect(
      screen.getByLabelText("Mint").props.accessibilityState,
    ).toMatchObject({ selected: false });
    await pressLabel("Mint");
    expect(
      screen.getByLabelText("Mint").props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it("disabled is terminal: blocks the toggle, onPress, and onRemove", async () => {
    let selectedCalls = 0;
    let pressCalls = 0;
    let removeCalls = 0;
    await render(
      <Chip
        accessibilityLabel="Mint"
        disabled
        onSelectedChange={() => (selectedCalls += 1)}
        onPress={() => (pressCalls += 1)}
        onRemove={() => (removeCalls += 1)}
      />,
    );
    expect(
      screen.getByLabelText("Mint").props.accessibilityState,
    ).toMatchObject({ selected: false, disabled: true });
    await pressLabel("Mint");
    await pressLabel("Remove");
    expect(selectedCalls).toBe(0);
    expect(pressCalls).toBe(0);
    expect(removeCalls).toBe(0);
    expect(
      screen.getByLabelText("Mint").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Chip testID="chip" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("accepts caller styles without imposing any", async () => {
    await render(
      <Chip
        testID="chip"
        style={{ opacity: 0.5 }}
        removeStyle={{ width: 20 }}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByTestId("chip").props.style).toMatchObject({
      opacity: 0.5,
    });
    expect(screen.getByLabelText("Remove").props.style).toMatchObject({
      width: 20,
    });
  });
});
