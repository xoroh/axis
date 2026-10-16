import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text as RNText, type View } from "react-native";
import {
  Drawer,
  NavigationBar,
  NavigationBarItem,
  NavigationDrawer,
  NavigationRail,
  NavigationRailItem,
} from "./index";

/**
 * Navigation bar/rail/drawer behavior through the public entry.
 * Single-select tab state with first-item default, no deselect on
 * re-press, disabled terminality, controlled following, rail as a
 * vertical bar, and drawer scrim dismissal — observed in the RN
 * runtime.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

function Tabs({ onChange }: { onChange?: (value: string) => void }) {
  return (
    <NavigationBar testID="bar" onValueChange={onChange}>
      <NavigationBarItem value="home" label="Home" />
      <NavigationBarItem value="search" label="Search" />
      <NavigationBarItem value="profile" label="Profile" disabled />
    </NavigationBar>
  );
}

describe("NavigationBar on React Native", () => {
  it("renders the tablist with the first item active by default", async () => {
    await render(<Tabs />);
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Home" })).toBeTruthy();
    expect(
      screen.getByLabelText("Home").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    expect(
      screen.getByLabelText("Search").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("activates another destination and reports the change", async () => {
    const seen: string[] = [];
    await render(<Tabs onChange={(v) => seen.push(v)} />);
    await pressLabel("Search");
    expect(seen).toEqual(["search"]);
    expect(
      screen.getByLabelText("Search").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByLabelText("Home").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("does not deselect or report on re-press of the active item", async () => {
    const seen: string[] = [];
    await render(<Tabs onChange={(v) => seen.push(v)} />);
    await pressLabel("Home");
    expect(seen).toEqual([]);
    expect(
      screen.getByLabelText("Home").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
  });

  it("keeps disabled destinations inactive", async () => {
    const seen: string[] = [];
    await render(<Tabs onChange={(v) => seen.push(v)} />);
    await pressLabel("Profile");
    expect(seen).toEqual([]);
    expect(
      screen.getByLabelText("Profile").props.accessibilityState,
    ).toMatchObject({ selected: false, disabled: true });
  });

  it("follows a controlled value", async () => {
    await render(
      <NavigationBar testID="bar" value="search">
        <NavigationBarItem value="home" label="Home" />
        <NavigationBarItem value="search" label="Search" />
      </NavigationBar>,
    );
    expect(
      screen.getByLabelText("Search").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByLabelText("Home").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("renders items inert outside a bar", async () => {
    await render(
      <NavigationBarItem value="orphan" label="Orphan" testID="orphan" />,
    );
    expect(screen.getByTestId("orphan").props.accessibilityState).toMatchObject(
      {
        disabled: true,
      },
    );
  });

  it("forwards a ref to the bar container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <NavigationBar ref={ref}>
        <NavigationBarItem value="home" label="Home" />
      </NavigationBar>,
    );
    expect(ref.current).toBeTruthy();
  });
});

describe("NavigationRail on React Native", () => {
  it("lays out vertically with the same selection semantics", async () => {
    const seen: string[] = [];
    await render(
      <NavigationRail testID="rail" onValueChange={(v) => seen.push(v)}>
        <NavigationRailItem value="home" label="Home" />
        <NavigationRailItem value="search" label="Search" />
      </NavigationRail>,
    );
    const bar = screen.getByTestId("rail");
    const flat: Record<string, unknown> = Object.assign(
      {},
      ...(Array.isArray(bar.props.style)
        ? bar.props.style
        : [bar.props.style]
      ).filter(Boolean),
    );
    expect(flat.flexDirection).toBe("column");
    expect(
      screen.getByLabelText("Home").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    await pressLabel("Search");
    expect(seen).toEqual(["search"]);
  });
});

describe("Drawer on React Native", () => {
  it("renders nothing when closed", async () => {
    await render(
      <Drawer testID="drawer" accessibilityLabel="App navigation">
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the dialog surface when open", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen accessibilityLabel="App navigation">
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Destinations")).toBeTruthy();
  });

  it("dismisses through the scrim with onDismiss before onOpenChange", async () => {
    const order: string[] = [];
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        onDismiss={() => order.push("dismiss")}
        onOpenChange={() => order.push("change")}
      >
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    await pressLabel("Dismiss");
    expect(order).toEqual(["dismiss", "change"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders an inert scrim when not dismissable", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen dismissable={false}>
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("anchors to the trailing edge on the right side", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen side="right">
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    const flat: Record<string, unknown> = Object.assign(
      {},
      ...(Array.isArray(screen.getByTestId("drawer").props.style)
        ? screen.getByTestId("drawer").props.style
        : [screen.getByTestId("drawer").props.style]
      ).filter(Boolean),
    );
    expect(flat.right).toBe(0);
    expect(flat.left).toBeUndefined();
  });

  it("forwards a ref to the surface", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Drawer defaultOpen ref={ref}>
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(ref.current).toBeTruthy();
  });

  it("honors the deprecated NavigationDrawer alias (warns once)", async () => {
    const warnings: unknown[][] = [];
    const warn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };
    try {
      await render(
        <NavigationDrawer testID="drawer" defaultOpen>
          <RNText>Destinations</RNText>
        </NavigationDrawer>,
      );
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(
        warnings.some((args) => String(args[0]).includes("deprecated")),
      ).toBe(true);
    } finally {
      console.warn = warn;
    }
  });
});

describe("NavigationRail ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <NavigationRail ref={ref} testID="r">
        <NavigationRailItem value="a" label="A" />
      </NavigationRail>,
    );
    expect(ref.current).toBeTruthy();
  });
});
