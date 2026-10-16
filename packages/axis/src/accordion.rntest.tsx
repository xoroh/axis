import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text, type View } from "react-native";
import { Accordion, AccordionItem } from "./index";

/**
 * Accordion behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * single-expand replacement, collapse-to-null on re-activation,
 * role/state announcements, disabled terminality (group-wide), and ref
 * forwarding are observed, not assumed.
 *
 * Items render via the `AccordionItem` named export. Panels mount only
 * while open under `<testID>-panel` (the `Checkbox` checkmark precedent);
 * the trigger itself carries the item `testID`.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Accordion on React Native", () => {
  it("renders collapsed: no panel, expanded false", async () => {
    await render(
      <Accordion testID="acc" accessibilityLabel="Settings">
        <AccordionItem
          value="a"
          testID="a"
          accessibilityLabel="General"
          header={<Text>General</Text>}
        >
          <Text>General panel</Text>
        </AccordionItem>
        <AccordionItem
          value="b"
          testID="b"
          accessibilityLabel="Privacy"
          header={<Text>Privacy</Text>}
        >
          <Text>Privacy panel</Text>
        </AccordionItem>
      </Accordion>,
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

  it("press opens the panel and reports its value", async () => {
    const seen: Array<string | null> = [];
    await render(
      <Accordion testID="acc" onValueChange={(v) => seen.push(v)}>
        <AccordionItem value="a" testID="a" header={<Text>General</Text>}>
          <Text>General panel</Text>
        </AccordionItem>
        <AccordionItem value="b" testID="b" header={<Text>Privacy</Text>}>
          <Text>Privacy panel</Text>
        </AccordionItem>
      </Accordion>,
    );
    await press("a");
    expect(seen).toEqual(["a"]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      expanded: true,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      expanded: false,
    });
    expect(screen.getByTestId("a-panel")).toBeTruthy();
    expect(screen.getByText("General panel")).toBeTruthy();
    expect(screen.queryByTestId("b-panel")).toBeNull();
  });

  it("pressing the open item collapses it and reports null", async () => {
    const seen: Array<string | null> = [];
    await render(
      <Accordion testID="acc" onValueChange={(v) => seen.push(v)}>
        <AccordionItem value="a" testID="a" header={<Text>General</Text>}>
          <Text>General panel</Text>
        </AccordionItem>
      </Accordion>,
    );
    await press("a");
    await press("a");
    expect(seen).toEqual(["a", null]);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      expanded: false,
    });
    expect(screen.queryByTestId("a-panel")).toBeNull();
  });

  it("follows the controlled value prop", async () => {
    function Host() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <Accordion testID="acc" value={value} onValueChange={setValue}>
          <AccordionItem value="a" testID="a" header={<Text>General</Text>}>
            <Text>General panel</Text>
          </AccordionItem>
          <AccordionItem value="b" testID="b" header={<Text>Privacy</Text>}>
            <Text>Privacy panel</Text>
          </AccordionItem>
        </Accordion>
      );
    }
    await render(<Host />);
    expect(screen.queryByTestId("a-panel")).toBeNull();
    await press("a");
    expect(screen.getByTestId("a-panel")).toBeTruthy();
    await press("b");
    expect(screen.queryByTestId("a-panel")).toBeNull();
    expect(screen.getByTestId("b-panel")).toBeTruthy();
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      expanded: false,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      expanded: true,
    });
  });

  it("disabled accordion blocks every item: no toggle, no callback", async () => {
    let calls = 0;
    await render(
      <Accordion testID="acc" disabled onValueChange={() => (calls += 1)}>
        <AccordionItem value="a" testID="a" header={<Text>General</Text>}>
          <Text>General panel</Text>
        </AccordionItem>
        <AccordionItem value="b" testID="b" header={<Text>Privacy</Text>}>
          <Text>Privacy panel</Text>
        </AccordionItem>
      </Accordion>,
    );
    await press("a");
    await press("b");
    expect(calls).toBe(0);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      expanded: false,
      disabled: true,
    });
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      expanded: false,
      disabled: true,
    });
    expect(screen.queryByTestId("a-panel")).toBeNull();
    expect(screen.queryByTestId("b-panel")).toBeNull();
  });

  it("renders item testIDs on their triggers", async () => {
    await render(
      <Accordion testID="acc">
        <AccordionItem value="a" testID="a" header={<Text>General</Text>}>
          <Text>General panel</Text>
        </AccordionItem>
        <AccordionItem value="b" testID="b" header={<Text>Privacy</Text>}>
          <Text>Privacy panel</Text>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByTestId("a")).toBeTruthy();
    expect(screen.getByTestId("b")).toBeTruthy();
    expect(screen.getByTestId("a").props.accessibilityRole).toBe("button");
    expect(screen.getByTestId("b").props.accessibilityRole).toBe("button");
  });

  it("forwards a ref to the accordion root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Accordion testID="acc" ref={ref}>
        <AccordionItem value="a" testID="a" header={<Text>General</Text>}>
          <Text>General panel</Text>
        </AccordionItem>
      </Accordion>,
    );
    expect(ref.current).not.toBeNull();
  });
});
