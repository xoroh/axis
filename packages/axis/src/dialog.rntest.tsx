import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import { Dialog } from "./index";

/**
 * Dialog behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN
 * events — closed presence, surface/title/role announcement, scrim
 * dismissal (and its non-dismissable absence), controlled tracking,
 * ref forwarding, caller styles, and the actions row are observed,
 * not assumed.
 *
 * The scrim carries `<testID>-scrim` (the `Accordion` `-panel`
 * precedent); the surface carries `testID` itself.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Dialog on React Native", () => {
  it("renders nothing while closed", async () => {
    await render(
      <Dialog testID="dlg" title="Delete?">
        <Text>Body text</Text>
      </Dialog>,
    );
    expect(screen.queryByTestId("dlg")).toBeNull();
    expect(screen.queryByTestId("dlg-scrim")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("open shows the surface, title, and dialog role", async () => {
    await render(
      <Dialog
        testID="dlg"
        defaultOpen
        title="Delete?"
        accessibilityLabel="Delete confirmation"
      >
        <Text>Body text</Text>
      </Dialog>,
    );
    expect(screen.getByTestId("dlg")).toBeTruthy();
    expect(screen.getByText("Delete?")).toBeTruthy();
    expect(screen.getByText("Body text")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByTestId("dlg").props.role).toBe("dialog");
  });

  it("scrim press dismisses through onDismiss and onOpenChange(false)", async () => {
    const changed: boolean[] = [];
    let dismissCalls = 0;
    await render(
      <Dialog
        testID="dlg"
        defaultOpen
        onOpenChange={(v) => changed.push(v)}
        onDismiss={() => {
          dismissCalls += 1;
        }}
      >
        <Text>Body text</Text>
      </Dialog>,
    );
    await press("dlg-scrim");
    expect(dismissCalls).toBe(1);
    expect(changed).toEqual([false]);
    expect(screen.queryByTestId("dlg")).toBeNull();
  });

  it("dismissable={false} ignores the scrim and offers no dismiss affordance", async () => {
    const changed: boolean[] = [];
    let dismissCalls = 0;
    await render(
      <Dialog
        testID="dlg"
        defaultOpen
        dismissable={false}
        onOpenChange={(v) => changed.push(v)}
        onDismiss={() => {
          dismissCalls += 1;
        }}
      >
        <Text>Body text</Text>
      </Dialog>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    await press("dlg-scrim");
    expect(dismissCalls).toBe(0);
    expect(changed).toEqual([]);
    expect(screen.getByTestId("dlg")).toBeTruthy();
  });

  it("follows the controlled open prop", async () => {
    const changed: boolean[] = [];
    const view = await render(
      <Dialog testID="dlg" open={false} onOpenChange={(v) => changed.push(v)}>
        <Text>Body text</Text>
      </Dialog>,
    );
    expect(screen.queryByTestId("dlg")).toBeNull();
    await act(async () => {
      view.rerender(
        <Dialog testID="dlg" open onOpenChange={(v) => changed.push(v)}>
          <Text>Body text</Text>
        </Dialog>,
      );
    });
    expect(screen.getByTestId("dlg")).toBeTruthy();
    expect(changed).toEqual([]);
  });

  it("forwards a ref to the surface View", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Dialog testID="dlg" defaultOpen ref={ref}>
        <Text>Body text</Text>
      </Dialog>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("passes caller styles to scrim, surface, and title", async () => {
    await render(
      <Dialog
        testID="dlg"
        defaultOpen
        title="Delete?"
        overlayStyle={{ opacity: 0.5 }}
        surfaceStyle={{ padding: 16 }}
        titleStyle={{ fontSize: 20 }}
      >
        <Text>Body text</Text>
      </Dialog>,
    );
    expect(screen.getByTestId("dlg-scrim").props.style).toMatchObject({
      opacity: 0.5,
    });
    expect(screen.getByTestId("dlg").props.style).toMatchObject({
      padding: 16,
    });
    expect(screen.getByText("Delete?").props.style).toMatchObject({
      fontSize: 20,
    });
  });

  it("renders the actions row content", async () => {
    await render(
      <Dialog testID="dlg" defaultOpen actions={<Text>Confirm</Text>}>
        <Text>Body text</Text>
      </Dialog>,
    );
    expect(screen.getByText("Body text")).toBeTruthy();
    expect(screen.getByText("Confirm")).toBeTruthy();
  });
});
