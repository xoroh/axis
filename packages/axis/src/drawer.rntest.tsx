import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text as RNText, type View } from "react-native";
import {
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerHandle,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
  PortalHost,
} from "./index";

/**
 * Drawer compound parts through the public entry. Edge-anchored panel
 * with scrim dismissal and side anchoring, plus snap points from
 * measured layout, drag-to-dismiss vs snap-back, drag-to-snap with
 * settle reporting, handle expand/collapse/dismiss actions,
 * controlled following, focus move/restore, and ref forwarding —
 * observed in the RN runtime. Drags go through the real PanResponder
 * with synthetic touch histories (the Slider precedent);
 * velocity-triggered dismissal is not synthesized (the distance
 * trigger is the pinned path).
 *
 * The popup carries `testID` itself; the portal container carries
 * `<portal-testID>-container` and the backdrop `<testID>-scrim`.
 */

function touchBank(
  timeStamp: number,
  currentX: number,
  currentY: number,
  previousX: number,
  previousY: number,
) {
  return {
    nativeEvent: {},
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: timeStamp,
      touchBank: [
        {
          touchActive: true,
          currentTimeStamp: timeStamp,
          currentPageX: currentX,
          currentPageY: currentY,
          previousPageX: previousX,
          previousPageY: previousY,
        },
      ],
    },
  };
}

async function layoutContainer(width: number, height: number) {
  await act(async () => {
    await fireEvent.layout(screen.getByTestId("drawer-portal-container"), {
      x: 0,
      y: 0,
      width,
      height,
    });
  });
}

async function drag(dx: number, dy: number) {
  const surface = screen.getByTestId("drawer");
  await act(async () => {
    await fireEvent(
      surface,
      "responderGrant",
      touchBank(100, 200, 400, 200, 400),
    );
  });
  await act(async () => {
    await fireEvent(
      surface,
      "responderMove",
      touchBank(200, 200 + dx, 400 + dy, 200, 400),
    );
  });
  await act(async () => {
    await fireEvent(
      surface,
      "responderRelease",
      touchBank(300, 200 + dx, 400 + dy, 200, 400),
    );
  });
}

function translateOf(testID: string): number {
  const style = screen.getByTestId(testID).props.style;
  const flat = Array.isArray(style) ? style.flat(10) : [style];
  const transforms = flat
    .filter(Boolean)
    .flatMap(
      (s: {
        transform?: Array<{ translateX?: number; translateY?: number }>;
      }) => s.transform ?? [],
    );
  return (
    transforms.find(
      (t) => t.translateX !== undefined || t.translateY !== undefined,
    )?.translateX ??
    transforms.find((t) => t.translateY !== undefined)?.translateY ??
    Number.NaN
  );
}

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(
      screen.getByLabelText(label, { includeHiddenElements: true }),
    );
  });
}

function Shell({
  onOpen,
  onDismiss,
  onSnap,
  side = "left",
  snapPoints,
  dismissable,
  modal,
  defaultOpen = true,
  children,
}: {
  onOpen?: (open: boolean, details?: { reason: string }) => void;
  onDismiss?: () => void;
  onSnap?: (p: number | string) => void;
  side?: "left" | "right" | "top" | "bottom";
  snapPoints?: (number | string)[];
  dismissable?: boolean;
  modal?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <DrawerRoot
      defaultOpen={defaultOpen}
      side={side}
      snapPoints={snapPoints}
      dismissable={dismissable}
      modal={modal}
      onOpenChange={onOpen}
      onDismiss={onDismiss}
      onSnapPointChange={onSnap}
    >
      <DrawerTrigger testID="drawer-trigger">
        <RNText>Open drawer</RNText>
      </DrawerTrigger>
      <DrawerPortal testID="drawer-portal">
        <DrawerBackdrop testID="drawer-scrim" />
        <DrawerPopup testID="drawer" aria-label="App navigation">
          <DrawerHandle testID="drawer-handle" />
          <DrawerTitle>Navigation</DrawerTitle>
          <DrawerDescription>Destinations</DrawerDescription>
          {children}
          <DrawerClose testID="drawer-close">
            <RNText>Close</RNText>
          </DrawerClose>
        </DrawerPopup>
      </DrawerPortal>
    </DrawerRoot>
  );
}

