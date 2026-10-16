import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, useState } from "react";
import { Text } from "react-native";
import { Select, SelectItem } from "./index";

/**
 * Select behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN
 * events — closed placeholder display, trigger toggle with expanded
 * state, option selection with close + value callback, re-selection
 * stability (keeps, no repeat fire), scrim dismissal without
 * selecting, controlled value/open tracking, and disabled terminality
 * are observed, not assumed.
 *
 * The trigger carries `testID`; the scrim carries `<testID>-scrim`
 * (the `Accordion` `-panel` precedent). Item roles use `role="option"`
 * (verified present in the RN 0.87 web `Role` union; the native
 * `AccessibilityRole` union has no `option` key).
 */

function FruitSelect(props: {
  testID?: string;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const {
    testID = "sel",
    disabled,
    open,
    defaultOpen,
    onValueChange,
    onOpenChange,
  } = props;
  return (
    <Select
      testID={testID}
      placeholder={<Text>Pick a fruit</Text>}
      disabled={disabled}
      open={open}
      defaultOpen={defaultOpen}
      onValueChange={onValueChange}
      onOpenChange={onOpenChange}
    >
      <SelectItem value="apple" testID="apple">
        <Text>Apple</Text>
      </SelectItem>
      <SelectItem value="mango" testID="mango">
        <Text>Mango</Text>
      </SelectItem>
    </Select>
  );
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Select on React Native", () => {
  it("closed shows the trigger with the placeholder and no listbox", async () => {
    await render(<FruitSelect />);
    expect(screen.getByTestId("sel")).toBeTruthy();
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByTestId("sel").props.accessibilityState).toMatchObject({
      expanded: false,
      disabled: false,
    });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("trigger press opens the listbox with unselected options", async () => {
    const changed: boolean[] = [];
    await render(<FruitSelect onOpenChange={(v) => changed.push(v)} />);
    await press("sel");
    expect(changed).toEqual([true]);
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByTestId("sel").props.accessibilityState).toMatchObject({
      expanded: true,
    });
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByTestId("apple").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: false,
    });
    expect(screen.getByTestId("mango").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: false,
    });
  });

  it("option press selects, closes, and fires the value", async () => {
    const seen: string[] = [];
    const changed: boolean[] = [];
    await render(
      <FruitSelect
        onValueChange={(v) => seen.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    await press("sel");
    await press("mango");
    expect(seen).toEqual(["mango"]);
    expect(changed).toEqual([true, false]);
    // Closed: the listbox and its options are gone, the trigger shows
    // the chosen label instead of the placeholder.
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Mango")).toBeTruthy();
    expect(screen.queryByText("Pick a fruit")).toBeNull();
    expect(screen.getByTestId("sel").props.accessibilityState).toMatchObject({
      expanded: false,
    });
  });

  it("re-pressing the selected item keeps it with no extra fire", async () => {
    const seen: string[] = [];
    await render(<FruitSelect onValueChange={(v) => seen.push(v)} />);
    await press("sel");
    await press("apple");
    expect(seen).toEqual(["apple"]);
    // Re-open and activate the already-selected item: selection holds,
    // the callback does not repeat, and the list still closes.
    await press("sel");
    expect(screen.getByTestId("apple").props.accessibilityState).toMatchObject({
      selected: true,
    });
    await press("apple");
    expect(seen).toEqual(["apple"]);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Apple")).toBeTruthy();
  });

  it("scrim press dismisses without selecting", async () => {
    const seen: string[] = [];
    const changed: boolean[] = [];
    await render(
      <FruitSelect
        onValueChange={(v) => seen.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    await press("sel");
    expect(screen.getByRole("listbox")).toBeTruthy();
    await press("sel-scrim");
    expect(seen).toEqual([]);
    expect(changed).toEqual([true, false]);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
  });

  it("follows the controlled value prop", async () => {
    function Host() {
      const [value, setValue] = useState<string | null>("apple");
      return (
        <Select testID="sel" value={value} onValueChange={setValue}>
          <SelectItem value="apple" testID="apple">
            <Text>Apple</Text>
          </SelectItem>
          <SelectItem value="mango" testID="mango">
            <Text>Mango</Text>
          </SelectItem>
        </Select>
      );
    }
    await render(<Host />);
    expect(screen.getByText("Apple")).toBeTruthy();
    await press("sel");
    expect(screen.getByTestId("apple").props.accessibilityState).toMatchObject({
      selected: true,
    });
    await press("mango");
    // Controlled follow: the parent state moved, the list closed, and
    // the trigger now shows the new label (options unmounted).
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByTestId("mango")).toBeNull();
    expect(screen.getByText("Mango")).toBeTruthy();
    expect(screen.queryByText("Apple")).toBeNull();
  });

  it("follows the controlled open prop", async () => {
    const changed: boolean[] = [];
    const view = await render(
      <FruitSelect open={false} onOpenChange={(v) => changed.push(v)} />,
    );
    expect(screen.queryByRole("listbox")).toBeNull();
    await act(async () => {
      view.rerender(<FruitSelect open onOpenChange={(v) => changed.push(v)} />);
    });
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByTestId("sel").props.accessibilityState).toMatchObject({
      expanded: true,
    });
    // Prop-driven changes never emit: the parent already owns the state.
    expect(changed).toEqual([]);
    await act(async () => {
      view.rerender(
        <FruitSelect open={false} onOpenChange={(v) => changed.push(v)} />,
      );
    });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(changed).toEqual([]);
  });

  it("disabled blocks the trigger: no open, no options, no callbacks", async () => {
    const seen: string[] = [];
    const changed: boolean[] = [];
    await render(
      <FruitSelect
        disabled
        onValueChange={(v) => seen.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    expect(screen.getByTestId("sel").props.accessibilityState).toMatchObject({
      expanded: false,
      disabled: true,
    });
    await press("sel");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByText("Pick a fruit")).toBeTruthy();
    expect(seen).toEqual([]);
    expect(changed).toEqual([]);
  });
});
