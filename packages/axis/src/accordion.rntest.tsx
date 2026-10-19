import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from "./index";

/**
 * Accordion behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * compound assembly (Root/Item/Header/Trigger/Panel), single-expand
 * replacement with collapse-to-empty on re-activation, multi-expand
 * membership with `multiple`, per-item `onOpenChange` (including
 * replacement closes), role/state announcements, disabled terminality
 * (group-wide and per-item), and ref forwarding are observed, not assumed.
 *
 * Panels mount only while open under the caller's `testID`; the trigger
 * carries the item `testID`.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

function item(value: string, label: string, panel: string) {
  return (
    <AccordionItem value={value} key={value}>
      <AccordionHeader>
        <AccordionTrigger testID={value} accessibilityLabel={label}>
          <Text>{label}</Text>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionPanel testID={`${value}-panel`}>
        <Text>{panel}</Text>
      </AccordionPanel>
    </AccordionItem>
  );
}

describe("Accordion on React Native", () => {
  it("renders collapsed: no panel, expanded false", async () => {
    await render(
      <AccordionRoot testID="acc" accessibilityLabel="Settings">
        {item("a", "General", "General panel")}
        {item("b", "Privacy", "Privacy panel")}
      </AccordionRoot>,
    );
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      expanded: false,
      disabled: false,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      expanded: false,
      disabled: false,
    });
    expect(screen.queryByTestId("a-panel")).toBeNull();
    expect(screen.queryByTestId("b-panel")).toBeNull();
  });

  it("press opens the panel and reports the value array", async () => {
    const seen: string[][] = [];
    await render(
      <AccordionRoot onValueChange={(v) => seen.push([...v])}>
        {item("a", "General", "General panel")}
      </AccordionRoot>,
    );
    await press("a");
    expect(seen).toEqual([["a"]]);
    expect(screen.getByTestId("a-panel")).toBeTruthy();
    expect(screen.getByText("General panel")).toBeTruthy();
  });

  it("single-expand replaces: opening another closes the first, both report", async () => {
    const changes: Array<[string, boolean]> = [];
    await render(
      <AccordionRoot>
        <AccordionItem
          value="a"
          onOpenChange={(open) => changes.push(["a", open])}
        >
          <AccordionHeader>
            <AccordionTrigger testID="a">
              <Text>A</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <Text>Panel A</Text>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem
          value="b"
          onOpenChange={(open) => changes.push(["b", open])}
        >
          <AccordionHeader>
            <AccordionTrigger testID="b">
              <Text>B</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <Text>Panel B</Text>
          </AccordionPanel>
        </AccordionItem>
      </AccordionRoot>,
    );
    await press("a");
    expect(changes).toEqual([["a", true]]);
    await press("b");
    // Replacement closes A and opens B — both items report.
    expect(changes).toEqual([
      ["a", true],
      ["a", false],
      ["b", true],
    ]);
    expect(screen.queryByText("Panel A")).toBeNull();
    expect(screen.getByText("Panel B")).toBeTruthy();
  });

  it("re-activating the open item collapses the group to empty", async () => {
    const seen: string[][] = [];
    await render(
      <AccordionRoot onValueChange={(v) => seen.push([...v])}>
        {item("a", "General", "General panel")}
      </AccordionRoot>,
    );
    await press("a");
    await press("a");
    expect(seen).toEqual([["a"], []]);
    expect(screen.queryByTestId("a-panel")).toBeNull();
  });

  it("multiple keeps panels independent", async () => {
    const seen: string[][] = [];
    await render(
      <AccordionRoot multiple onValueChange={(v) => seen.push([...v])}>
        {item("a", "General", "General panel")}
        {item("b", "Privacy", "Privacy panel")}
      </AccordionRoot>,
    );
    await press("a");
    await press("b");
    expect(seen).toEqual([["a"], ["a", "b"]]);
    expect(screen.getByTestId("a-panel")).toBeTruthy();
    expect(screen.getByTestId("b-panel")).toBeTruthy();
    await press("a");
    expect(seen).toEqual([["a"], ["a", "b"], ["b"]]);
  });

  it("header carries the heading role and the trigger carries expanded state", async () => {
    await render(
      <AccordionRoot>
        <AccordionItem value="a">
          <AccordionHeader testID="h">
            <AccordionTrigger testID="t" accessibilityLabel="General">
              <Text>General</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <Text>Panel</Text>
          </AccordionPanel>
        </AccordionItem>
      </AccordionRoot>,
    );
    expect(screen.getByTestId("h").props.accessibilityRole).toBe("header");
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("keepMounted keeps the panel mounted but hidden while closed", async () => {
    await render(
      <AccordionRoot>
        <AccordionItem value="a">
          <AccordionHeader>
            <AccordionTrigger testID="a" accessibilityLabel="General">
              <Text>General</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel testID="a-panel" keepMounted>
            <Text>General panel</Text>
          </AccordionPanel>
        </AccordionItem>
      </AccordionRoot>,
    );
    // Mounted (layout + content present) but the closed container is
    // hidden from assistive tech.
    expect(screen.getByTestId("a-panel")).toBeTruthy();
    expect(screen.getByTestId("a-panel").props.accessible).toBe(false);
    expect(screen.getByText("General panel")).toBeTruthy();
    await press("a");
    expect(screen.getByTestId("a-panel").props.accessible).toBeUndefined();
    expect(screen.getByText("General panel")).toBeTruthy();
  });

  it("disabled root blocks every item: no toggles, no callbacks", async () => {
    let calls = 0;
    await render(
      <AccordionRoot disabled onValueChange={() => (calls += 1)}>
        {item("a", "General", "General panel")}
      </AccordionRoot>,
    );
    await press("a");
    expect(calls).toBe(0);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      expanded: false,
      disabled: true,
    });
    expect(screen.queryByTestId("a-panel")).toBeNull();
  });

  it("per-item disabled is terminal for that item only", async () => {
    const seen: string[][] = [];
    await render(
      <AccordionRoot onValueChange={(v) => seen.push([...v])}>
        <AccordionItem value="a" disabled>
          <AccordionHeader>
            <AccordionTrigger testID="a">
              <Text>A</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <Text>Panel A</Text>
          </AccordionPanel>
        </AccordionItem>
        {item("b", "Privacy", "Privacy panel")}
      </AccordionRoot>,
    );
    await press("a");
    expect(seen).toEqual([]);
    await press("b");
    expect(seen).toEqual([["b"]]);
  });

  it("forwards a ref to the root host", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <AccordionRoot testID="acc" ref={ref}>
        {item("a", "General", "General panel")}
      </AccordionRoot>,
    );
    expect(ref.current).not.toBeNull();
  });
});
