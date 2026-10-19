import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { BackHandler, Text, View } from "react-native";
import {
  Overlay,
  OverlayBackdrop,
  OverlayClose,
  OverlayPopup,
  OverlayPortal,
  OverlayRoot,
  OverlayTrigger,
  PortalHost,
  useModalActive,
  useOverlay,
  useScrollLock,
} from "./index";

/** Payload the back-button listener receives; unused by the overlay. */
type BackHandlerPayload = Parameters<
  Parameters<typeof BackHandler.addEventListener>[1]
>[0];

/**
 * Native overlay root on PortalHost through the public entry.
 * Every assertion observes the real RN runtime behavior:
 * 1. PortalHost rendering and inline fallback when no host is matched.
 * 2. Dismissable layer: outside press on backdrop (armed only when topmost),
 *    Android hardware back button via BackHandler (topmost consumes event).
 * 3. Stacking order: nested/multiple overlays with monotonic zIndex,
 *    top-layer isolation (pointerEvents "auto" vs "box-none", accessibilityElementsHidden).
 * 4. Focus restoration to trigger or finalFocus on close.
 * 5. Modal scroll lock via useScrollLock().
 * 6. Compound Overlay.* namespace parity.
 */

function OverlayExample({
  open: controlledOpen,
  onOpenChange,
  dismissable = true,
  modal = true,
  testPrefix = "ov",
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dismissable?: boolean;
  modal?: boolean;
  testPrefix?: string;
}) {
  return (
    <OverlayRoot
      open={controlledOpen}
      onOpenChange={onOpenChange}
      dismissable={dismissable}
      modal={modal}
    >
      <OverlayTrigger testID={`${testPrefix}-trigger`}>
        <Text>Open {testPrefix}</Text>
      </OverlayTrigger>
      <OverlayPortal testID={`${testPrefix}-portal`}>
        <OverlayBackdrop testID={`${testPrefix}-backdrop`} />
        <OverlayPopup
          testID={`${testPrefix}-popup`}
          accessibilityLabel={testPrefix}
        >
          <Text>Content of {testPrefix}</Text>
          <OverlayClose testID={`${testPrefix}-close`}>
            <Text>Close {testPrefix}</Text>
          </OverlayClose>
        </OverlayPopup>
      </OverlayPortal>
    </OverlayRoot>
  );
}

function StackedOverlays({
  onCloseLayer1,
  onCloseLayer2,
}: {
  onCloseLayer1?: () => void;
  onCloseLayer2?: () => void;
}) {
  const [open1, setOpen1] = useState(true);
  const [open2, setOpen2] = useState(true);

  return (
    <PortalHost testID="host">
      <OverlayRoot
        open={open1}
        onOpenChange={(next) => {
          setOpen1(next);
          if (!next) onCloseLayer1?.();
        }}
      >
        <OverlayPortal testID="layer1-portal">
          <OverlayBackdrop testID="layer1-backdrop" />
          <OverlayPopup testID="layer1-popup">
            <Text>Layer 1</Text>
          </OverlayPopup>
        </OverlayPortal>
      </OverlayRoot>

      <OverlayRoot
        open={open2}
        onOpenChange={(next) => {
          setOpen2(next);
          if (!next) onCloseLayer2?.();
        }}
      >
        <OverlayPortal testID="layer2-portal">
          <OverlayBackdrop testID="layer2-backdrop" />
          <OverlayPopup testID="layer2-popup">
            <Text>Layer 2</Text>
          </OverlayPopup>
        </OverlayPortal>
      </OverlayRoot>
    </PortalHost>
  );
}

function ScrollLockProbe({ testID }: { testID: string }) {
  const locked = useScrollLock();
  return <Text testID={testID}>{locked ? "locked" : "unlocked"}</Text>;
}

function ContextProbe({ testID }: { testID: string }) {
  const overlay = useOverlay();
  return (
    <Text testID={testID}>
      {JSON.stringify({
        open: overlay.open,
        modal: overlay.modal,
        isTop: overlay.isTop,
        stackIndex: overlay.stackIndex,
      })}
    </Text>
  );
}

