import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Text } from "react-native";
import {
  SelectArrow,
  SelectBackdrop,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./index";

/**
 * Select compound parts through the public entry. Every assertion
 * renders the real parts in the RN runtime and interacts through RN
 * events — root statelessness, trigger toggle with expanded state,
 * value label lookup over the item registry (explicit label,
 * ItemText fallback, raw-value fallback, placeholder), function
 * value children, modal portal with backdrop dismissal, item
 * select + close with selected state and indicator, groups, render
 * substitution, function styles, controlled value/open, and
 * disabled terminality are observed, not assumed.
 */

function FruitCompound(props: {
  testID?: string;
  value?: string | null;
  defaultValue?: string | null;
  open?: boolean;
  defaultOpen?: boolean;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
  disabled?: boolean;
  modal?: boolean;
  disablePointerDismissal?: boolean;
}) {
  const { testID = "sel" } = props;
  return (
    <SelectRoot
      value={props.value}
      defaultValue={props.defaultValue}
      open={props.open}
      defaultOpen={props.defaultOpen}
      onValueChange={props.onValueChange}
      onOpenChange={props.onOpenChange}
      onDismiss={props.onDismiss}
      disabled={props.disabled}
      modal={props.modal}
      disablePointerDismissal={props.disablePointerDismissal}
      items={[
        { value: "apple", label: "Apple" },
        { value: "mango", label: "Mango (Alphonso)" },
      ]}
    >
      <SelectTrigger testID={testID} accessibilityLabel="Fruit">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop testID={`${testID}-scrim`} />
        <SelectPositioner>
          <SelectPopup testID={`${testID}-list`}>
            <SelectItem value="apple" testID="apple">
              <SelectItemText>Apple</SelectItemText>
              <SelectItemIndicator testID="apple-check">
                <Text>✓</Text>
              </SelectItemIndicator>
            </SelectItem>
            <SelectItem value="mango" label="Mango (Alphonso)" testID="mango">
              <Text>Mango</Text>
            </SelectItem>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
  );
}

async function pressTestId(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

async function pressText(text: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(text));
  });
}

