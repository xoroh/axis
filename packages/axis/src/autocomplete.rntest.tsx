import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, type Ref, useState } from "react";
import type { View } from "react-native";
import { Autocomplete } from "./index";

/**
 * Autocomplete behavior through the public entry. Every assertion
 * renders the real component in the RN runtime and interacts through
 * RN events — closed entry with toggle, type-to-open with
 * case-insensitive substring filtering, option-press commit (text set
 * + both callbacks + close), submit commit, scrim dismissal without
 * committing, controlled value tracking, disabled terminality, and
 * root ref forwarding are observed, not assumed.
 *
 * Options are commit actions (`accessibilityRole="button"`, no
 * selected state), NOT a selection set — so the suite queries them by
 * text and never asserts `option`/`listbox` roles. The scrim carries
 * `<testID>-scrim` (the Accordion `-panel` precedent).
 */

const OPTIONS = ["apple", "mango", "apricot"] as const;

function Harness(props: {
  testID?: string;
  value?: string;
  defaultValue?: string;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onValueChange?: (text: string) => void;
  onCommit?: (text: string) => void;
  onOpenChange?: (open: boolean) => void;
  ref?: Ref<ElementRef<typeof View>>;
}) {
  const {
    testID = "ac",
    value,
    defaultValue,
    open,
    defaultOpen,
    disabled,
    placeholder = "Type a fruit",
    onValueChange,
    onCommit,
    onOpenChange,
    ref,
  } = props;
  return (
    <Autocomplete
      testID={testID}
      options={[...OPTIONS]}
      value={value}
      defaultValue={defaultValue}
      open={open}
      defaultOpen={defaultOpen}
      disabled={disabled}
      placeholder={placeholder}
      onValueChange={onValueChange}
      onCommit={onCommit}
      onOpenChange={onOpenChange}
      ref={ref}
    />
  );
}

async function type(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText("Type a fruit"), text);
  });
}

async function pressByText(text: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(text));
  });
}

async function pressByTestId(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Autocomplete on React Native", () => {
  it("renders the entry closed with the toggle and no suggestions", async () => {
    await render(<Harness />);
    expect(screen.getByPlaceholderText("Type a fruit")).toBeTruthy();
    expect(screen.getByLabelText("Show suggestions")).toBeTruthy();
    expect(
      screen.getByLabelText("Show suggestions").props.accessibilityState,
    ).toMatchObject({ expanded: false, disabled: false });
    expect(screen.queryByText("apple")).toBeNull();
    expect(screen.queryByText("mango")).toBeNull();
    expect(screen.queryByText("apricot")).toBeNull();
  });

  it("typing opens the list filtered by case-insensitive substring", async () => {
    const changed: boolean[] = [];
    await render(<Harness onOpenChange={(v) => changed.push(v)} />);
    await type("AP");
    expect(changed).toEqual([true]);
    expect(screen.getByLabelText("Hide suggestions")).toBeTruthy();
    expect(screen.getByText("apple")).toBeTruthy();
    expect(screen.getByText("apricot")).toBeTruthy();
    expect(screen.queryByText("mango")).toBeNull();
  });

  it("option press sets the text, fires both callbacks, and closes", async () => {
    const seen: string[] = [];
    const committed: string[] = [];
    const changed: boolean[] = [];
    await render(
      <Harness
        onValueChange={(v) => seen.push(v)}
        onCommit={(v) => committed.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    await type("ap");
    await pressByText("apple");
    expect(seen).toEqual(["ap", "apple"]);
    expect(committed).toEqual(["apple"]);
    expect(changed).toEqual([true, false]);
    expect(screen.getByDisplayValue("apple")).toBeTruthy();
    // Closed: suggestions unmount, the toggle flips back.
    expect(screen.queryByText("apricot")).toBeNull();
    expect(screen.getByLabelText("Show suggestions")).toBeTruthy();
  });

  it("submit fires onCommit with the current text and closes", async () => {
    const committed: string[] = [];
    const seen: string[] = [];
    await render(
      <Harness
        defaultValue="Ada"
        onValueChange={(v) => seen.push(v)}
        onCommit={(v) => committed.push(v)}
      />,
    );
    await type("Ada Lovelace");
    await act(async () => {
      fireEvent(screen.getByPlaceholderText("Type a fruit"), "submitEditing");
    });
    // Free text commits even though it matches no option.
    expect(committed).toEqual(["Ada Lovelace"]);
    expect(seen).toEqual(["Ada Lovelace"]);
    expect(screen.getByLabelText("Show suggestions")).toBeTruthy();
    expect(screen.queryByText("apple")).toBeNull();
  });

  it("scrim dismisses without committing", async () => {
    const committed: string[] = [];
    const changed: boolean[] = [];
    await render(
      <Harness
        onCommit={(v) => committed.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    await type("ap");
    expect(screen.getByText("apple")).toBeTruthy();
    await pressByTestId("ac-scrim");
    expect(committed).toEqual([]);
    expect(changed).toEqual([true, false]);
    expect(screen.queryByText("apple")).toBeNull();
    expect(screen.getByLabelText("Show suggestions")).toBeTruthy();
    // The typed text survives dismissal (dismissal is not a reset).
    expect(screen.getByDisplayValue("ap")).toBeTruthy();
  });

  it("follows the controlled value prop", async () => {
    function Host() {
      const [text, setText] = useState("mango");
      return <Harness value={text} onValueChange={setText} />;
    }
    const view = await render(<Host />);
    expect(screen.getByDisplayValue("mango")).toBeTruthy();
    await type("apple");
    // Controlled follow: the parent state moved, so the entry shows it.
    expect(screen.getByDisplayValue("apple")).toBeTruthy();
    await act(async () => {
      view.rerender(<Harness value="apricot" />);
    });
    expect(screen.getByDisplayValue("apricot")).toBeTruthy();
  });

  it("disabled blocks typing, toggle, and commit: no state, no callbacks", async () => {
    const seen: string[] = [];
    const committed: string[] = [];
    const changed: boolean[] = [];
    await render(
      <Harness
        disabled
        onValueChange={(v) => seen.push(v)}
        onCommit={(v) => committed.push(v)}
        onOpenChange={(v) => changed.push(v)}
      />,
    );
    expect(
      screen.getByLabelText("Show suggestions").props.accessibilityState,
    ).toMatchObject({ expanded: false, disabled: true });
    await type("ap");
    expect(seen).toEqual([]);
    expect(changed).toEqual([]);
    expect(screen.queryByText("apple")).toBeNull();
    await pressByText("Show suggestions");
    expect(changed).toEqual([]);
    expect(screen.queryByText("apple")).toBeNull();
    expect(committed).toEqual([]);
  });

  it("forwards a ref to the root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Harness ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
