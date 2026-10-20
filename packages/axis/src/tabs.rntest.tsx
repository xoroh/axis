import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { View } from "react-native";
import { TabsList, TabsPanel, TabsRoot, TabsTrigger } from "./index";

/**
 * TabsRoot behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * single-select replacement, role/state announcements, the disabled
 * terminal, structural panel presence, and ref forwarding are
 * observed, not assumed.
 *
 * Parts render via the `TabsList` / `TabsTrigger` / `TabsPanel` named
 * exports. Unselected panels are absent from the tree (conditional
 * presence), so visibility is asserted with `queryByTestId`.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("TabsRoot on React Native", () => {
  it("renders a tablist with tab triggers", async () => {
    await render(
      <TabsRoot testID="tabs">
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" aria-label="Alpha" />
          <TabsTrigger value="b" testID="tab-b" aria-label="Beta" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" />
        <TabsPanel value="b" testID="panel-b" />
      </TabsRoot>,
    );
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByLabelText("Alpha")).toBeTruthy();
    expect(screen.getByLabelText("Beta")).toBeTruthy();
  });

  it("selects the default tab and shows only its panel", async () => {
    await render(
      <TabsRoot testID="tabs" defaultValue="a">
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" />
          <TabsTrigger value="b" testID="tab-b" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" />
        <TabsPanel value="b" testID="panel-b" />
      </TabsRoot>,
    );
    expect(screen.getByTestId("tab-a").props.accessibilityState).toMatchObject({
      selected: true,
      disabled: false,
    });
    expect(screen.getByTestId("tab-b").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: false,
    });
    expect(screen.getByTestId("panel-a")).toBeTruthy();
    expect(screen.queryByTestId("panel-b")).toBeNull();
  });

  it("pressing a trigger switches selection and reports its value", async () => {
    const seen: string[] = [];
    await render(
      <TabsRoot
        testID="tabs"
        defaultValue="a"
        onValueChange={(v) => seen.push(v)}
      >
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" />
          <TabsTrigger value="b" testID="tab-b" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" />
        <TabsPanel value="b" testID="panel-b" />
      </TabsRoot>,
    );
    await press("tab-b");
    expect(seen).toEqual(["b"]);
    expect(screen.getByTestId("tab-a").props.accessibilityState).toMatchObject({
      selected: false,
    });
    expect(screen.getByTestId("tab-b").props.accessibilityState).toMatchObject({
      selected: true,
    });
    // Activating the selected trigger keeps it — never deselects, no callback.
    await press("tab-b");
    expect(seen).toEqual(["b"]);
    expect(screen.getByTestId("tab-b").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("follows the controlled value prop", async () => {
    function Host() {
      const [value, setValue] = useState<string>("a");
      return (
        <TabsRoot testID="tabs" value={value} onValueChange={setValue}>
          <TabsList testID="list">
            <TabsTrigger value="a" testID="tab-a" />
            <TabsTrigger value="b" testID="tab-b" />
          </TabsList>
          <TabsPanel value="a" testID="panel-a" />
          <TabsPanel value="b" testID="panel-b" />
        </TabsRoot>
      );
    }
    await render(<Host />);
    expect(screen.getByTestId("panel-a")).toBeTruthy();
    expect(screen.queryByTestId("panel-b")).toBeNull();
    await press("tab-b");
    expect(screen.queryByTestId("panel-a")).toBeNull();
    expect(screen.getByTestId("panel-b")).toBeTruthy();
    expect(screen.getByTestId("tab-b").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("disabled trigger never selects while siblings work", async () => {
    const seen: string[] = [];
    await render(
      <TabsRoot
        testID="tabs"
        defaultValue="b"
        onValueChange={(v) => seen.push(v)}
      >
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" disabled />
          <TabsTrigger value="b" testID="tab-b" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" />
        <TabsPanel value="b" testID="panel-b" />
      </TabsRoot>,
    );
    await press("tab-a");
    expect(seen).toEqual([]);
    expect(screen.getByTestId("tab-a").props.accessibilityState).toMatchObject({
      selected: false,
      disabled: true,
    });
    expect(screen.getByTestId("panel-b")).toBeTruthy();
    expect(screen.queryByTestId("panel-a")).toBeNull();
    await press("tab-b");
    expect(seen).toEqual([]);
    expect(screen.getByTestId("tab-b").props.accessibilityState).toMatchObject({
      selected: true,
      disabled: false,
    });
  });

  it("forwards a ref to the tabs root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <TabsRoot testID="tabs" ref={ref}>
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" />
      </TabsRoot>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("toggles panel presence when the selection moves back and forth", async () => {
    await render(
      <TabsRoot testID="tabs" defaultValue="a">
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" />
          <TabsTrigger value="b" testID="tab-b" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" />
        <TabsPanel value="b" testID="panel-b" />
      </TabsRoot>,
    );
    expect(screen.getByTestId("panel-a")).toBeTruthy();
    expect(screen.queryByTestId("panel-b")).toBeNull();
    await press("tab-b");
    expect(screen.queryByTestId("panel-a")).toBeNull();
    expect(screen.getByTestId("panel-b")).toBeTruthy();
    await press("tab-a");
    expect(screen.getByTestId("panel-a")).toBeTruthy();
    expect(screen.queryByTestId("panel-b")).toBeNull();
  });

  it("keepMounted keeps the deselected panel mounted but hidden and unannounced", async () => {
    await render(
      <TabsRoot testID="tabs" defaultValue="a">
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" />
          <TabsTrigger value="b" testID="tab-b" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" />
        <TabsPanel value="b" testID="panel-b" keepMounted />
      </TabsRoot>,
    );
    // Mounted but invisible and hidden from assistive tech on all three
    // platforms while deselected. (RNTL hides hidden-from-AT elements
    // from queries by default — which is itself the proof — so the
    // hidden assertions query with `includeHiddenElements`.)
    expect(
      screen.getByTestId("panel-b", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.queryByTestId("panel-b")).toBeNull();
    const panel = screen.getByTestId("panel-b", {
      includeHiddenElements: true,
    }).props;
    expect(panel.accessibilityElementsHidden).toBeUndefined();
    expect(panel.importantForAccessibility).toBeUndefined();
    expect(panel["aria-hidden"]).toBe(true);
    const flatHidden = Object.assign(
      {},
      ...(Array.isArray(panel.style)
        ? panel.style.flat(Infinity)
        : [panel.style]),
    );
    expect(flatHidden.display).toBe("none");
    await press("tab-b");
    const shown = screen.getByTestId("panel-b").props;
    expect(shown.accessibilityElementsHidden).toBeUndefined();
    expect(shown.importantForAccessibility).toBeUndefined();
    expect(shown["aria-hidden"]).toBe(false);
  });

  it("keepMounted panel becomes visible when selected", async () => {
    await render(
      <TabsRoot testID="tabs" defaultValue="b">
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" />
          <TabsTrigger value="b" testID="tab-b" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" keepMounted />
        <TabsPanel value="b" testID="panel-b" />
      </TabsRoot>,
    );
    const panel = screen.getByTestId("panel-b");
    expect(panel.props.style).not.toEqual(
      expect.arrayContaining([{ display: "none" }]),
    );
    expect(panel.props.accessibilityElementsHidden).toBeUndefined();
  });

  it("keepMounted render substitution stays hidden and unannounced while deselected", async () => {
    await render(
      <TabsRoot testID="tabs" defaultValue="a">
        <TabsList testID="list">
          <TabsTrigger value="a" testID="tab-a" />
          <TabsTrigger value="b" testID="tab-b" />
        </TabsList>
        <TabsPanel value="a" testID="panel-a" />
        <TabsPanel
          value="b"
          keepMounted
          render={<View testID="sub-panel-b" />}
        />
      </TabsRoot>,
    );
    // The substituted element carries the hidden contract: invisible
    // and unannounced (queried inclusively), never announced by default.
    expect(
      screen.getByTestId("sub-panel-b", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.queryByTestId("sub-panel-b")).toBeNull();
    const sub = screen.getByTestId("sub-panel-b", {
      includeHiddenElements: true,
    }).props;
    const flatSub = Object.assign(
      {},
      ...(Array.isArray(sub.style) ? sub.style.flat(Infinity) : [sub.style]),
    );
    expect(flatSub.display).toBe("none");
    expect(sub["aria-hidden"]).toBe(true);
    expect(sub.accessibilityElementsHidden).toBeUndefined();
    expect(sub.importantForAccessibility).toBeUndefined();
  });
});
