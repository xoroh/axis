import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { View } from "react-native";
import { Combobox } from "./index";

/**
 * Combobox behavior through the public entry. Every assertion renders
 * the real composed component (Axis Input entry + toggle + positioned
 * option list) in the RN runtime and interacts through RN events —
 * closed placeholder display, toggle open with every option,
 * substring filtering on typing, option selection (query set, close,
 * value callback), disabled-option skip, scrim dismissal with query
 * reset, controlled value follow, query-clear restore, and root ref
 * forwarding are observed, not assumed.
 *
 * Test ids: the entry `Input` carries `testID`; the toggle carries
 * `<testID>-toggle`; the scrim carries `<testID>-scrim`; each option
 * carries `<testID>-option-<value>` (the `Accordion` `-panel`
 * precedent). Option roles use `role="option"` (verified present in
 * the RN 0.87 web `Role` union; the native `AccessibilityRole` union
 * has no `option` key).
 */

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "mango", label: "Mango", disabled: true },
];

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

async function typeQuery(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId("cbx"), text);
  });
}

describe("Combobox on React Native", () => {
  it("renders the entry with the placeholder and stays closed", async () => {
    await render(
      <Combobox options={FRUITS} testID="cbx" placeholder="Pick a fruit" />,
    );
    expect(screen.getByPlaceholderText("Pick a fruit")).toBeTruthy();
    expect(screen.getByLabelText("Show options")).toBeTruthy();
    expect(
      screen.getByTestId("cbx-toggle").props.accessibilityState,
    ).toMatchObject({ expanded: false, disabled: false });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("toggle opens the listbox with every option", async () => {
    const changed: boolean[] = [];
    await render(
      <Combobox
        options={FRUITS}
        testID="cbx"
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    await press("cbx-toggle");
    expect(changed).toEqual([true]);
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByLabelText("Hide options")).toBeTruthy();
    expect(
      screen.getByTestId("cbx-toggle").props.accessibilityState,
    ).toMatchObject({ expanded: true });
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(
      screen.getByTestId("cbx-option-apple").props.accessibilityState,
    ).toMatchObject({ selected: false, disabled: false });
    expect(
      screen.getByTestId("cbx-option-mango").props.accessibilityState,
    ).toMatchObject({ selected: false, disabled: true });
  });

  it("typing filters to matching labels and opens the list", async () => {
    const changed: boolean[] = [];
    await render(
      <Combobox
        options={FRUITS}
        testID="cbx"
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    expect(screen.queryByRole("listbox")).toBeNull();
    await typeQuery("ap");
    // First text change opens the list (the typing path — the Axis
    // Input exposes no focus API, so there is no focus-driven open).
    expect(changed).toEqual([true]);
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.queryByText("Banana")).toBeNull();
    expect(screen.queryByText("Mango")).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("option press selects, sets the query, closes, and fires", async () => {
    const seen: string[] = [];
    const changed: boolean[] = [];
    await render(
      <Combobox
        options={FRUITS}
        testID="cbx"
        onValueChange={(v) => seen.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    await press("cbx-toggle");
    await press("cbx-option-banana");
    expect(seen).toEqual(["banana"]);
    expect(changed).toEqual([true, false]);
    // Closed: the listbox and its options are gone, the entry shows the
    // chosen label as the query.
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByDisplayValue("Banana")).toBeTruthy();
    expect(
      screen.getByTestId("cbx-toggle").props.accessibilityState,
    ).toMatchObject({ expanded: false });
  });

  it("disabled option press selects nothing and stays open", async () => {
    const seen: string[] = [];
    const changed: boolean[] = [];
    await render(
      <Combobox
        options={FRUITS}
        testID="cbx"
        onValueChange={(v) => seen.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    await press("cbx-toggle");
    await press("cbx-option-mango");
    expect(seen).toEqual([]);
    expect(changed).toEqual([true]);
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("scrim dismisses without selecting and resets the query", async () => {
    const seen: string[] = [];
    const changed: boolean[] = [];
    await render(
      <Combobox
        options={FRUITS}
        testID="cbx"
        defaultValue="apple"
        onValueChange={(v) => seen.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    expect(screen.getByDisplayValue("Apple")).toBeTruthy();
    await press("cbx-toggle");
    await typeQuery("xyz");
    // Empty result renders the list container with zero items — no
    // "no results" chrome.
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    await press("cbx-scrim");
    expect(seen).toEqual([]);
    expect(changed).toEqual([true, false]);
    expect(screen.queryByRole("listbox")).toBeNull();
    // Stale filter text never lingers: the query is back to the
    // selected label.
    expect(screen.getByDisplayValue("Apple")).toBeTruthy();
  });

  it("follows the controlled value prop", async () => {
    function Host() {
      const [value, setValue] = useState<string | null>("apple");
      return (
        <Combobox
          options={FRUITS}
          testID="cbx"
          value={value}
          onValueChange={setValue}
        />
      );
    }
    await render(<Host />);
    expect(screen.getByDisplayValue("Apple")).toBeTruthy();
    await press("cbx-toggle");
    expect(
      screen.getByTestId("cbx-option-apple").props.accessibilityState,
    ).toMatchObject({ selected: true });
    // The open list filters on the selected label ("Apple"), so clear
    // the query to reveal every option before choosing.
    await typeQuery("");
    await press("cbx-option-banana");
    // Controlled follow: the parent state moved, the list closed, and
    // the entry now shows the new label.
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByTestId("cbx-option-banana")).toBeNull();
    expect(screen.getByDisplayValue("Banana")).toBeTruthy();
  });

  it("clearing the query shows every option again", async () => {
    await render(<Combobox options={FRUITS} testID="cbx" />);
    await press("cbx-toggle");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    await typeQuery("ap");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await typeQuery("");
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.getByText("Banana")).toBeTruthy();
    expect(screen.getByText("Mango")).toBeTruthy();
  });

  it("forwards a ref to the root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Combobox options={FRUITS} ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
