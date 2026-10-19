import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Pressable, Text, type View } from "react-native";
import { Menu, MenuItem, PortalHost } from "./index";

/**
 * Menu behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * trigger-only closed presence, trigger toggle, item selection with
 * close, scrim dismissal, controlled tracking, disabled terminality on
 * both trigger and item, and ref forwarding are observed, not assumed.
 *
 * The trigger here is a caller `Pressable` (not `MenuTrigger` — the
 * barrel re-exports `Menu`/`MenuItem` only): `Menu` composes the
 * trigger-zone child's `onPress` with the context toggle. The content
 * box carries `testID` itself and the scrim carries `<testID>-scrim`
 * (the `Dialog` `-scrim` precedent); the scrim is labelled
 * "Dismiss menu". Pixel placement is NOT asserted — anchor measurement
 * (`measure()`) needs the native runtime; the placement math is covered
 * by the `positioning` unit suites.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

function Example({
  onOpenChange,
  onDismiss,
  onSelect,
  defaultOpen = false,
  triggerDisabled = false,
  itemDisabled = false,
}: {
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
  onSelect?: (value: string) => void;
  defaultOpen?: boolean;
  triggerDisabled?: boolean;
  itemDisabled?: boolean;
}) {
  return (
    <Menu
      testID="menu"
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      onDismiss={onDismiss}
    >
      <Pressable
        testID="trigger"
        accessibilityLabel="Open menu"
        disabled={triggerDisabled}
      >
        <Text>Open menu</Text>
      </Pressable>
      <MenuItem
        value="a"
        testID="item-a"
        disabled={itemDisabled}
        onSelect={onSelect}
      >
        <Text>Alpha</Text>
      </MenuItem>
      <MenuItem value="b" testID="item-b">
        <Text>Beta</Text>
      </MenuItem>
    </Menu>
  );
}

describe("Menu on React Native", () => {
  it("closed shows the trigger only: no menu role, content, or scrim", async () => {
    await render(
      <PortalHost>
        <Example />
      </PortalHost>,
    );
    expect(screen.getByTestId("trigger")).toBeTruthy();
    expect(screen.getByText("Open menu")).toBeTruthy();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByTestId("menu")).toBeNull();
    expect(screen.queryByTestId("menu-scrim")).toBeNull();
    expect(screen.queryByLabelText("Dismiss menu")).toBeNull();
    expect(screen.queryByText("Alpha")).toBeNull();
  });

  it("trigger press opens the content with the menu role and reports true", async () => {
    const seen: Array<boolean> = [];
    await render(
      <PortalHost>
        <Example onOpenChange={(v) => seen.push(v)} />
      </PortalHost>,
    );
    expect(screen.queryByRole("menu")).toBeNull();
    await press("trigger");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByTestId("menu")).toBeTruthy();
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Beta")).toBeTruthy();
    expect(screen.getByLabelText("Dismiss menu")).toBeTruthy();
    const flat = Object.assign(
      {},
      ...[screen.getByTestId("menu").props.style].flat().filter(Boolean),
    );
    expect(flat).toMatchObject({ position: "absolute" });
  });

  it("item press fires onSelect(value), closes, and reports false", async () => {
    const selected: Array<string> = [];
    const seen: Array<boolean> = [];
    await render(
      <PortalHost>
        <Example
          defaultOpen
          onOpenChange={(v) => seen.push(v)}
          onSelect={(v) => selected.push(v)}
        />
      </PortalHost>,
    );
    expect(screen.getByTestId("item-a").props.role).toBe("menuitem");
    expect(screen.getByTestId("item-a").props.accessibilityState).toMatchObject(
      { disabled: false },
    );
    await press("item-a");
    expect(selected).toEqual(["a"]);
    expect(seen).toEqual([false]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("scrim press dismisses through onDismiss and onOpenChange(false)", async () => {
    const seen: Array<boolean> = [];
    let dismissCalls = 0;
    await render(
      <PortalHost>
        <Example
          defaultOpen
          onOpenChange={(v) => seen.push(v)}
          onDismiss={() => {
            dismissCalls += 1;
          }}
        />
      </PortalHost>,
    );
    await press("menu-scrim");
    expect(dismissCalls).toBe(1);
    expect(seen).toEqual([false]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("follows the controlled open prop", async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <Menu testID="menu" open={open} onOpenChange={setOpen}>
          <Pressable testID="trigger">
            <Text>Open menu</Text>
          </Pressable>
          <MenuItem value="a" testID="item-a">
            <Text>Alpha</Text>
          </MenuItem>
        </Menu>
      );
    }
    await render(
      <PortalHost>
        <Host />
      </PortalHost>,
    );
    expect(screen.queryByRole("menu")).toBeNull();
    await press("trigger");
    expect(screen.getByRole("menu")).toBeTruthy();
    await press("item-a");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("disabled trigger never opens: no toggle, no callback", async () => {
    const seen: Array<boolean> = [];
    await render(
      <PortalHost>
        <Example triggerDisabled onOpenChange={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await press("trigger");
    expect(seen).toEqual([]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("disabled item never selects: no onSelect, no close, stays open", async () => {
    const selected: Array<string> = [];
    const seen: Array<boolean> = [];
    await render(
      <PortalHost>
        <Example
          defaultOpen
          itemDisabled
          onOpenChange={(v) => seen.push(v)}
          onSelect={(v) => selected.push(v)}
        />
      </PortalHost>,
    );
    expect(screen.getByTestId("item-a").props.accessibilityState).toMatchObject(
      { disabled: true },
    );
    await press("item-a");
    expect(selected).toEqual([]);
    expect(seen).toEqual([]);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("forwards a ref to the menu container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <Menu testID="menu" ref={ref}>
          <Pressable testID="trigger">
            <Text>Open menu</Text>
          </Pressable>
          <MenuItem value="a" testID="item-a">
            <Text>Alpha</Text>
          </MenuItem>
        </Menu>
      </PortalHost>,
    );
    expect(ref.current).not.toBeNull();
  });
});
