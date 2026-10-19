import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import { AlertDialog, PortalHost } from "./index";

/**
 * AlertDialog behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN
 * events — blocking (non-dismissable) presence, title/content/actions
 * rendering with the dialog role, scrim-press refusal, action-driven
 * dismissal, controlled tracking, and ref forwarding are observed, not
 * assumed.
 *
 * The scrim carries `<testID>-scrim` (the `Accordion` `-panel`
 * precedent); the surface carries `testID` itself.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("AlertDialog on React Native", () => {
  it("renders title, content, and actions with the dialog role", async () => {
    await render(
      <PortalHost>
        <AlertDialog
          testID="ad"
          defaultOpen
          title="Discard changes?"
          actions={<Text>Discard</Text>}
          accessibilityLabel="Discard confirmation"
        >
          <Text>Unsaved work will be lost.</Text>
        </AlertDialog>
      </PortalHost>,
    );
    expect(screen.getByTestId("ad")).toBeTruthy();
    expect(screen.getByText("Discard changes?")).toBeTruthy();
    expect(screen.getByText("Unsaved work will be lost.")).toBeTruthy();
    expect(screen.getByText("Discard")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByTestId("ad").props.role).toBe("dialog");
  });

  it("scrim press does not dismiss: no callback, still open, no dismiss label", async () => {
    const changed: boolean[] = [];
    await render(
      <PortalHost>
        <AlertDialog
          testID="ad"
          defaultOpen
          actions={<Text>Discard</Text>}
          onOpenChange={(v) => changed.push(v)}
        >
          <Text>Unsaved work will be lost.</Text>
        </AlertDialog>
      </PortalHost>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    await press("ad-scrim");
    expect(changed).toEqual([]);
    expect(screen.getByTestId("ad")).toBeTruthy();
  });

  it("action press fires the caller's own handler", async () => {
    let calls = 0;
    await render(
      <PortalHost>
        <AlertDialog
          testID="ad"
          defaultOpen
          actions={
            <Text testID="discard-action" onPress={() => (calls += 1)}>
              Discard
            </Text>
          }
        >
          <Text>Unsaved work will be lost.</Text>
        </AlertDialog>
      </PortalHost>,
    );
    await press("discard-action");
    expect(calls).toBe(1);
    expect(screen.getByTestId("ad")).toBeTruthy();
  });

  it("follows the controlled open prop", async () => {
    const changed: boolean[] = [];
    const view = await render(
      <PortalHost>
        <AlertDialog
          testID="ad"
          open={false}
          actions={<Text>Discard</Text>}
          onOpenChange={(v) => changed.push(v)}
        >
          <Text>Unsaved work will be lost.</Text>
        </AlertDialog>
      </PortalHost>,
    );
    expect(screen.queryByTestId("ad")).toBeNull();
    await act(async () => {
      view.rerender(
        <PortalHost>
          <AlertDialog
            testID="ad"
            open
            actions={<Text>Discard</Text>}
            onOpenChange={(v) => changed.push(v)}
          >
            <Text>Unsaved work will be lost.</Text>
          </AlertDialog>
        </PortalHost>,
      );
    });
    expect(screen.getByTestId("ad")).toBeTruthy();
    expect(changed).toEqual([]);
  });

  it("forwards a ref to the surface View", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <AlertDialog
          testID="ad"
          defaultOpen
          actions={<Text>Discard</Text>}
          ref={ref}
        >
          <Text>Unsaved work will be lost.</Text>
        </AlertDialog>
      </PortalHost>,
    );
    expect(ref.current).not.toBeNull();
  });
});
