import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text, type View } from "react-native";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./index";

/**
 * Collapsible behavior through the public entry. Every assertion renders
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

describe("Collapsible on React Native", () => {
  it("renders closed: no panel, expanded false", async () => {
    await render(
      <Collapsible testID="cl">
        <CollapsibleTrigger testID="trigger" accessibilityLabel="More options">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </Collapsible>,
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
      <Collapsible testID="cl" onOpenChange={(v) => seen.push(v)}>
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </Collapsible>,
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
      <Collapsible testID="cl" defaultOpen onOpenChange={(v) => seen.push(v)}>
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </Collapsible>,
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
        <Collapsible testID="cl" open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger testID="trigger">
            <Text>More options</Text>
          </CollapsibleTrigger>
          <CollapsiblePanel testID="panel">
            <Text>Hidden details</Text>
          </CollapsiblePanel>
        </Collapsible>
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
      <Collapsible testID="cl" disabled onOpenChange={() => (calls += 1)}>
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </Collapsible>,
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
      <Collapsible testID="cl" ref={ref}>
        <CollapsibleTrigger testID="trigger">
          <Text>More options</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel testID="panel">
          <Text>Hidden details</Text>
        </CollapsiblePanel>
      </Collapsible>,
    );
    expect(ref.current).not.toBeNull();
  });
});