describe("OverlayRoot on React Native", () => {
  it("renders trigger and paints portal content at PortalHost when open", async () => {
    await render(
      <PortalHost testID="host">
        <OverlayExample open={true} />
      </PortalHost>,
    );

    // The trigger sits BEHIND an open modal layer, so it is hidden
    // from assistive tech (modality on the top popup) — querying it
    // needs the hidden-element opt-in. The backdrop scrim is a sibling
    // of the modal popup, so the same rule hides it on iOS (on Android
    // the labelled scrim stays reachable — see overlay.md).
    expect(
      screen.getByTestId("ov-trigger", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByTestId("ov-portal")).toBeTruthy();
    expect(
      screen.getByTestId("ov-backdrop", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByTestId("ov-popup")).toBeTruthy();
    expect(screen.getByText("Content of ov")).toBeTruthy();
  });

  it("does not render portal content when closed", async () => {
    await render(
      <PortalHost testID="host">
        <OverlayExample open={false} />
      </PortalHost>,
    );

    expect(screen.getByTestId("ov-trigger")).toBeTruthy();
    expect(screen.queryByTestId("ov-portal")).toBeNull();
    expect(screen.queryByTestId("ov-backdrop")).toBeNull();
    expect(screen.queryByTestId("ov-popup")).toBeNull();
  });

  it("renders nothing when PortalHost is omitted and warns in dev", async () => {
    // No in-box fallback (pre-release contract): an overlay without
    // a host has nowhere to present, so it renders nothing.
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map((part) => String(part)).join(" "));
    };
    try {
      await render(
        <View testID="container">
          <OverlayExample open={true} />
        </View>,
      );
    } finally {
      console.warn = originalWarn;
    }

    expect(screen.getByTestId("container")).toBeTruthy();
    expect(screen.queryByTestId("ov-portal")).toBeNull();
    expect(screen.queryByText("Content of ov")).toBeNull();
    expect(warnings.some((w) => w.includes("PortalHost"))).toBe(true);
  });

  it("dismisses on backdrop outside press when dismissable", async () => {
    const changes: boolean[] = [];
    await render(
      <PortalHost testID="host">
        <OverlayExample
          open={true}
          dismissable={true}
          onOpenChange={(next) => changes.push(next)}
        />
      </PortalHost>,
    );

    await act(async () => {
      fireEvent.press(
        screen.getByTestId("ov-backdrop", { includeHiddenElements: true }),
      );
    });

    expect(changes).toEqual([false]);
  });

  it("blocks backdrop dismissal when dismissable is false", async () => {
    const changes: boolean[] = [];
    await render(
      <PortalHost testID="host">
        <OverlayExample
          open={true}
          dismissable={false}
          onOpenChange={(next) => changes.push(next)}
        />
      </PortalHost>,
    );

    await act(async () => {
      fireEvent.press(
        screen.getByTestId("ov-backdrop", { includeHiddenElements: true }),
      );
    });

    expect(changes).toEqual([]);
  });

  it("registers Android BackHandler and dismisses topmost overlay only", async () => {
    const addListenerSpy = jest.spyOn(BackHandler, "addEventListener");
    const changes1: boolean[] = [];
    const changes2: boolean[] = [];

    await render(
      <PortalHost testID="host">
        <OverlayExample
          open={true}
          testPrefix="one"
          onOpenChange={(next) => changes1.push(next)}
        />
        <OverlayExample
          open={true}
          testPrefix="two"
          onOpenChange={(next) => changes2.push(next)}
        />
      </PortalHost>,
    );

    expect(addListenerSpy).toHaveBeenCalledWith(
      "hardwareBackPress",
      expect.any(Function),
    );

    const handlers = addListenerSpy.mock.calls
      .filter(([event]) => event === "hardwareBackPress")
      .map(([, handler]) => handler);

    expect(handlers.length).toBeGreaterThanOrEqual(2);
    const handler1 = handlers[0];
    const handler2 = handlers[handlers.length - 1];

    await act(async () => {
      // The BackHandler payload is unused by the overlay's listener.
      const consumed = handler1({} as BackHandlerPayload);
      expect(consumed).toBe(false);
    });
    expect(changes1).toEqual([]);

    await act(async () => {
      const consumed = handler2({} as BackHandlerPayload);
      expect(consumed).toBe(true);
    });
    expect(changes2).toEqual([false]);

    addListenerSpy.mockRestore();
  });

  it("manages stacking with monotonic zIndex and top-layer isolation", async () => {
    await render(
      <PortalHost>
        <StackedOverlays />
      </PortalHost>,
    );

    const portal1 = screen.getByTestId("layer1-portal", {
      includeHiddenElements: true,
    });
    const portal2 = screen.getByTestId("layer2-portal");

    expect(portal1.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ zIndex: 1000 })]),
    );
    expect(portal2.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ zIndex: 1010 })]),
    );

    expect(portal2.props.pointerEvents).toBe("auto");
    expect(portal1.props.pointerEvents).toBe("box-none");

    expect(portal1.props.accessibilityElementsHidden).toBe(true);
    expect(portal2.props.accessibilityElementsHidden).toBe(false);
  });

  it("promotes lower layer to top when top layer closes", async () => {
    const { rerender } = await render(
      <PortalHost>
        <StackedOverlays />
      </PortalHost>,
    );

    expect(
      screen.getByTestId("layer1-portal", { includeHiddenElements: true }).props
        .pointerEvents,
    ).toBe("box-none");

    await rerender(
      <PortalHost testID="host">
        <OverlayRoot open={true}>
          <OverlayPortal testID="layer1-portal">
            <OverlayPopup testID="layer1-popup">
              <Text>Layer 1</Text>
            </OverlayPopup>
          </OverlayPortal>
        </OverlayRoot>
      </PortalHost>,
    );

    const portal1 = screen.getByTestId("layer1-portal");
    expect(portal1.props.pointerEvents).toBe("auto");
    expect(portal1.props.accessibilityElementsHidden).toBe(false);
  });

  it("tracks scroll lock state when modal overlay is open", async () => {
    const { rerender } = await render(
      <PortalHost testID="host">
        <ScrollLockProbe testID="probe" />
        <OverlayExample open={false} modal={true} />
      </PortalHost>,
    );

    expect(screen.getByTestId("probe").props.children).toBe("unlocked");

    await rerender(
      <PortalHost testID="host">
        <ScrollLockProbe testID="probe" />
        <OverlayExample open={true} modal={true} />
      </PortalHost>,
    );

    // The probe sits behind the open modal layer, so it is hidden from
    // assistive tech while the modal is up (the same reason a real
    // screen reader cannot reach content behind a dialog).
    expect(
      screen.getByTestId("probe", { includeHiddenElements: true }).props
        .children,
    ).toBe("locked");
  });

  it("restores focus to trigger or finalFocus on close", async () => {
    const finalRef = createRef<ElementRef<typeof View>>();
    const focusSpy = jest.fn();

    function FocusExample({ open }: { open: boolean }) {
      return (
        <PortalHost testID="host">
          <View
            ref={(node) => {
              if (node) {
                (node as { focus?: () => void }).focus = focusSpy;
              }
              (finalRef as { current: typeof node }).current = node;
            }}
            testID="final-target"
          />
          <OverlayRoot open={open} finalFocus={finalRef}>
            <OverlayPortal testID="f-portal">
              <OverlayPopup testID="f-popup">
                <Text>Focused overlay</Text>
              </OverlayPopup>
            </OverlayPortal>
          </OverlayRoot>
        </PortalHost>
      );
    }

    const { rerender } = await render(
      <PortalHost>
        <FocusExample open={true} />
      </PortalHost>,
    );
    expect(screen.getByTestId("f-popup")).toBeTruthy();

    await rerender(
      <PortalHost>
        <FocusExample open={false} />
      </PortalHost>,
    );
    expect(focusSpy).toHaveBeenCalled();
  });

  it("restores focus to the trigger on close", async () => {
    const triggerFocusSpy = jest.fn();

    function TriggerExample({ open }: { open: boolean }) {
      return (
        <PortalHost testID="host">
          <OverlayRoot open={open}>
            <OverlayTrigger
              testID="t-trigger"
              ref={(node) => {
                if (node) {
                  (node as { focus?: () => void }).focus = triggerFocusSpy;
                }
              }}
            >
              <Text>Open</Text>
            </OverlayTrigger>
            <OverlayPortal testID="t-portal">
              <OverlayPopup testID="t-popup">
                <Text>Content</Text>
              </OverlayPopup>
            </OverlayPortal>
          </OverlayRoot>
        </PortalHost>
      );
    }

    const { rerender } = await render(<TriggerExample open={true} />);
    expect(screen.getByTestId("t-popup")).toBeTruthy();

    await rerender(<TriggerExample open={false} />);
    expect(triggerFocusSpy).toHaveBeenCalled();
  });

  it("reports reasons: trigger-press, outside-press, escape-key, close-press", async () => {
    const seen: Array<{ open: boolean; reason?: string }> = [];
    const { unmount } = await render(
      <PortalHost testID="host">
        <OverlayRoot
          open={true}
          onOpenChange={(next, details) =>
            seen.push({ open: next, reason: details?.reason })
          }
        >
          <OverlayTrigger testID="r-trigger">
            <Text>Open</Text>
          </OverlayTrigger>
          <OverlayPortal testID="r-portal">
            <OverlayBackdrop testID="r-backdrop" />
            <OverlayPopup testID="r-popup">
              <Text>Content</Text>
              <OverlayClose testID="r-close">
                <Text>Close</Text>
              </OverlayClose>
            </OverlayPopup>
          </OverlayPortal>
        </OverlayRoot>
      </PortalHost>,
    );

    // Close press.
    await act(async () => {
      fireEvent.press(screen.getByTestId("r-close"));
    });
    expect(seen).toEqual([{ open: false, reason: "close-press" }]);
    await unmount();

    // Backdrop press on a fresh uncontrolled mount.
    seen.length = 0;
    await render(
      <PortalHost testID="host">
        <OverlayRoot
          defaultOpen
          onOpenChange={(next, details) =>
            seen.push({ open: next, reason: details?.reason })
          }
        >
          <OverlayPortal testID="r-portal">
            <OverlayBackdrop testID="r-backdrop" />
            <OverlayPopup testID="r-popup">
              <Text>Content</Text>
            </OverlayPopup>
          </OverlayPortal>
        </OverlayRoot>
      </PortalHost>,
    );
    await act(async () => {
      fireEvent.press(
        screen.getByTestId("r-backdrop", { includeHiddenElements: true }),
      );
    });
    expect(seen).toEqual([{ open: false, reason: "outside-press" }]);
  });

  it("reports trigger-press on toggle and escape-key on hardware back", async () => {
    const seen: Array<{ open: boolean; reason?: string }> = [];
    const addListenerSpy = jest.spyOn(BackHandler, "addEventListener");
    await render(
      <PortalHost testID="host">
        <OverlayRoot
          defaultOpen={false}
          onOpenChange={(next, details) =>
            seen.push({ open: next, reason: details?.reason })
          }
        >
          <OverlayTrigger testID="b-trigger">
            <Text>Open</Text>
          </OverlayTrigger>
          <OverlayPortal testID="b-portal">
            <OverlayBackdrop testID="b-backdrop" />
            <OverlayPopup testID="b-popup">
              <Text>Content</Text>
            </OverlayPopup>
          </OverlayPortal>
        </OverlayRoot>
      </PortalHost>,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("b-trigger"));
    });
    expect(seen).toEqual([{ open: true, reason: "trigger-press" }]);

    const handler = addListenerSpy.mock.calls
      .map((call) => call[1])
      .find(Boolean);
    expect(handler).toBeDefined();
    await act(async () => {
      handler?.({} as never);
    });
    expect(seen).toEqual([
      { open: true, reason: "trigger-press" },
      { open: false, reason: "escape-key" },
    ]);
    addListenerSpy.mockRestore();
  });

  it("useModalActive reflects modal opens in the shared registry", async () => {
    function ModalProbe() {
      const active = useModalActive();
      return <Text testID="modal-probe">{active ? "modal" : "idle"}</Text>;
    }
    const { rerender } = await render(
      <PortalHost testID="host">
        <ModalProbe />
        <OverlayExample open={false} testPrefix="probe" />
      </PortalHost>,
    );
    expect(screen.getByTestId("modal-probe").props.children).toBe("idle");
    await rerender(
      <PortalHost testID="host">
        <ModalProbe />
        <OverlayExample open={true} testPrefix="probe" />
      </PortalHost>,
    );
    expect(screen.getByTestId("modal-probe").props.children).toBe("modal");
  });

  it("exposes context value via useOverlay() inside OverlayRoot", async () => {
    await render(
      <PortalHost>
        <OverlayRoot open={true} modal={true}>
          <ContextProbe testID="ctx" />
        </OverlayRoot>
      </PortalHost>,
    );

    const data = JSON.parse(screen.getByTestId("ctx").props.children);
    expect(data.open).toBe(true);
    expect(data.modal).toBe(true);
    expect(data.isTop).toBe(true);
    expect(data.stackIndex).toBe(0);
  });

  it("compound Overlay.* namespace matches named component exports", async () => {
    await render(
      <PortalHost testID="host">
        <Overlay.Root defaultOpen={false}>
          <Overlay.Trigger testID="cmp-trigger">
            <Text>Open</Text>
          </Overlay.Trigger>
          <Overlay.Portal testID="cmp-portal">
            <Overlay.Backdrop testID="cmp-backdrop" />
            <Overlay.Popup testID="cmp-popup">
              <Text>Compound content</Text>
              <Overlay.Close testID="cmp-close">
                <Text>Close</Text>
              </Overlay.Close>
            </Overlay.Popup>
          </Overlay.Portal>
        </Overlay.Root>
      </PortalHost>,
    );

    expect(screen.getByTestId("cmp-trigger")).toBeTruthy();
    expect(screen.queryByTestId("cmp-portal")).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId("cmp-trigger"));
    });

    expect(screen.getByTestId("cmp-portal")).toBeTruthy();
    expect(screen.getByTestId("cmp-popup")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("cmp-close"));
    });

    expect(screen.queryByTestId("cmp-portal")).toBeNull();
  });
});
