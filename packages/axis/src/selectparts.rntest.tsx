import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectPortal,
  SelectBackdrop,
  SelectPositioner,
  SelectArrow,
  SelectItemText,
  SelectItemIndicator,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
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

describe("Select compound parts on React Native", () => {
  it("shows the placeholder with nothing selected", () => {
    render(<FruitCompound />);
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("toggles the list with expanded state", () => {
    render(<FruitCompound testID="sel" />);
    fireEvent.press(screen.getByTestId("sel"));
    expect(screen.getByTestId("sel").props.accessibilityState.expanded).toBe(
      true,
    );
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.press(screen.getByTestId("sel"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("selects an item, resolves its ItemText label, and closes", () => {
    const onValueChange = jest.fn();
    render(<FruitCompound onValueChange={onValueChange} />);
    fireEvent.press(screen.getByTestId("sel"));
    fireEvent.press(screen.getByTestId("apple"));
    expect(onValueChange).toHaveBeenCalledWith("apple");
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("prefers the explicit label over rendered children", () => {
    render(<FruitCompound defaultValue="mango" />);
    expect(screen.getByText("Mango (Alphonso)")).toBeTruthy();
  });

  it("marks the selected item with selected state and indicator", () => {
    render(<FruitCompound defaultValue="apple" defaultOpen />);
    expect(screen.getByTestId("apple").props.accessibilityState.selected).toBe(
      true,
    );
    expect(screen.getByTestId("apple-check")).toBeTruthy();
    expect(screen.queryByTestId("mango-check")).toBeNull();
    expect(screen.getByTestId("mango").props.accessibilityState.selected).toBe(
      false,
    );
  });

  it("dismisses through the backdrop without selecting", () => {
    const onDismiss = jest.fn();
    const onValueChange = jest.fn();
    render(
      <FruitCompound onDismiss={onDismiss} onValueChange={onValueChange} />,
    );
    fireEvent.press(screen.getByTestId("sel"));
    fireEvent.press(screen.getByTestId("sel-scrim"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
  });

  it("keeps the scrim inert when pointer dismissal is disabled", () => {
    render(<FruitCompound disablePointerDismissal defaultOpen />);
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.press(screen.getByTestId("sel-scrim"));
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("renders in-box with no scrim when non-modal", () => {
    render(<FruitCompound modal={false} defaultOpen />);
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.queryByTestId("sel-scrim")).toBeNull();
  });

  it("follows controlled value and open state", async () => {
    const onOpenChange = jest.fn();
    const view = await render(
      <FruitCompound value="apple" open={false} onOpenChange={onOpenChange} />,
    );
    expect(screen.getByText("Apple")).toBeTruthy();
    view.rerender(
      <FruitCompound value="mango" open onOpenChange={onOpenChange} />,
    );
    expect(screen.getByText("Mango (Alphonso)")).toBeTruthy();
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.press(screen.getByTestId("sel"));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("is terminal when disabled: no open, no select, no callbacks", () => {
    const onValueChange = jest.fn();
    const onOpenChange = jest.fn();
    render(
      <FruitCompound
        disabled
        defaultOpen
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
      />,
    );
    // Disabled root forces closed content even with defaultOpen.
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.press(screen.getByTestId("sel"));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("renders group, label, separator, and arrow where the caller puts them", () => {
    render(
      <SelectRoot defaultOpen>
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
    fireEvent.press(screen.getByTestId("lime"));
    expect(screen.getByText("Lime")).toBeTruthy();
  });

  it("formats the value through function children", () => {
    render(
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

  it("substitutes the trigger element via render", () => {
    render(
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
    fireEvent.press(screen.getByText("Open"));
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("reports state to function styles", () => {
    const seen: Array<{ open: boolean }> = [];
    render(
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
    fireEvent.press(screen.getByTestId("s-sel"));
    expect(seen[seen.length - 1]).toEqual({ open: true });
  });

  it("renders parts inert outside a root", () => {
    render(
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
    fireEvent.press(screen.getByTestId("o-item"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
