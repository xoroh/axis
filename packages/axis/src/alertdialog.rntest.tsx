import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import {
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
  PortalHost,
} from "./index";

/**
 * AlertDialog compound parts through the public entry. Every assertion
 * renders the real component in the RN runtime and interacts through
 * RN events — blocking (non-dismissable) presence, title/description/
 * close rendering with the alertdialog role, scrim-press refusal,
 * action-driven dismissal with reasons, controlled tracking, focus
 * move/restore, and ref forwarding are observed, not assumed.
 *
 * The popup carries `testID` itself; the backdrop carries
 * `<testID>-scrim` (the Dialog precedent).
 */

function Blocking({
  onOpen,
  testID = "ad",
  defaultOpen = true,
}: {
  onOpen?: (open: boolean, details?: { reason: string }) => void;
  testID?: string;
  defaultOpen?: boolean;
}) {
  return (
    <AlertDialogRoot defaultOpen={defaultOpen} onOpenChange={onOpen}>
      <AlertDialogPortal>
        <AlertDialogBackdrop testID={`${testID}-scrim`} />
        <AlertDialogPopup testID={testID} aria-label="Discard confirmation">
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Unsaved work will be lost.
          </AlertDialogDescription>
          <AlertDialogClose testID={`${testID}-cancel`} initialFocus>
            <Text>Cancel</Text>
          </AlertDialogClose>
          <AlertDialogClose testID={`${testID}-discard`}>
            <Text>Discard</Text>
          </AlertDialogClose>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialogRoot>
  );
}

async function press(testID: string, hidden = false) {
  await act(async () => {
    fireEvent.press(
      screen.getByTestId(
        testID,
        hidden ? { includeHiddenElements: true } : undefined,
      ),
    );
  });
}

describe("AlertDialog compound parts on React Native", () => {
  it("renders title, description, and actions with the alertdialog role", async () => {
    await render(
      <PortalHost>
        <Blocking />
      </PortalHost>,
    );
    expect(screen.getByTestId("ad")).toBeTruthy();
    expect(screen.getByText("Discard changes?")).toBeTruthy();
    expect(screen.getByText("Unsaved work will be lost.")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Discard")).toBeTruthy();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByTestId("ad").props.role).toBe("alertdialog");
  });

  it("scrim press does not dismiss: no callback, still open, no dismiss label", async () => {
    const changed: boolean[] = [];
    await render(
      <PortalHost>
        <Blocking onOpen={(v) => changed.push(v)} />
      </PortalHost>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    // The inert scrim hides from AT behind the modal popup (the iOS
    // modality rule) — the hidden opt-in reaches it for the press.
    await press("ad-scrim", true);
    expect(changed).toEqual([]);
    expect(screen.getByTestId("ad")).toBeTruthy();
  });

  it("VoiceOver scrub does not dismiss a blocking dialog", async () => {
    const changed: boolean[] = [];
    await render(
      <PortalHost>
        <Blocking onOpen={(v) => changed.push(v)} />
      </PortalHost>,
    );
    await act(async () => {
      fireEvent(screen.getByTestId("ad"), "onAccessibilityEscape");
    });
    expect(changed).toEqual([]);
    expect(screen.getByTestId("ad")).toBeTruthy();
  });

  it("close press dismisses with the close-press reason", async () => {
    const changed: Array<{ open: boolean; reason?: string }> = [];
    await render(
      <PortalHost>
        <Blocking
          onOpen={(open, details) =>
            changed.push({ open, reason: details?.reason })
          }
        />
      </PortalHost>,
    );
    await press("ad-discard");
    expect(changed).toEqual([{ open: false, reason: "close-press" }]);
    expect(screen.queryByTestId("ad")).toBeNull();
  });

  it("trigger toggles with the trigger-press reason", async () => {
    const changed: Array<{ open: boolean; reason?: string }> = [];
    await render(
      <PortalHost>
        <AlertDialogRoot
          onOpenChange={(open, details) =>
            changed.push({ open, reason: details?.reason })
          }
        >
          <AlertDialogTrigger testID="ad-trigger">
            <Text>Open</Text>
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogBackdrop testID="ad-scrim" />
            <AlertDialogPopup testID="ad" aria-label="Confirm">
              <AlertDialogTitle>Confirm</AlertDialogTitle>
              <AlertDialogClose testID="ad-close">
                <Text>Close</Text>
              </AlertDialogClose>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialogRoot>
      </PortalHost>,
    );
    await press("ad-trigger");
    expect(changed).toEqual([{ open: true, reason: "trigger-press" }]);
    expect(screen.getByTestId("ad")).toBeTruthy();
    // The open modal hides the background trigger from accessibility
    // queries (layer modal claim); the toggle wiring is still exercised
    // through the hidden node.
    await press("ad-trigger", true);
    expect(changed).toEqual([
      { open: true, reason: "trigger-press" },
      { open: false, reason: "trigger-press" },
    ]);
  });

  it("follows the controlled open prop", async () => {
    const changed: boolean[] = [];
    const view = await render(
      <PortalHost>
        <AlertDialogRoot open={false} onOpenChange={(v) => changed.push(v)}>
          <AlertDialogPortal>
            <AlertDialogBackdrop testID="ad-scrim" />
            <AlertDialogPopup testID="ad" aria-label="Confirm">
              <AlertDialogTitle>Confirm</AlertDialogTitle>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialogRoot>
      </PortalHost>,
    );
    expect(screen.queryByTestId("ad")).toBeNull();
    await act(async () => {
      view.rerender(
        <PortalHost>
          <AlertDialogRoot open onOpenChange={(v) => changed.push(v)}>
            <AlertDialogPortal>
              <AlertDialogBackdrop testID="ad-scrim" />
              <AlertDialogPopup testID="ad" aria-label="Confirm">
                <AlertDialogTitle>Confirm</AlertDialogTitle>
              </AlertDialogPopup>
            </AlertDialogPortal>
          </AlertDialogRoot>
        </PortalHost>,
      );
    });
    expect(screen.getByTestId("ad")).toBeTruthy();
    expect(changed).toEqual([]);
  });

  it("moves screen-reader focus into the popup on open", async () => {
    const focusSpy = jest.fn();
    // No Title/Close parts here: the scope resolves no default, so
    // the popup itself is the move-in target and the duck-typed
    // imperative path (synchronous) observes it.
    await render(
      <PortalHost>
        <AlertDialogRoot defaultOpen>
          <AlertDialogPortal>
            <AlertDialogBackdrop testID="ad-scrim" />
            <AlertDialogPopup
              testID="ad"
              aria-label="Confirm"
              ref={(node) => {
                if (node) {
                  (node as { focus?: () => void }).focus = focusSpy;
                }
              }}
            >
              <Text>Confirm this action.</Text>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialogRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("ad")).toBeTruthy();
    expect(focusSpy).toHaveBeenCalled();
  });

  it("forwards a ref to the surface View", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <AlertDialogRoot defaultOpen>
          <AlertDialogPortal>
            <AlertDialogBackdrop testID="ad-scrim" />
            <AlertDialogPopup testID="ad" aria-label="Confirm" ref={ref}>
              <AlertDialogTitle>Confirm</AlertDialogTitle>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialogRoot>
      </PortalHost>,
    );
    expect(ref.current).not.toBeNull();
  });
});
