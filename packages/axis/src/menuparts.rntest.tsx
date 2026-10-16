import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Pressable, Text as RNText, type View } from "react-native";
import {
  MenuBackdrop,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRoot,
  MenuSeparator,
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
