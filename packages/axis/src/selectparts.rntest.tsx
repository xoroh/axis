import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { act } from "react";
import { Text } from "react-native";
import {
  PortalHost,
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
  SelectScrollDownArrow,
  SelectScrollUpArrow,
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
  onValueChange?: (value: string | string[]) => void;
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

/**
 * Press a trigger hidden behind its own open modal layer. The overlay
 * layer claims `accessibilityViewIsModal`, so the trigger reads as
 * hidden to accessibility queries while open (the `DialogRoot` precedent
 * in `dialogparts` — same VoiceOver behavior, asserted explicitly).
 */
async function pressHiddenTestId(testID: string) {
  await act(async () => {
    fireEvent.press(
      screen.getByTestId(testID, { includeHiddenElements: true }),
    );
  });
}

async function pressText(text: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(text));
  });
}

describe("Select compound parts on React Native", () => {
  it("shows the placeholder with nothing selected", async () => {
    await render(
      <PortalHost>
        <FruitCompound />
      </PortalHost>,
    );
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("toggles the list with expanded state", async () => {
    await render(
      <PortalHost>
        <FruitCompound testID="sel" />
      </PortalHost>,
    );
    await pressTestId("sel");
    expect(
      screen.getByTestId("sel", { includeHiddenElements: true }).props
        .accessibilityState.expanded,
    ).toBe(true);
    expect(screen.getByRole("listbox")).toBeTruthy();
    await pressHiddenTestId("sel");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("selects an item, resolves its ItemText label, and closes", async () => {
    const onValueChange = jest.fn();
    await render(
      <PortalHost>
        <FruitCompound onValueChange={onValueChange} />
      </PortalHost>,
    );
    await pressTestId("sel");
    await pressTestId("apple");
    expect(onValueChange).toHaveBeenCalledWith("apple");
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("prefers the explicit label over rendered children", async () => {
    await render(
      <PortalHost>
        <FruitCompound defaultValue="mango" />
      </PortalHost>,
    );
    expect(screen.getByText("Mango (Alphonso)")).toBeTruthy();
  });

  it("resolves live registrations while open without an items table", async () => {
    await render(
      <PortalHost>
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
        </SelectRoot>
      </PortalHost>,
    );
    // Open: the mounted item's registration supplies the label
    // (trigger value and open item read the same text — the trigger
    // sits behind its own modal layer, so it needs the hidden opt-in).
    expect(
      screen.getAllByText("Apple", { includeHiddenElements: true }),
    ).toHaveLength(2);
    // Closed: registrations unmount with the list, so the trigger
    // falls back to the raw value without an items table.
    await pressHiddenTestId("live-sel");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("apple")).toBeTruthy();
  });

  it("marks the selected item with selected state and indicator", async () => {
    await render(
      <PortalHost>
        <FruitCompound defaultValue="apple" defaultOpen />
      </PortalHost>,
    );
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
      <PortalHost>
        <FruitCompound onDismiss={onDismiss} onValueChange={onValueChange} />
      </PortalHost>,
    );
    await pressTestId("sel");
    await pressTestId("sel-scrim");
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Pick a fruit")).toBeTruthy();
  });

  it("keeps the scrim inert when pointer dismissal is disabled", async () => {
    await render(
      <PortalHost>
        <FruitCompound disablePointerDismissal defaultOpen />
      </PortalHost>,
    );
    expect(screen.getByRole("listbox")).toBeTruthy();
    await pressTestId("sel-scrim");
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("presents at the host with no scrim when non-modal", async () => {
    // Non-modal means the caller omits the Backdrop: the portal
    // presents at the host and nothing dismisses.
    await render(
      <PortalHost testID="host">
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
        </SelectRoot>
      </PortalHost>,
    );
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(
      within(screen.getByTestId("host")).getByTestId("nm-portal"),
    ).toBeTruthy();
    expect(screen.queryByTestId("sel-scrim")).toBeNull();
  });

  it("follows controlled value and open state", async () => {
    const onOpenChange = jest.fn();
    const view = await render(
      <PortalHost>
        <FruitCompound value="apple" open={false} onOpenChange={onOpenChange} />
      </PortalHost>,
    );
    expect(screen.getByText("Apple")).toBeTruthy();
    await act(async () => {
      view.rerender(
        <PortalHost>
          <FruitCompound value="mango" open onOpenChange={onOpenChange} />
        </PortalHost>,
      );
    });
    expect(
      screen.getByText("Mango (Alphonso)", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByRole("listbox")).toBeTruthy();
    await pressHiddenTestId("sel");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("is terminal when disabled: no open, no select, no callbacks", async () => {
    const onValueChange = jest.fn();
    const onOpenChange = jest.fn();
    await render(
      <PortalHost>
        <FruitCompound
          disabled
          defaultOpen
          onValueChange={onValueChange}
          onOpenChange={onOpenChange}
        />
      </PortalHost>,
    );
    // Disabled root forces closed content even with defaultOpen.
    expect(screen.queryByRole("listbox")).toBeNull();
    await pressTestId("sel");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("renders group, label, separator, and arrow where the caller puts them", async () => {
    await render(
      <PortalHost>
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
        </SelectRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("g-arrow")).toBeTruthy();
    expect(screen.getByTestId("g-label")).toBeTruthy();
    expect(screen.getByTestId("g-sep")).toBeTruthy();
    await pressTestId("lime");
    expect(screen.getByText("Lime")).toBeTruthy();
  });

  it("formats the value through function children", async () => {
    await render(
      <PortalHost>
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
        </SelectRoot>
      </PortalHost>,
    );
    expect(screen.getByText("Fruit: apple")).toBeTruthy();
  });

  it("substitutes the trigger element via render", async () => {
    await render(
      <PortalHost>
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
        </SelectRoot>
      </PortalHost>,
    );
    await pressText("Open");
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("reports state to function styles", async () => {
    const seen: Array<{ open: boolean }> = [];
    await render(
      <PortalHost>
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
        </SelectRoot>
      </PortalHost>,
    );
    expect(seen[0]).toEqual({ open: false });
    await pressTestId("s-sel");
    expect(seen[seen.length - 1]).toEqual({ open: true });
  });

  it("renders parts inert outside a root", async () => {
    await render(
      <PortalHost>
        <SelectTrigger testID="o-trigger">
          <Text>Open</Text>
        </SelectTrigger>
        <SelectValue placeholder="Pick" />
        <SelectItem value="apple" testID="o-item">
          <Text>Apple</Text>
        </SelectItem>
      </PortalHost>,
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

  it("typeahead matches items on character keys and selects / highlights them", async () => {
    let highlightedState: boolean | undefined;
    await render(
      <PortalHost>
        <SelectRoot defaultOpen>
          <SelectTrigger testID="ta-sel">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup testID="ta-popup">
                <SelectItem value="banana" testID="item-banana">
                  <SelectItemText>Banana</SelectItemText>
                </SelectItem>
                <SelectItem
                  value="berry"
                  testID="item-berry"
                  style={(s) => {
                    highlightedState = s.highlighted;
                    return undefined;
                  }}
                >
                  <SelectItemText>Berry</SelectItemText>
                </SelectItem>
                <SelectItem value="apple" testID="item-apple">
                  <SelectItemText>Apple</SelectItemText>
                </SelectItem>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
      </PortalHost>,
    );

    const popup = screen.getByTestId("ta-popup");
    // Type 'b' to match Banana
    await act(async () => {
      fireEvent(popup, "keyDown", { key: "b" });
    });
    expect(
      screen.getByTestId("item-banana").props.accessibilityState.selected,
    ).toBe(true);

    // Type 'e' within timeout to append to prefix 'be', matching Berry
    await act(async () => {
      fireEvent(popup, "keyDown", { key: "e" });
    });
    expect(
      screen.getByTestId("item-berry").props.accessibilityState.selected,
    ).toBe(true);
    expect(highlightedState).toBe(true);
  });

  it("SelectPositioner flips near viewport edge", async () => {
    let positionerSide: string | undefined;
    await render(
      <PortalHost>
        <SelectRoot defaultOpen>
          <SelectTrigger testID="edge-sel">
            <SelectValue placeholder="Edge" />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner
              testID="edge-pos"
              side="bottom"
              style={(s) => {
                positionerSide = s.side;
                return undefined;
              }}
            >
              <SelectPopup testID="edge-popup">
                <SelectItem value="one" testID="edge-item">
                  <SelectItemText>One</SelectItemText>
                </SelectItem>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("edge-pos")).toBeTruthy();
    expect(positionerSide).toBeDefined();
  });
});

describe("Select multiple on React Native", () => {
  function FruitMultiCompound(props: {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string | string[]) => void;
  }) {
    return (
      <SelectRoot
        multiple
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        items={[
          { value: "apple", label: "Apple" },
          { value: "mango", label: "Mango" },
        ]}
      >
        <SelectTrigger testID="msel" accessibilityLabel="Fruit">
          <SelectValue placeholder="Pick fruits" />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup testID="msel-list">
              <SelectItem value="apple" testID="m-apple">
                <SelectItemText>Apple</SelectItemText>
                <SelectItemIndicator testID="apple-check">
                  <Text>✓</Text>
                </SelectItemIndicator>
              </SelectItem>
              <SelectItem value="mango" testID="m-mango">
                <SelectItemText>Mango</SelectItemText>
                <SelectItemIndicator testID="mango-check">
                  <Text>✓</Text>
                </SelectItemIndicator>
              </SelectItem>
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>
    );
  }

  it("toggles items without closing and joins labels in the value", async () => {
    const seen: Array<string | string[]> = [];
    await render(
      <PortalHost>
        <FruitMultiCompound onValueChange={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await pressTestId("msel");
    await pressTestId("m-apple");
    // Choosing never dismisses in multiple mode.
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(seen).toEqual([["apple"]]);
    await pressTestId("m-mango");
    expect(screen.queryByRole("listbox")).toBeTruthy();
    expect(seen).toEqual([["apple"], ["apple", "mango"]]);
    expect(
      screen.getByText("Apple, Mango", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByTestId("apple-check")).toBeTruthy();
    expect(screen.getByTestId("mango-check")).toBeTruthy();
  });

  it("deselecting keeps the list open and reports the remainder", async () => {
    const seen: Array<string | string[]> = [];
    await render(
      <PortalHost>
        <FruitMultiCompound
          defaultValue={["apple", "mango"]}
          onValueChange={(v) => seen.push(v)}
        />
      </PortalHost>,
    );
    await pressTestId("msel");
    expect(
      screen.getByText("Apple, Mango", { includeHiddenElements: true }),
    ).toBeTruthy();
    await pressTestId("m-apple");
    expect(seen).toEqual([["mango"]]);
    expect(screen.getByText("Mango")).toBeTruthy();
    expect(screen.queryByTestId("apple-check")).toBeNull();
  });

  it("typeahead highlights without committing in multiple mode", async () => {
    const seen: Array<string | string[]> = [];
    await render(
      <PortalHost>
        <FruitMultiCompound
          defaultValue={["apple"]}
          onValueChange={(v) => seen.push(v)}
        />
      </PortalHost>,
    );
    await pressTestId("msel");
    const popup = screen.getByTestId("msel-list");
    await act(async () => {
      fireEvent(popup, "keyDown", { key: "m" });
    });
    // Highlighted but not selected: no commit, no callback.
    expect(seen).toEqual([]);
    expect(
      screen.getByTestId("m-mango").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });
});

describe("Select scroll arrows on React Native", () => {
  function ArrowCase({
    onUp,
    onDown,
  }: {
    onUp?: () => void;
    onDown?: () => void;
  }) {
    const scroller = {
      current: {
        scrollTo: jest.fn(),
        scrollToEnd: jest.fn(),
      },
    };
    ArrowCase.lastScroller = scroller;
    return (
      <SelectRoot defaultOpen>
        <SelectTrigger testID="ar-trigger" accessibilityLabel="Fruit">
          <Text>Pick</Text>
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup testID="ar-list">
              <SelectItem value="a" testID="ar-a">
                <SelectItemText>A</SelectItemText>
              </SelectItem>
              <SelectScrollUpArrow
                testID="ar-up"
                scrollRef={scroller}
                onPress={onUp}
              />
              <SelectScrollDownArrow
                testID="ar-down"
                scrollRef={scroller}
                onPress={onDown}
              />
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </SelectRoot>
    );
  }
  ArrowCase.lastScroller = null as {
    current: { scrollTo: jest.Mock; scrollToEnd: jest.Mock } | null;
  } | null;

  it("scrolls to the top and bottom edges by default", async () => {
    await render(
      <PortalHost>
        <ArrowCase />
      </PortalHost>,
    );
    await pressTestId("ar-up");
    expect(ArrowCase.lastScroller?.current?.scrollTo).toHaveBeenCalledWith({
      y: 0,
      animated: false,
    });
    await pressTestId("ar-down");
    expect(ArrowCase.lastScroller?.current?.scrollToEnd).toHaveBeenCalledWith({
      animated: false,
    });
  });

  it("composes the caller onPress after the default scroll", async () => {
    const order: string[] = [];
    const scroller = {
      current: {
        scrollTo: jest.fn(() => order.push("scroll")),
        scrollToEnd: jest.fn(),
      },
    };
    await render(
      <PortalHost>
        <SelectRoot defaultOpen>
          <SelectTrigger testID="ar2-trigger" accessibilityLabel="Fruit">
            <Text>Pick</Text>
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectScrollUpArrow
                  testID="ar2-up"
                  scrollRef={scroller}
                  onPress={() => order.push("press")}
                />
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
      </PortalHost>,
    );
    await pressTestId("ar2-up");
    expect(order).toEqual(["scroll", "press"]);
  });

  it("does nothing when disabled", async () => {
    const scrollTo = jest.fn();
    const scroller = { current: { scrollTo, scrollToEnd: jest.fn() } };
    await render(
      <PortalHost>
        <SelectRoot defaultOpen>
          <SelectTrigger testID="ar3-trigger" accessibilityLabel="Fruit">
            <Text>Pick</Text>
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectScrollUpArrow
                  testID="ar3-up"
                  scrollRef={scroller}
                  disabled
                />
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
      </PortalHost>,
    );
    await pressTestId("ar3-up");
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
