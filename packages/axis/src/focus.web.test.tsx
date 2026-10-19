/// <reference lib="dom" />
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

vi.mock("react-native", async () => {
  const web = await import("react-native-web");
  return web;
});

// The mocked `react-native` below does not install the `__DEV__`
// global the real runtime guarantees; the Portal contract reads it.
(globalThis as { __DEV__?: boolean }).__DEV__ = true;

import {
  AlertDialogClose,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  DrawerHandle,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  PopoverPopup,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
  PortalHost,
} from "./index";

/**
 * Focus on web (React Native Web): DOM `.focus()` move-in, restore to
 * the trigger, the D11 ancestor fallback, `aria-modal`, and the modal
 * Tab trap — through the real components with `react-native-web`
 * standing in for `react-native` (no new dependency: the example app
 * already ships it; the mock is per-file).
 */

describe("Dialog focus on web", () => {
  it("moves DOM focus to the first tabbable on open", () => {
    render(
      <PortalHost>
        <DialogRoot defaultOpen>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup accessibilityLabel="Example">
            <button type="button" data-testid="first">
              First
            </button>
            <DialogTitle>Title</DialogTitle>
            <DialogClose>Close</DialogClose>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </PortalHost>,
    );
    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });

  it("prefers the popup title when nothing is tabbable", () => {
    render(
      <PortalHost>
        <DialogRoot defaultOpen>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup accessibilityLabel="Example">
            <DialogTitle>Title</DialogTitle>
            <span>Body</span>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </PortalHost>,
    );
    // The title host is the scope fallback (jsdom focuses any element;
    // real browsers need the web tabIndex the popup sets — covered by
    // the aria-modal/trap assertions below landing on real tabbables).
    expect(document.activeElement?.textContent).toBe("Title");
  });

  it("exposes aria-modal and traps Tab inside modal popups", () => {
    render(
      <PortalHost>
        <DialogRoot defaultOpen>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup accessibilityLabel="Example">
            <button type="button" data-testid="first">
              First
            </button>
            <DialogClose>Close</DialogClose>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </PortalHost>,
    );
    const popup = screen.getByRole("dialog", { name: "Example" });
    expect(popup.getAttribute("aria-modal")).toBe("true");
    // Wrap from last to first.
    const close = screen.getByRole("button", { name: "Close" });
    close.focus();
    fireEvent.keyDown(popup, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(screen.getByTestId("first"));
    // Non-Tab keys pass through.
    fireEvent.keyDown(popup, { key: "a" });
    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });

  it("restores DOM focus to the trigger on close", () => {
    const { rerender } = render(
      <PortalHost>
        <DialogRoot open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup accessibilityLabel="Example">
            <button type="button">Action</button>
            <DialogClose>Close</DialogClose>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </PortalHost>,
    );
    expect(document.activeElement?.textContent).toBe("Action");
    rerender(
      <PortalHost>
        <DialogRoot open={false}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup accessibilityLabel="Example">
            <button type="button">Action</button>
            <DialogClose>Close</DialogClose>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </PortalHost>,
    );
    expect(document.activeElement?.textContent).toBe("Open");
  });

  it("falls back to the nearest focusable ancestor when the trigger unmounted (D11)", () => {
    const { rerender } = render(
      <div tabIndex={0} data-testid="anchor-wrap">
        <PortalHost>
          <DialogRoot open>
            <DialogTrigger>Open</DialogTrigger>
            <DialogPortal>
              <DialogBackdrop />
              <DialogPopup accessibilityLabel="Example">
                <button type="button">Action</button>
              </DialogPopup>
            </DialogPortal>
          </DialogRoot>
        </PortalHost>
      </div>,
    );
    expect(document.activeElement?.textContent).toBe("Action");
    // The trigger unmounts in the same commit that closes: restore
    // cannot reach it, so the stashed focusable ancestor takes focus.
    rerender(
      <div tabIndex={0} data-testid="anchor-wrap">
        <PortalHost>
          <DialogRoot open={false}>
            <DialogPortal>
              <DialogBackdrop />
              <DialogPopup accessibilityLabel="Example">
                <button type="button">Action</button>
              </DialogPopup>
            </DialogPortal>
          </DialogRoot>
        </PortalHost>
      </div>,
    );
    expect(document.activeElement).toBe(screen.getByTestId("anchor-wrap"));
  });

  it("initialFocus=false keeps focus where it is", () => {
    render(
      <PortalHost>
        <DialogRoot defaultOpen>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup accessibilityLabel="Example" initialFocus={false}>
            <button type="button" data-testid="first">
              First
            </button>
          </DialogPopup>
        </DialogPortal>
      </DialogRoot>
    </PortalHost>,
    );
    expect(document.activeElement).toBe(document.body);
  });

  it("initialFocus functions receive the open interaction", () => {
    const seen: string[] = [];
    function Opener() {
      return (
        <DialogRoot>
          <DialogTrigger>Open</DialogTrigger>
          <DialogPortal>
            <DialogBackdrop />
            <DialogPopup
              accessibilityLabel="Example"
              initialFocus={(interaction) => {
                seen.push(interaction);
                return null;
              }}
            >
              <button type="button" data-testid="first">
                First
              </button>
            </DialogPopup>
          </DialogPortal>
        </DialogRoot>
      );
    }
    render(
      <PortalHost>
        <Opener />
      </PortalHost>,
    );
    expect(seen).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(seen).toEqual(["trigger-press"]);
    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });
});

describe("AlertDialog focus on web", () => {
  it("prefers the marked Cancel over earlier tabbables", () => {
    render(
      <PortalHost>
        <AlertDialogRoot defaultOpen>
        <AlertDialogPortal>
          <AlertDialogPopup accessibilityLabel="Discard?">
            <button type="button">Destructive</button>
            <AlertDialogTitle>Discard?</AlertDialogTitle>
            <AlertDialogClose initialFocus>Cancel</AlertDialogClose>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialogRoot>
    </PortalHost>,
    );
    expect(document.activeElement?.textContent).toBe("Cancel");
  });
});

describe("Drawer focus on web", () => {
  it("defaults to the title, never a destructive action", () => {
    render(
      <PortalHost>
        <DrawerRoot defaultOpen>
        <DrawerPortal>
          <DrawerPopup accessibilityLabel="Navigation">
            <button type="button">Destructive</button>
            <DrawerTitle>Navigation</DrawerTitle>
            <DrawerHandle />
          </DrawerPopup>
        </DrawerPortal>
      </DrawerRoot>
    </PortalHost>,
    );
    // skipStops: the DOM query is skipped too — the title wins over
    // the earlier tabbable button.
    expect(document.activeElement?.textContent).toBe("Navigation");
  });
});

describe("Popover focus on web", () => {
  it("non-modal popovers move focus but claim no modality", () => {
    render(
      <PortalHost>
        <PopoverRoot defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverPopup accessibilityLabel="Details">
            <button type="button" data-testid="pop-first">
              First
            </button>
          </PopoverPopup>
        </PopoverPortal>
      </PopoverRoot>
    </PortalHost>,
    );
    expect(document.activeElement).toBe(screen.getByTestId("pop-first"));
    const box = screen.getByTestId("pop-first").parentElement;
    expect(box?.getAttribute("aria-modal")).toBeNull();
  });
});