describe("Drawer compound parts on React Native", () => {
  it("renders nothing when closed", async () => {
    await render(
      <PortalHost>
        <Shell defaultOpen={false} />
      </PortalHost>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the dialog surface when open", async () => {
    await render(
      <PortalHost>
        <Shell />
      </PortalHost>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Destinations")).toBeTruthy();
  });

  it("dismisses through the scrim with onDismiss before onOpenChange", async () => {
    const order: string[] = [];
    await render(
      <PortalHost>
        <Shell
          onDismiss={() => order.push("dismiss")}
          onOpen={(open, details) =>
            order.push(`change:${String(open)}:${details?.reason}`)
          }
        />
      </PortalHost>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    await pressLabel("Dismiss");
    expect(order).toEqual(["dismiss", "change:false:outside-press"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders an inert scrim when not dismissable", async () => {
    await render(
      <PortalHost>
        <Shell dismissable={false} />
      </PortalHost>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("renders an inert scrim when non-modal", async () => {
    await render(
      <PortalHost>
        <Shell modal={false} />
      </PortalHost>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("non-modal popups claim no modality", async () => {
    await render(
      <PortalHost>
        <Shell modal={false} />
      </PortalHost>,
    );
    expect(
      screen.getByTestId("drawer").props.accessibilityViewIsModal,
    ).not.toBe(true);
  });

  it("anchors to the trailing edge on the right side", async () => {
    await render(
      <PortalHost>
        <Shell side="right" />
      </PortalHost>,
    );
    const flat: Record<string, unknown> = Object.assign(
      {},
      ...(Array.isArray(screen.getByTestId("drawer").props.style)
        ? screen.getByTestId("drawer").props.style
        : [screen.getByTestId("drawer").props.style]
      ).filter(Boolean),
    );
    expect(flat.right).toBe(0);
    expect(flat.left).toBeUndefined();
  });

  it("forwards a ref to the surface", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <DrawerRoot defaultOpen>
          <DrawerPortal testID="drawer-portal">
            <DrawerBackdrop testID="drawer-scrim" />
            <DrawerPopup testID="drawer" ref={ref}>
              <RNText>Destinations</RNText>
            </DrawerPopup>
          </DrawerPortal>
        </DrawerRoot>
      </PortalHost>,
    );
    expect(ref.current).toBeTruthy();
  });

  it("moves screen-reader focus into the popup on open", async () => {
    const focusSpy = jest.fn();
    // No Title part here: the scope resolves no default, so the popup
    // itself is the move-in target and the duck-typed imperative path
    // (synchronous) observes it.
    await render(
      <PortalHost>
        <DrawerRoot defaultOpen>
          <DrawerPortal testID="drawer-portal">
            <DrawerBackdrop testID="drawer-scrim" />
            <DrawerPopup
              testID="drawer"
              aria-label="App navigation"
              ref={(node) => {
                if (node) {
                  (node as { focus?: () => void }).focus = focusSpy;
                }
              }}
            >
              <RNText>Destinations</RNText>
            </DrawerPopup>
          </DrawerPortal>
        </DrawerRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("drawer")).toBeTruthy();
    expect(focusSpy).toHaveBeenCalled();
  });

  it("toggles with the trigger-press reason", async () => {
    const changed: Array<{ open: boolean; reason?: string }> = [];
    await render(
      <PortalHost>
        <Shell
          defaultOpen={false}
          onOpen={(open, details) =>
            changed.push({ open, reason: details?.reason })
          }
        />
      </PortalHost>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("drawer-trigger"));
    });
    expect(changed).toEqual([{ open: true, reason: "trigger-press" }]);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("closes with the close-press reason", async () => {
    const changed: Array<{ open: boolean; reason?: string }> = [];
    await render(
      <PortalHost>
        <Shell
          onOpen={(open, details) =>
            changed.push({ open, reason: details?.reason })
          }
        />
      </PortalHost>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("drawer-close"));
    });
    expect(changed).toEqual([{ open: false, reason: "close-press" }]);
  });
});

describe("Drawer snap points (folded Sheet)", () => {
  it("rests at the first snap point of the measured container", async () => {
    await render(
      <PortalHost>
        <Shell side="bottom" snapPoints={[0.5, 1]} />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(400);
  });

  it("rests fully open by default with no snap points given", async () => {
    await render(
      <PortalHost>
        <Shell side="bottom" />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(0);
  });

  it("dismisses on a downward drag past the dismiss distance", async () => {
    const order: string[] = [];
    await render(
      <PortalHost>
        <Shell
          side="bottom"
          snapPoints={[0.5, 1]}
          onDismiss={() => order.push("dismiss")}
          onOpen={(open, details) =>
            order.push(`change:${String(open)}:${details?.reason}`)
          }
        />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    await drag(0, 200);
    // Drag-release dismissal reports `none`: Base UI has no
    // gesture-dismiss reason, and a drag is neither an outside press
    // nor a close press.
    expect(order).toEqual(["dismiss", "change:false:none"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("snaps back on a short drag and stays open", async () => {
    const seen: Array<number | string> = [];
    await render(
      <PortalHost>
        <Shell
          side="bottom"
          snapPoints={[0.5, 1]}
          onSnap={(p) => seen.push(p)}
        />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    await drag(0, 20);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(translateOf("drawer")).toBe(400);
    // Settling to the already-active snap point changes nothing, so the
    // shared controllable-state semantic reports nothing (Object.is).
    expect(seen).toEqual([]);
  });

  it("settles to the nearest snap point on an upward drag", async () => {
    const seen: Array<number | string> = [];
    await render(
      <PortalHost>
        <Shell
          side="bottom"
          snapPoints={[0.5, 1]}
          onSnap={(p) => seen.push(p)}
        />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    await drag(0, -300);
    expect(seen).toEqual([1]);
    expect(translateOf("drawer")).toBe(0);
  });

  it("moves through handle expand/collapse actions, collapsing at the floor dismisses", async () => {
    const dismissed: boolean[] = [];
    const snaps: Array<number | string> = [];
    await render(
      <PortalHost>
        <Shell
          side="bottom"
          snapPoints={[0.5, 1]}
          onDismiss={() => dismissed.push(true)}
          onSnap={(p) => snaps.push(p)}
        />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    const handle = screen.getByTestId("drawer-handle");
    await act(async () => {
      await fireEvent(handle, "accessibilityAction", {
        nativeEvent: { actionName: "expand" },
      });
    });
    expect(snaps).toEqual([1]);
    await act(async () => {
      await fireEvent(handle, "accessibilityAction", {
        nativeEvent: { actionName: "collapse" },
      });
    });
    expect(snaps).toEqual([1, 0.5]);
    await act(async () => {
      await fireEvent(handle, "accessibilityAction", {
        nativeEvent: { actionName: "collapse" },
      });
    });
    expect(dismissed).toEqual([true]);
  });

  it("handle tap expands one snap", async () => {
    const snaps: Array<number | string> = [];
    await render(
      <PortalHost>
        <Shell
          side="bottom"
          snapPoints={[0.5, 1]}
          onSnap={(p) => snaps.push(p)}
        />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    await act(async () => {
      fireEvent.press(screen.getByTestId("drawer-handle"));
    });
    expect(snaps).toEqual([1]);
    expect(translateOf("drawer")).toBe(0);
  });

  it("handle dismiss action closes with the close-press reason", async () => {
    const changed: Array<{ open: boolean; reason?: string }> = [];
    await render(
      <PortalHost>
        <Shell
          side="bottom"
          onOpen={(open, details) =>
            changed.push({ open, reason: details?.reason })
          }
        />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    await act(async () => {
      await fireEvent(
        screen.getByTestId("drawer-handle"),
        "accessibilityAction",
        {
          nativeEvent: { actionName: "dismiss" },
        },
      );
    });
    expect(changed).toEqual([{ open: false, reason: "close-press" }]);
  });

  it("follows controlled snap point values", async () => {
    function Host() {
      const [o, setO] = useState(true);
      const [point, setPoint] = useState<number | string>(0.5);
      return (
        <DrawerRoot
          side="bottom"
          open={o}
          onOpenChange={setO}
          snapPoints={[0.5, 1]}
          snapPoint={point}
          onSnapPointChange={setPoint}
        >
          <DrawerPortal testID="drawer-portal">
            <DrawerBackdrop testID="drawer-scrim" />
            <DrawerPopup testID="drawer">
              <DrawerHandle testID="drawer-handle" />
            </DrawerPopup>
          </DrawerPortal>
        </DrawerRoot>
      );
    }
    await render(
      <PortalHost>
        <Host />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(400);
    const handle = screen.getByTestId("drawer-handle");
    await act(async () => {
      await fireEvent(handle, "accessibilityAction", {
        nativeEvent: { actionName: "expand" },
      });
    });
    expect(translateOf("drawer")).toBe(0);
  });

  it("resolves non-positive snap points to fully open without throwing", async () => {
    await render(
      <PortalHost>
        <Shell side="bottom" snapPoints={[Number.NaN, -1, 0]} />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(0);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("supports dp and px snap points as visible sizes", async () => {
    await render(
      <PortalHost>
        <Shell side="bottom" snapPoints={[200, "400px"]} />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    // First snap: 200dp visible of 800 → offset 600.
    expect(translateOf("drawer")).toBe(600);
  });

  it("snaps a side drawer along the horizontal axis", async () => {
    await render(
      <PortalHost>
        <Shell side="left" snapPoints={[0.5, 1]} />
      </PortalHost>,
    );
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(-200);
  });
});
