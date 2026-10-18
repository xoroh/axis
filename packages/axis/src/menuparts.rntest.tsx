import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Pressable, Text as RNText, type View } from "react-native";
import {
  MenuArrow,
  MenuBackdrop,
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRadioItemIndicator,
  MenuRoot,
  MenuSeparator,
  MenuSubmenuContent,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  MenuTrigger,
} from "./index";

/**
 * Menu compound parts through the public entry. Root state ownership
 * with no host element, trigger open/expanded, portal as the native
 * host, backdrop dismissal (and its disable), measured positioner
 * placement, popup with items and separator, item onSelect/onClick
 * ordering with closeOnClick, render substitution with state, and
 * function styles — observed in the RN runtime. The inline `Menu`
 * keeps its own suite; this suite proves the compound anatomy only.
 */

function Compound({ onOpen }: { onOpen?: (open: boolean) => void }) {
  return (
    <MenuRoot onOpenChange={onOpen}>
      <MenuTrigger accessibilityLabel="Open menu">
        <RNText>Open</RNText>
      </MenuTrigger>
      <MenuPortal>
        <MenuBackdrop testID="menu-backdrop" />
        <MenuPositioner testID="menu-positioner">
          <MenuPopup testID="menu-popup">
            <MenuItem value="new" testID="item-new" onSelect={() => {}}>
              <RNText>New</RNText>
            </MenuItem>
            <MenuSeparator testID="menu-sep" />
            <MenuItem testID="item-about">
              <RNText>About</RNText>
            </MenuItem>
          </MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </MenuRoot>
  );
}

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("Menu compound parts on React Native", () => {
  it("renders the trigger only while closed (root owns state, renders no element)", async () => {
    await render(<Compound />);
    expect(screen.getByLabelText("Open menu")).toBeTruthy();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByTestId("menu-popup")).toBeNull();
  });

  it("opens the popup with items and separator", async () => {
    const seen: boolean[] = [];
    await render(<Compound onOpen={(v) => seen.push(v)} />);
    await pressLabel("Open menu");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByTestId("menu-sep")).toBeTruthy();
    expect(
      screen.getByLabelText("Open menu").props.accessibilityState,
    ).toMatchObject({ expanded: true });
  });

  it("selects by value, then clicks, then closes", async () => {
    const order: string[] = [];
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuItem
                value="new"
                testID="item-new"
                onSelect={(v) => order.push(`select:${v}`)}
                onClick={() => order.push("click")}
              >
                <RNText>New</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await act(async () => {
      fireEvent.press(screen.getByText("New"));
    });
    expect(order).toEqual(["select:new", "click"]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("stays open when closeOnClick is false", async () => {
    const seen: string[] = [];
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuItem
                value="pin"
                closeOnClick={false}
                onSelect={(v) => seen.push(v)}
              >
                <RNText>Pin</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await act(async () => {
      fireEvent.press(screen.getByText("Pin"));
    });
    expect(seen).toEqual(["pin"]);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("dismisses through the backdrop with onDismiss first", async () => {
    const order: string[] = [];
    await render(
      <MenuRoot
        defaultOpen
        onDismiss={() => order.push("dismiss")}
        onOpenChange={() => order.push("change")}
      >
        <MenuPortal>
          <MenuBackdrop testID="menu-backdrop" />
          <MenuPositioner>
            <MenuPopup testID="menu-popup" />
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await pressLabel("Dismiss menu");
    expect(order).toEqual(["dismiss", "change"]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("renders an inert backdrop when pointer dismissal is disabled", async () => {
    await render(
      <MenuRoot defaultOpen disablePointerDismissal>
        <MenuPortal>
          <MenuBackdrop testID="menu-backdrop" />
          <MenuPositioner>
            <MenuPopup testID="menu-popup" />
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(screen.queryByLabelText("Dismiss menu")).toBeNull();
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("substitutes the trigger element via render element", async () => {
    const seen: boolean[] = [];
    await render(
      <MenuRoot onOpenChange={(v) => seen.push(v)}>
        <MenuTrigger
          render={
            <Pressable
              testID="custom-trigger"
              accessibilityLabel="Custom open"
            />
          }
        />
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup" />
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await pressLabel("Custom open");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("calls function render with (props, state)", async () => {
    const states: Array<{ open: boolean; disabled: boolean }> = [];
    await render(
      <MenuRoot defaultOpen>
        <MenuTrigger
          render={(_props, state) => {
            states.push(state);
            return null;
          }}
        />
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup" />
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(states).toEqual([{ open: true, disabled: false }]);
  });

  it("reports highlighted press state to function styles", async () => {
    const seen: Array<{ disabled: boolean; highlighted: boolean }> = [];
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuItem
                value="x"
                testID="item-x"
                style={(state) => {
                  seen.push(state);
                  return undefined;
                }}
              >
                <RNText>X</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    const item = screen.getByTestId("item-x");
    await act(async () => {
      fireEvent(item, "pressIn");
    });
    expect(seen).toContainEqual({ disabled: false, highlighted: true });
    await act(async () => {
      fireEvent(item, "pressOut");
    });
    expect(seen).toContainEqual({ disabled: false, highlighted: false });
  });

  it("follows controlled open state", async () => {
    await render(
      <MenuRoot open={false}>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup" />
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(screen.queryByTestId("menu-popup")).toBeNull();
  });

  it("renders parts inert outside a root", async () => {
    await render(
      <>
        <MenuTrigger
          accessibilityLabel="Orphan trigger"
          testID="orphan-trigger"
        >
          <RNText>Orphan</RNText>
        </MenuTrigger>
        <MenuItem value="orphan" testID="orphan-item">
          <RNText>Orphan item</RNText>
        </MenuItem>
      </>,
    );
    expect(
      screen.getByTestId("orphan-trigger").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByTestId("orphan-item").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("forwards a ref to the popup", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup" ref={ref} />
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(ref.current).toBeTruthy();
  });
});

describe("Menu group, link, arrow, and non-modal parts", () => {
  it("renders group label with items", async () => {
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup">
              <MenuGroup testID="group">
                <MenuGroupLabel testID="group-label">Sort</MenuGroupLabel>
                <MenuItem value="date">
                  <RNText>Date</RNText>
                </MenuItem>
              </MenuGroup>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(screen.getByTestId("group")).toBeTruthy();
    expect(screen.getByText("Sort")).toBeTruthy();
    expect(screen.getByText("Date")).toBeTruthy();
  });

  it("activates link items with the link role and closes", async () => {
    const order: string[] = [];
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuLinkItem
                value="docs"
                testID="link-docs"
                onSelect={(v) => order.push(`select:${v}`)}
                onClick={() => order.push("click")}
              >
                <RNText>Docs</RNText>
              </MenuLinkItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(screen.getByRole("link", { name: "Docs" })).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText("Docs"));
    });
    expect(order).toEqual(["select:docs", "click"]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("renders the arrow marker where the caller puts it", async () => {
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup">
              <MenuArrow testID="menu-arrow" />
              <MenuItem value="x">
                <RNText>X</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(screen.getByTestId("menu-arrow")).toBeTruthy();
  });

  it("non-modal menus render in-box with no scrim and toggle closed", async () => {
    const seen: boolean[] = [];
    await render(
      <MenuRoot modal={false} onOpenChange={(v) => seen.push(v)}>
        <MenuTrigger accessibilityLabel="Open menu">
          <RNText>Open</RNText>
        </MenuTrigger>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup">
              <MenuItem value="x">
                <RNText>X</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await pressLabel("Open menu");
    expect(seen).toEqual([true]);
    expect(screen.queryByLabelText("Dismiss menu")).toBeNull();
    expect(screen.getByTestId("menu-popup")).toBeTruthy();
    await pressLabel("Open menu");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByTestId("menu-popup")).toBeNull();
  });

  it("non-modal menus still close on item select", async () => {
    await render(
      <MenuRoot modal={false} defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup">
              <MenuItem value="x">
                <RNText>X</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await act(async () => {
      fireEvent.press(screen.getByText("X"));
    });
    expect(screen.queryByTestId("menu-popup")).toBeNull();
  });
});

describe("Menu checkbox and radio items", () => {
  function SettingsMenu({ onCheck }: { onCheck?: (checked: boolean) => void }) {
    return (
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup">
              <MenuCheckboxItem
                testID="item-minimap"
                defaultChecked={false}
                onCheckedChange={(v) => onCheck?.(v)}
              >
                <MenuCheckboxItemIndicator testID="minimap-check">
                  <RNText>✓</RNText>
                </MenuCheckboxItemIndicator>
                <RNText>Minimap</RNText>
              </MenuCheckboxItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>
    );
  }

  it("toggles unchecked state, reports, shows the indicator, and stays open", async () => {
    const seen: boolean[] = [];
    await render(<SettingsMenu onCheck={(v) => seen.push(v)} />);
    expect(screen.queryByTestId("minimap-check")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByText("Minimap"));
    });
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("minimap-check")).toBeTruthy();
    expect(
      screen.getByTestId("item-minimap").props.accessibilityState,
    ).toMatchObject({ checked: true });
    // closeOnClick defaults to false: settings toggles stay open.
    expect(screen.getByRole("menu")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText("Minimap"));
    });
    expect(seen).toEqual([true, false]);
    expect(screen.queryByTestId("minimap-check")).toBeNull();
  });

  it("closes when closeOnClick is set", async () => {
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup">
              <MenuCheckboxItem closeOnClick testID="item-once">
                <RNText>Once</RNText>
              </MenuCheckboxItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await act(async () => {
      fireEvent.press(screen.getByText("Once"));
    });
    expect(screen.queryByTestId("menu-popup")).toBeNull();
  });

  it("follows controlled checked state", async () => {
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuCheckboxItem checked testID="item-on">
                <RNText>On</RNText>
              </MenuCheckboxItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(
      screen.getByTestId("item-on").props.accessibilityState,
    ).toMatchObject({ checked: true });
  });

  it("keeps disabled checkbox items unchecked and silent", async () => {
    const seen: boolean[] = [];
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuCheckboxItem
                testID="item-off"
                disabled
                onCheckedChange={(v) => seen.push(v)}
              >
                <RNText>Off</RNText>
              </MenuCheckboxItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await act(async () => {
      fireEvent.press(screen.getByText("Off"));
    });
    expect(seen).toEqual([]);
    expect(
      screen.getByTestId("item-off").props.accessibilityState,
    ).toMatchObject({ checked: false, disabled: true });
  });

  function SortMenu({ onPick }: { onPick?: (value: string) => void }) {
    return (
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="menu-popup">
              <MenuRadioGroup onValueChange={onPick}>
                <MenuRadioItem value="date" testID="item-date">
                  <MenuRadioItemIndicator testID="date-dot">
                    <RNText>•</RNText>
                  </MenuRadioItemIndicator>
                  <RNText>Date</RNText>
                </MenuRadioItem>
                <MenuRadioItem value="name" testID="item-name">
                  <RNText>Name</RNText>
                </MenuRadioItem>
              </MenuRadioGroup>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>
    );
  }

  it("selects a radio option, reports, and closes", async () => {
    const seen: string[] = [];
    await render(<SortMenu onPick={(v) => seen.push(v)} />);
    await act(async () => {
      fireEvent.press(screen.getByText("Date"));
    });
    expect(seen).toEqual(["date"]);
    // Selecting closes the menu: the selected state is proven by
    // the report + dismissal, the indicator itself by the
    // controlled test below (open menu, preset value).
    expect(screen.queryByTestId("menu-popup")).toBeNull();
  });

  it("follows a controlled group value with indicator", async () => {
    await render(
      <MenuRoot defaultOpen>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuRadioGroup value="name">
                <MenuRadioItem value="date" testID="item-date">
                  <MenuRadioItemIndicator testID="date-dot">
                    <RNText>•</RNText>
                  </MenuRadioItemIndicator>
                  <RNText>Date</RNText>
                </MenuRadioItem>
                <MenuRadioItem value="name" testID="item-name">
                  <MenuRadioItemIndicator testID="name-dot">
                    <RNText>•</RNText>
                  </MenuRadioItemIndicator>
                  <RNText>Name</RNText>
                </MenuRadioItem>
              </MenuRadioGroup>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    expect(
      screen.getByTestId("item-name").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(screen.getByTestId("name-dot")).toBeTruthy();
    expect(
      screen.getByTestId("item-date").props.accessibilityState,
    ).toMatchObject({ selected: false });
    expect(screen.queryByTestId("date-dot")).toBeNull();
  });

  it("renders indicators nothing outside their items", async () => {
    await render(
      <>
        <MenuCheckboxItemIndicator testID="orphan-check">
          <RNText>✓</RNText>
        </MenuCheckboxItemIndicator>
        <MenuRadioItemIndicator testID="orphan-dot">
          <RNText>•</RNText>
        </MenuRadioItemIndicator>
      </>,
    );
    expect(screen.queryByTestId("orphan-check")).toBeNull();
    expect(screen.queryByTestId("orphan-dot")).toBeNull();
  });

  it("MenuPopup handles typeahead key events and highlights matching item", async () => {
    let highlightedState: boolean | undefined;
    await render(
      <MenuRoot defaultOpen>
        <MenuTrigger testID="ta-menu-trigger">
          <RNText>Menu</RNText>
        </MenuTrigger>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="ta-menu-popup">
              <MenuItem value="edit" filterText="Edit">
                <RNText>Edit</RNText>
              </MenuItem>
              <MenuItem
                value="save"
                filterText="Save"
                testID="item-save"
                style={(s) => {
                  highlightedState = s.highlighted;
                  return undefined;
                }}
              >
                <RNText>Save</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );

    const popup = screen.getByTestId("ta-menu-popup");
    await act(async () => {
      fireEvent(popup, "keyDown", { key: "s" });
    });
    expect(highlightedState).toBe(true);
  });

  it("MenuSubmenu parts open and render nested submenu content with open/close and nested dismiss", async () => {
    await render(
      <MenuRoot defaultOpen>
        <MenuTrigger testID="root-trigger">
          <RNText>Root</RNText>
        </MenuTrigger>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup testID="root-popup">
              <MenuItem value="item1">
                <RNText>Item 1</RNText>
              </MenuItem>
              <MenuSubmenuRoot value="sub1">
                <MenuSubmenuTrigger
                  testID="sub1-trigger"
                  accessibilityLabel="Submenu 1"
                >
                  <RNText>Submenu 1</RNText>
                </MenuSubmenuTrigger>
                <MenuSubmenuContent testID="sub1-content">
                  <MenuItem value="sub-item-1" testID="sub-item-1">
                    <RNText>Sub Item 1</RNText>
                  </MenuItem>
                  <MenuSubmenuRoot value="sub2">
                    <MenuSubmenuTrigger
                      testID="sub2-trigger"
                      accessibilityLabel="Submenu 2"
                    >
                      <RNText>Submenu 2</RNText>
                    </MenuSubmenuTrigger>
                    <MenuSubmenuContent testID="sub2-content">
                      <MenuItem value="sub-item-2" testID="sub-item-2">
                        <RNText>Sub Item 2</RNText>
                      </MenuItem>
                    </MenuSubmenuContent>
                  </MenuSubmenuRoot>
                </MenuSubmenuContent>
              </MenuSubmenuRoot>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );

    // Submenu 1 closed initially
    expect(screen.queryByTestId("sub1-content")).toBeNull();

    // Open Submenu 1
    await act(async () => {
      fireEvent.press(screen.getByTestId("sub1-trigger"));
    });
    expect(screen.getByTestId("sub1-content")).toBeTruthy();
    expect(screen.getByText("Sub Item 1")).toBeTruthy();

    // Open Submenu 2 (nested)
    expect(screen.queryByTestId("sub2-content")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("sub2-trigger"));
    });
    expect(screen.getByTestId("sub2-content")).toBeTruthy();
    expect(screen.getByText("Sub Item 2")).toBeTruthy();

    // Toggle/close Submenu 2
    await act(async () => {
      fireEvent.press(screen.getByTestId("sub2-trigger"));
    });
    expect(screen.queryByTestId("sub2-content")).toBeNull();
    expect(screen.getByTestId("sub1-content")).toBeTruthy();

    // Select leaf item closes all / nested dismiss
    await act(async () => {
      fireEvent.press(screen.getByTestId("sub-item-1"));
    });
    expect(screen.queryByTestId("sub1-content")).toBeNull();
  });
});
