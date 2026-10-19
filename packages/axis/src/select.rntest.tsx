import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { act, useState } from "react";
import { Text } from "react-native";
import { PortalHost, Select, SelectItem } from "./index";

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
  onValueChange?: (value: string | string[]) => void;
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
    await render(
      <PortalHost>
        <FruitSelect />
      </PortalHost>,
    );
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
    await render(
      <PortalHost>
        <FruitSelect onOpenChange={(v) => changed.push(v)} />
      </PortalHost>,
    );
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
    const seen: Array<string | string[]> = [];
    const changed: boolean[] = [];
    await render(
      <PortalHost>
        <FruitSelect
          onValueChange={(v) => seen.push(v)}
          onOpenChange={(v) => changed.push(v)}
        />
      </PortalHost>,
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
    const seen: Array<string | string[]> = [];
    await render(
      <PortalHost>
        <FruitSelect onValueChange={(v) => seen.push(v)} />
      </PortalHost>,
    );
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
    const seen: Array<string | string[]> = [];
    const changed: boolean[] = [];
    await render(
      <PortalHost>
        <FruitSelect
          onValueChange={(v) => seen.push(v)}
          onOpenChange={(v) => changed.push(v)}
        />
      </PortalHost>,
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
      const [value, setValue] = useState<string | string[] | null>("apple");
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
    await render(
      <PortalHost>
        <Host />
      </PortalHost>,
    );
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
      <PortalHost>
        <FruitSelect open={false} onOpenChange={(v) => changed.push(v)} />
      </PortalHost>,
    );
    expect(screen.queryByRole("listbox")).toBeNull();
    await act(async () => {
      view.rerender(
        <PortalHost>
          <FruitSelect open onOpenChange={(v) => changed.push(v)} />
        </PortalHost>,
      );
    });
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByTestId("sel").props.accessibilityState).toMatchObject({
      expanded: true,
    });
    // Prop-driven changes never emit: the parent already owns the state.
    expect(changed).toEqual([]);
    await act(async () => {
      view.rerender(
        <PortalHost>
          <FruitSelect open={false} onOpenChange={(v) => changed.push(v)} />
        </PortalHost>,
      );
    });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(changed).toEqual([]);
  });

  it("disabled blocks the trigger: no open, no options, no callbacks", async () => {
    const seen: Array<string | string[]> = [];
    const changed: boolean[] = [];
    await render(
      <PortalHost>
        <FruitSelect
          disabled
          onValueChange={(v) => seen.push(v)}
          onOpenChange={(v) => changed.push(v)}
        />
      </PortalHost>,
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
  it("renders string placeholder and string item children without unexpected text node warning", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <PortalHost>
        <Select testID="str-sel" placeholder="Select an option">
          <SelectItem value="opt1" testID="opt1">
            Option 1
          </SelectItem>
        </Select>
      </PortalHost>,
    );
    expect(screen.getByText("Select an option")).toBeTruthy();
    await press("str-sel");
    expect(screen.getByText("Option 1")).toBeTruthy();
    await press("opt1");
    expect(screen.getByText("Option 1")).toBeTruthy();
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Unexpected text node"),
    );
    errorSpy.mockRestore();
  });
});

describe("Select multiple on React Native", () => {
  function FruitMultiSelect(props: {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string | string[]) => void;
  }) {
    // No `label` props: the joined trigger preserves each item's
    // styled label node (the readable-in-dark path the demo uses).
    return (
      <Select
        testID="multi"
        multiple
        placeholder={<Text>Pick fruits</Text>}
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
      >
        <SelectItem value="apple" testID="m-apple">
          <Text>Apple</Text>
        </SelectItem>
        <SelectItem value="mango" testID="m-mango">
          <Text>Mango</Text>
        </SelectItem>
      </Select>
    );
  }

  it("toggles items without closing and reports arrays", async () => {
    const seen: Array<string | string[]> = [];
    await render(
      <PortalHost>
        <FruitMultiSelect onValueChange={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await press("multi");
    await press("m-apple");
    // Choosing never dismisses in multiple mode.
    expect(screen.queryByRole("listbox")).toBeTruthy();
    expect(seen).toEqual([["apple"]]);
    await press("m-mango");
    expect(screen.queryByRole("listbox")).toBeTruthy();
    expect(seen).toEqual([["apple"], ["apple", "mango"]]);
    expect(
      screen.getByTestId("m-apple").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByTestId("m-mango").props.accessibilityState,
    ).toMatchObject({ selected: true });
  });

  it("deselecting removes the item and shows joined labels", async () => {
    const seen: Array<string | string[]> = [];
    await render(
      <PortalHost>
        <FruitMultiSelect
          defaultValue={["apple", "mango"]}
          onValueChange={(v) => seen.push(v)}
        />
      </PortalHost>,
    );
    await press("multi");
    // Joined selection shows in the trigger as separate label nodes
    // (not one text node), so scope the query to the trigger.
    const trigger = within(screen.getByTestId("multi"));
    expect(trigger.getByText("Apple")).toBeTruthy();
    expect(trigger.getByText("Mango")).toBeTruthy();
    await press("m-apple");
    expect(seen).toEqual([["mango"]]);
    // Trigger shows the joined label; the open list still shows the
    // matching item, so both render "Mango".
    expect(screen.getAllByText("Mango")).toHaveLength(2);
    // Empty selection falls back to the placeholder.
    await press("m-mango");
    expect(seen).toEqual([["mango"], []]);
    expect(screen.getByText("Pick fruits")).toBeTruthy();
  });

  it("controlled multiple follows the value array", async () => {
    const view = await render(
      <PortalHost>
        <FruitMultiSelect value={["mango"]} />
      </PortalHost>,
    );
    await press("multi");
    expect(
      screen.getByTestId("m-apple").props.accessibilityState,
    ).toMatchObject({ selected: false });
    expect(
      screen.getByTestId("m-mango").props.accessibilityState,
    ).toMatchObject({ selected: true });
    await act(async () => {
      view.rerender(
        <PortalHost>
          <FruitMultiSelect value={["apple", "mango"]} />
        </PortalHost>,
      );
    });
    // Joined parts render as separate nodes inside the trigger.
    const rerendered = within(screen.getByTestId("multi"));
    expect(rerendered.getByText("Apple")).toBeTruthy();
    expect(rerendered.getByText("Mango")).toBeTruthy();
  });
});
