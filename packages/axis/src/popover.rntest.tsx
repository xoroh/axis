import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import { Popover } from "./index";

/**
 * Popover behavior through the public entry: closed renders the
 * anchor only, tap toggles the box region, a second tap and the
 * scrim both close through `onDismiss`/`onOpenChange`, controlled
 * mode follows the `open` prop, the ref lands on the anchor wrapper,
 * and caller styles reach the popover box.
 *
 * Pixel placement is NOT asserted here — anchor measurement
 * (`measure()`) needs the native runtime; the placement math is
 * covered by the `positioning` unit suites (the Tooltip proof
 * precedent). The scrim carries `<testID>-scrim` (the Dialog
 * precedent); the box carries `testID` itself.
 */

async function pressAnchor(label: string) {
  const anchor = screen.getByText(label).parent;
  if (anchor === null) throw new Error("popover test: anchor has no parent");
  await act(async () => {
    fireEvent.press(anchor);
  });
}

async function pressScrim(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(`${testID}-scrim`));
  });
}

describe("Popover on React Native", () => {
  it("closed shows the anchor only", async () => {
    await render(
      <Popover testID="pop" content={<Text>Details here</Text>}>
        <Text>Open</Text>
      </Popover>,
    );
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.queryByText("Details here")).toBeNull();
    expect(screen.queryByTestId("pop")).toBeNull();
    expect(screen.queryByTestId("pop-scrim")).toBeNull();
  });

  it("tap opens the content region", async () => {
    await render(
      <Popover
        testID="pop"
        content={<Text>Details here</Text>}
        accessibilityLabel="More info"
      >
        <Text>Open</Text>
      </Popover>,
    );
    await pressAnchor("Open");
    expect(screen.getByText("Details here")).toBeTruthy();
    expect(screen.getByLabelText("More info")).toBeTruthy();
    expect(screen.getByTestId("pop")).toBeTruthy();
    expect(screen.getByTestId("pop-scrim")).toBeTruthy();
  });

  it("tap again closes and reports onOpenChange(false)", async () => {
    const seen: boolean[] = [];
    await render(
      <Popover
        testID="pop"
        content={<Text>Details here</Text>}
        onOpenChange={(v) => seen.push(v)}
      >
        <Text>Open</Text>
      </Popover>,
    );
    await pressAnchor("Open");
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("pop")).toBeTruthy();
    await pressAnchor("Open");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByTestId("pop")).toBeNull();
    expect(screen.queryByTestId("pop-scrim")).toBeNull();
  });

  it("scrim dismisses through onDismiss and onOpenChange(false)", async () => {
    const changed: boolean[] = [];
    let dismissCalls = 0;
    await render(
      <Popover
        testID="pop"
        defaultOpen
        content={<Text>Details here</Text>}
        onOpenChange={(v) => changed.push(v)}
        onDismiss={() => {
          dismissCalls += 1;
        }}
      >
        <Text>Open</Text>
      </Popover>,
    );
    expect(screen.getByTestId("pop")).toBeTruthy();
    await pressScrim("pop");
    expect(dismissCalls).toBe(1);
    expect(changed).toEqual([false]);
    expect(screen.queryByTestId("pop")).toBeNull();
  });

  it("follows the controlled open prop", async () => {
    const changed: boolean[] = [];
    const view = await render(
      <Popover
        testID="pop"
        open={false}
        content={<Text>Details here</Text>}
        onOpenChange={(v) => changed.push(v)}
      >
        <Text>Open</Text>
      </Popover>,
    );
    expect(screen.queryByTestId("pop")).toBeNull();
    await act(async () => {
      view.rerender(
        <Popover
          testID="pop"
          open
          content={<Text>Details here</Text>}
          onOpenChange={(v) => changed.push(v)}
        >
          <Text>Open</Text>
        </Popover>,
      );
    });
    expect(screen.getByTestId("pop")).toBeTruthy();
    expect(screen.getByText("Details here")).toBeTruthy();
    expect(changed).toEqual([]);
  });

  it("forwards a ref to the anchor wrapper", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Popover testID="pop" content={<Text>Details here</Text>} ref={ref}>
        <Text>Open</Text>
      </Popover>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("passes caller styles to the popover box", async () => {
    await render(
      <Popover
        testID="pop"
        defaultOpen
        content={<Text>Details here</Text>}
        style={{ padding: 2 }}
        popoverStyle={{ padding: 16 }}
      >
        <Text>Open</Text>
      </Popover>,
    );
    const box = screen.getByTestId("pop");
    // The box style is [floating, caller] (the Tooltip composition):
    // flatten before asserting passthrough.
    const style = box.props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ padding: 16 });
    // The floating hook owns positioning: absolute even before measure.
    expect(flat).toMatchObject({ position: "absolute" });
  });
});