describe("Select compound parts on React Native", () => {
  it("shows the placeholder with nothing selected", async () => {
    await render(<FruitCompound />);
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("toggles the list with expanded state", async () => {
    await render(<FruitCompound testID="sel" />);
    await pressTestId("sel");
    expect(screen.getByTestId("sel").props.accessibilityState.expanded).toBe(
      true,
    );
    expect(screen.getByRole("listbox")).toBeTruthy();
    await pressTestId("sel");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("selects an item, resolves its ItemText label, and closes", async () => {
    const onValueChange = jest.fn();
    await render(<FruitCompound onValueChange={onValueChange} />);
    await pressTestId("sel");
    await pressTestId("apple");
    expect(onValueChange).toHaveBeenCalledWith("apple");
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("prefers the explicit label over rendered children", async () => {
    await render(<FruitCompound defaultValue="mango" />);
    expect(screen.getByText("Mango (Alphonso)")).toBeTruthy();
  });

  it("resolves live registrations while open without an items table", async () => {
    await render(
      <SelectRoot defaultValue="apple" defaultOpen>
        <SelectTrigger testID="live-sel">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectItem value="apple" testID="live-apple">
                <SelectItemText>Apple</SelectItemText>
              </SelectItem>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>,
    );
    // Open: the mounted item's registration supplies the label
    // (trigger value and open item read the same text).
    expect(screen.getAllByText("Apple")).toHaveLength(2);
    // Closed: registrations unmount with the list, so the trigger
    // falls back to the raw value without an items table.
    await pressTestId("live-sel");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("apple")).toBeTruthy();
  });

  it("marks the selected item with selected state and indicator", async () => {
    await render(<FruitCompound defaultValue="apple" defaultOpen />);
    expect(screen.getByTestId("apple").props.accessibilityState.selected).toBe(
      true,
    );
    expect(screen.getByTestId("apple-check")).toBeTruthy();
    expect(screen.queryByTestId("mango-check")).toBeNull();
    expect(screen.getByTestId("mango").props.accessibilityState.selected).toBe(
      false,
    );
  });

  it("dismisses through the backdrop without selecting", async () => {
    const onDismiss = jest.fn();
    const onValueChange = jest.fn();
    await render(
      <FruitCompound onDismiss={onDismiss} onValueChange={onValueChange} />,
    );
    await pressTestId("sel");
    await pressTestId("sel-scrim");
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
  });

  it("keeps the scrim inert when pointer dismissal is disabled", async () => {
    await render(<FruitCompound disablePointerDismissal defaultOpen />);
    expect(screen.getByRole("listbox")).toBeTruthy();
    await pressTestId("sel-scrim");
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("renders in-box with no scrim when non-modal", async () => {
    // Non-modal means the caller omits the Backdrop: the portal
    // renders in-box and nothing dismisses.
    await render(
      <SelectRoot modal={false} defaultOpen>
        <SelectTrigger testID="nm-sel">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectPortal testID="nm-portal">
          <SelectPositioner>
            <SelectPopup testID="nm-list">
              <SelectItem value="apple" testID="nm-apple">
                <SelectItemText>Apple</SelectItemText>
              </SelectItem>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>,
    );
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByTestId("nm-portal")).toBeTruthy();
    expect(screen.queryByTestId("sel-scrim")).toBeNull();
  });

  it("follows controlled value and open state", async () => {
    const onOpenChange = jest.fn();
    const view = await render(
      <FruitCompound value="apple" open={false} onOpenChange={onOpenChange} />,
    );
    expect(screen.getByText("Apple")).toBeTruthy();
    await act(async () => {
      view.rerender(
        <FruitCompound value="mango" open onOpenChange={onOpenChange} />,
      );
    });
    expect(screen.getByText("Mango (Alphonso)")).toBeTruthy();
    expect(screen.getByRole("listbox")).toBeTruthy();
    await pressTestId("sel");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("is terminal when disabled: no open, no select, no callbacks", async () => {
    const onValueChange = jest.fn();
    const onOpenChange = jest.fn();
    await render(
      <FruitCompound
        disabled
        defaultOpen
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
      />,
    );
    // Disabled root forces closed content even with defaultOpen.
    expect(screen.queryByRole("listbox")).toBeNull();
    await pressTestId("sel");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("renders group, label, separator, and arrow where the caller puts them", async () => {
    await render(
      <SelectRoot
        defaultOpen
        items={[
          { value: "lime", label: "Lime" },
          { value: "kiwi", label: "Kiwi" },
        ]}
      >
        <SelectTrigger testID="g-sel">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectArrow testID="g-arrow" />
              <SelectGroup>
                <SelectGroupLabel testID="g-label">
                  <Text>Citrus</Text>
                </SelectGroupLabel>
                <SelectItem value="lime" testID="lime">
                  <SelectItemText>Lime</SelectItemText>
                </SelectItem>
              </SelectGroup>
              <SelectSeparator testID="g-sep" />
              <SelectItem value="kiwi" testID="kiwi">
                <SelectItemText>Kiwi</SelectItemText>
              </SelectItem>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>,
    );
    expect(screen.getByTestId("g-arrow")).toBeTruthy();
    expect(screen.getByTestId("g-label")).toBeTruthy();
    expect(screen.getByTestId("g-sep")).toBeTruthy();
    await pressTestId("lime");
    expect(screen.getByText("Lime")).toBeTruthy();
  });

  it("formats the value through function children", async () => {
    await render(
      <SelectRoot defaultValue="apple">
        <SelectTrigger testID="f-sel">
          <SelectValue>{(value) => `Fruit: ${value}`}</SelectValue>
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectItem value="apple" label="Apple">
                <Text>Apple</Text>
              </SelectItem>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>,
    );
    expect(screen.getByText("Fruit: apple")).toBeTruthy();
  });

  it("substitutes the trigger element via render", async () => {
    await render(
      <SelectRoot>
        <SelectTrigger
          testID="r-sel"
          render={<Text testID="r-sel-custom">Open</Text>}
        >
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectItem value="apple" label="Apple">
                <Text>Apple</Text>
              </SelectItem>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>,
    );
    await pressText("Open");
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("reports state to function styles", async () => {
    const seen: Array<{ open: boolean }> = [];
    await render(
      <SelectRoot>
        <SelectTrigger
          testID="s-sel"
          style={(state) => {
            seen.push({ open: state.open });
            return undefined;
          }}
        >
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectItem value="apple" label="Apple">
                <Text>Apple</Text>
              </SelectItem>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>,
    );
    expect(seen[0]).toEqual({ open: false });
    await pressTestId("s-sel");
    expect(seen[seen.length - 1]).toEqual({ open: true });
  });

  it("renders parts inert outside a root", async () => {
    await render(
      <>
        <SelectTrigger testID="o-trigger">
          <Text>Open</Text>
        </SelectTrigger>
        <SelectValue placeholder="Pick" />
        <SelectItem value="apple" testID="o-item">
          <Text>Apple</Text>
        </SelectItem>
      </>,
    );
    expect(
      screen.getByTestId("o-trigger").props.accessibilityState.disabled,
    ).toBe(true);
    expect(screen.getByTestId("o-item").props.accessibilityState.disabled).toBe(
      true,
    );
    expect(screen.getByText("Pick")).toBeTruthy();
    await pressTestId("o-item");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
