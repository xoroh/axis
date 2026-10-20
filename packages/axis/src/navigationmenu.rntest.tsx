import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text as RNText, type View } from "react-native";
import {
  NavigationMenuItem,
  NavigationMenuPanel,
  NavigationMenuRoot,
  NavigationMenuTrigger,
} from "./index";

/**
 * NavigationMenuRoot behavior through the public entry. Bar rendering,
 * single-open panels, switching items, scrim dismissal, disabled
 * terminality, inert parts outside a menu, controlled following,
 * and ref forwarding — observed in the RN runtime.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

function Bar({ onOpen }: { onOpen?: (value: string | null) => void }) {
  return (
    <NavigationMenuRoot testID="nav" onOpenValueChange={onOpen}>
      <NavigationMenuItem value="products">
        <NavigationMenuTrigger aria-label="Products trigger">
          <RNText>Products</RNText>
        </NavigationMenuTrigger>
        <NavigationMenuPanel testID="products-panel">
          <RNText>Product links</RNText>
        </NavigationMenuPanel>
      </NavigationMenuItem>
      <NavigationMenuItem value="company">
        <NavigationMenuTrigger aria-label="Company trigger">
          <RNText>Company</RNText>
        </NavigationMenuTrigger>
        <NavigationMenuPanel testID="company-panel">
          <RNText>Company links</RNText>
        </NavigationMenuPanel>
      </NavigationMenuItem>
    </NavigationMenuRoot>
  );
}

describe("NavigationMenuRoot on React Native", () => {
  it("renders the bar with triggers and no panels while closed", async () => {
    await render(<Bar />);
    expect(screen.getByLabelText("Products trigger")).toBeTruthy();
    expect(screen.getByLabelText("Company trigger")).toBeTruthy();
    expect(screen.queryByTestId("products-panel")).toBeNull();
    expect(screen.queryByTestId("company-panel")).toBeNull();
  });

  it("opens one panel with the expanded trigger", async () => {
    const seen: Array<string | null> = [];
    await render(<Bar onOpen={(v) => seen.push(v)} />);
    await pressLabel("Products trigger");
    expect(seen).toEqual(["products"]);
    expect(screen.getByTestId("products-panel")).toBeTruthy();
    expect(screen.getByText("Product links")).toBeTruthy();
    expect(
      screen.getByLabelText("Products trigger").props.accessibilityState,
    ).toMatchObject({ expanded: true });
  });

  it("switches panels, keeping exactly one open", async () => {
    await render(<Bar />);
    await pressLabel("Products trigger");
    expect(screen.getByTestId("products-panel")).toBeTruthy();
    await pressLabel("Company trigger");
    expect(screen.queryByTestId("products-panel")).toBeNull();
    expect(screen.getByTestId("company-panel")).toBeTruthy();
  });

  it("dismisses through the scrim", async () => {
    const order: string[] = [];
    const seen: Array<string | null> = [];
    await render(
      <NavigationMenuRoot
        testID="nav2"
        defaultOpenValue="products"
        onDismiss={() => order.push("dismiss")}
        onOpenValueChange={(v) => seen.push(v)}
      >
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger aria-label="Products trigger">
            <RNText>Products</RNText>
          </NavigationMenuTrigger>
          <NavigationMenuPanel testID="products-panel">
            <RNText>Product links</RNText>
          </NavigationMenuPanel>
        </NavigationMenuItem>
      </NavigationMenuRoot>,
    );
    expect(screen.getByTestId("products-panel")).toBeTruthy();
    await pressLabel("Dismiss menu");
    expect(order).toEqual(["dismiss"]);
    expect(seen).toEqual([null]);
    expect(screen.queryByTestId("products-panel")).toBeNull();
  });

  it("keeps disabled triggers closed", async () => {
    await render(
      <NavigationMenuRoot>
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger aria-label="Products" disabled>
            <RNText>Products</RNText>
          </NavigationMenuTrigger>
          <NavigationMenuPanel testID="products-panel">
            <RNText>Product links</RNText>
          </NavigationMenuPanel>
        </NavigationMenuItem>
      </NavigationMenuRoot>,
    );
    await pressLabel("Products");
    expect(screen.queryByTestId("products-panel")).toBeNull();
  });

  it("renders triggers inert outside a menu", async () => {
    await render(
      <NavigationMenuTrigger aria-label="Orphan" testID="orphan">
        <RNText>Orphan</RNText>
      </NavigationMenuTrigger>,
    );
    expect(screen.getByTestId("orphan").props.accessibilityState).toMatchObject(
      { disabled: true },
    );
  });

  it("renders nothing for items outside a menu", async () => {
    await render(
      <NavigationMenuItem value="orphan">
        <NavigationMenuTrigger aria-label="Orphan">
          <RNText>Orphan</RNText>
        </NavigationMenuTrigger>
        <NavigationMenuPanel testID="orphan-panel">
          <RNText>Orphan links</RNText>
        </NavigationMenuPanel>
      </NavigationMenuItem>,
    );
    expect(screen.queryByLabelText("Orphan")).toBeNull();
    expect(screen.queryByTestId("orphan-panel")).toBeNull();
  });

  it("follows controlled open value", async () => {
    await render(
      <NavigationMenuRoot testID="nav" openValue="company">
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger aria-label="Products trigger">
            <RNText>Products</RNText>
          </NavigationMenuTrigger>
          <NavigationMenuPanel testID="products-panel">
            <RNText>Product links</RNText>
          </NavigationMenuPanel>
        </NavigationMenuItem>
        <NavigationMenuItem value="company">
          <NavigationMenuTrigger aria-label="Company trigger">
            <RNText>Company</RNText>
          </NavigationMenuTrigger>
          <NavigationMenuPanel testID="company-panel">
            <RNText>Company links</RNText>
          </NavigationMenuPanel>
        </NavigationMenuItem>
      </NavigationMenuRoot>,
    );
    expect(screen.queryByTestId("products-panel")).toBeNull();
    expect(screen.getByTestId("company-panel")).toBeTruthy();
  });

  it("forwards a ref to the bar container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <NavigationMenuRoot ref={ref}>
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger aria-label="Products trigger">
            <RNText>Products</RNText>
          </NavigationMenuTrigger>
          <NavigationMenuPanel testID="products-panel">
            <RNText>Product links</RNText>
          </NavigationMenuPanel>
        </NavigationMenuItem>
      </NavigationMenuRoot>,
    );
    expect(ref.current).toBeTruthy();
  });
});
