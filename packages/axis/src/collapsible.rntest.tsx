import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text, View } from "react-native";
import { CollapsiblePanel, CollapsibleRoot, CollapsibleTrigger } from "./index";

/**
 * CollapsibleRoot behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * mount-only panel presence, toggle both directions, role/state
 * announcements, disabled terminality, and ref forwarding are observed,
 * not assumed.
 *
 * Parts render via the `CollapsibleTrigger` / `CollapsiblePanel` named
 * exports. The panel mounts only while open under its own `testID` (the
 * `Checkbox` checkmark precedent); the trigger carries its own `testID`.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("CollapsibleRoot on React Native", () => {
  it("renders closed: no panel, expanded false", async () => {
    await render(
      <CollapsibleRoot testID="cl">
        <CollapsibleTrigger testID="trigger" aria-label="More options">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    expect(
      screen.getByTestId("trigger").props.accessibilityState,
    ).toMatchObject({
      expanded: false,
      disabled: false,
    });
    expect(screen.queryByTestId("panel")).toBeNull();
    expect(screen.queryByText("Hidden details")).toBeNull();
  });

  it("press opens the panel and reports true", async () => {
    const seen: Array<boolean> = [];
    await render(
      <CollapsibleRoot testID="cl" onOpenChange={(v) => seen.push(v)}>
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    await press("trigger");
    expect(seen).toEqual([true]);
    expect(
      screen.getByTestId("trigger").props.accessibilityState,
    ).toMatchObject({
      expanded: true,
    });
    expect(screen.getByTestId("panel")).toBeTruthy();
    expect(screen.getByText("Hidden details")).toBeTruthy();
  });

  it("press closes the open panel and reports false", async () => {
    const seen: Array<boolean> = [];
    await render(
      <CollapsibleRoot
        testID="cl"
        defaultOpen
        onOpenChange={(v) => seen.push(v)}
      >
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    expect(screen.getByTestId("panel")).toBeTruthy();
    await press("trigger");
    expect(seen).toEqual([false]);
    expect(
      screen.getByTestId("trigger").props.accessibilityState,
    ).toMatchObject({
      expanded: false,
    });
    expect(screen.queryByTestId("panel")).toBeNull();
  });

  it("follows the controlled open prop", async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <CollapsibleRoot testID="cl" open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger testID="trigger">
            <Text>More options</Text>
          </CollapsibleTrigger>
          <CollapsiblePanel testID="panel">
            <Text>Hidden details</Text>
          </CollapsiblePanel>
        </CollapsibleRoot>
      );
    }
    await render(<Host />);
    expect(screen.queryByTestId("panel")).toBeNull();
    await press("trigger");
    expect(screen.getByTestId("panel")).toBeTruthy();
    expect(
      screen.getByTestId("trigger").props.accessibilityState,
    ).toMatchObject({
      expanded: true,
    });
    await press("trigger");
    expect(screen.queryByTestId("panel")).toBeNull();
    expect(
      screen.getByTestId("trigger").props.accessibilityState,
    ).toMatchObject({
      expanded: false,
    });
  });

  it("disabled collapsible blocks the trigger: no toggle, no callback", async () => {
    let calls = 0;
    await render(
      <CollapsibleRoot testID="cl" disabled onOpenChange={() => (calls += 1)}>
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    await press("trigger");
    expect(calls).toBe(0);
    expect(
      screen.getByTestId("trigger").props.accessibilityState,
    ).toMatchObject({
      expanded: false,
      disabled: true,
    });
    expect(screen.queryByTestId("panel")).toBeNull();
  });

  it("forwards a ref to the collapsible root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <CollapsibleRoot testID="cl" ref={ref}>
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("keepMounted keeps the closed panel mounted but hidden and unannounced", async () => {
    await render(
      <CollapsibleRoot testID="cl">
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel" keepMounted>
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    // Mounted but invisible and hidden from assistive tech on all three
    // platforms, with closed state. (RNTL hides hidden-from-AT elements
    // from queries by default — which is itself the proof — so the
    // hidden assertions query with `includeHiddenElements`.)
    expect(
      screen.getByTestId("panel", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.queryByTestId("panel")).toBeNull();
    const hidden = screen.getByTestId("panel", {
      includeHiddenElements: true,
    }).props;
    expect(hidden["aria-hidden"]).toBe(true);
    // ADR-112 aria-only: no legacy hiding props on new code.
    expect(hidden.accessibilityElementsHidden).toBeUndefined();
    expect(hidden.importantForAccessibility).toBeUndefined();
    const flatHidden = Object.assign(
      {},
      ...(Array.isArray(hidden.style)
        ? hidden.style.flat(Infinity)
        : [hidden.style]),
    );
    expect(flatHidden.display).toBe("none");
    // Content stays mounted while hidden (query it inclusively).
    expect(
      screen.getByText("Hidden details", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.queryByText("Hidden details")).toBeNull();
    await press("trigger");
    const shown = screen.getByTestId("panel").props;
    expect(shown.accessibilityElementsHidden).toBeUndefined();
    expect(shown.importantForAccessibility).toBeUndefined();
    expect(shown["aria-hidden"]).toBe(false);
  });

  it("keepMounted panel becomes visible when opened", async () => {
    await render(
      <CollapsibleRoot testID="cl" defaultOpen>
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel" keepMounted>
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    const panel = screen.getByTestId("panel");
    expect(panel.props.style).not.toEqual(
      expect.arrayContaining([{ display: "none" }]),
    );
    expect(panel.props.accessibilityElementsHidden).toBeUndefined();
    expect(panel.props["aria-hidden"]).toBe(false);
  });

  it("keepMounted render substitution stays hidden and unannounced while closed", async () => {
    await render(
      <CollapsibleRoot testID="cl">
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel keepMounted render={<View testID="sub-panel" />}>
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    // The substituted element carries the hidden contract: invisible
    // and unannounced (queried inclusively), never announced by default.
    expect(
      screen.getByTestId("sub-panel", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.queryByTestId("sub-panel")).toBeNull();
    const sub = screen.getByTestId("sub-panel", {
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
