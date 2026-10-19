import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text as RNText, type View } from "react-native";
import { Drawer } from "./index";

/**
 * Drawer behavior through the public entry. Edge-anchored panel with
 * scrim dismissal and side anchoring, plus the folded Sheet: snap
 * points from measured layout, drag-to-dismiss vs snap-back,
 * drag-to-snap with settle reporting, expand/collapse accessibility
 * actions, controlled following, and ref forwarding — observed in the
 * RN runtime. Drags go through the real PanResponder with synthetic
 * touch histories (the Slider precedent); velocity-triggered dismissal
 * is not synthesized (the distance trigger is the pinned path).
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
    await fireEvent.layout(screen.getByTestId("drawer-container"), {
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
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("Drawer on React Native", () => {
  it("renders nothing when closed", async () => {
    await render(
      <Drawer testID="drawer" accessibilityLabel="App navigation">
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the dialog surface when open", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen accessibilityLabel="App navigation">
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Destinations")).toBeTruthy();
  });

  it("dismisses through the scrim with onDismiss before onOpenChange", async () => {
    const order: string[] = [];
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        onDismiss={() => order.push("dismiss")}
        onOpenChange={() => order.push("change")}
      >
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    await pressLabel("Dismiss");
    expect(order).toEqual(["dismiss", "change"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders an inert scrim when not dismissable", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen dismissable={false}>
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("renders an inert scrim when non-modal", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen modal={false}>
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("anchors to the trailing edge on the right side", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen side="right">
        <RNText>Destinations</RNText>
      </Drawer>,
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
      <Drawer defaultOpen ref={ref}>
        <RNText>Destinations</RNText>
      </Drawer>,
    );
    expect(ref.current).toBeTruthy();
  });
});

describe("Drawer snap points (folded Sheet)", () => {
  it("rests at the first snap point of the measured container", async () => {
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        side="bottom"
        snapPoints={[0.5, 1]}
      />,
    );
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(400);
  });

  it("rests fully open by default with no snap points given", async () => {
    await render(<Drawer testID="drawer" defaultOpen side="bottom" />);
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(0);
  });

  it("dismisses on a downward drag past the dismiss distance", async () => {
    const order: string[] = [];
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        side="bottom"
        snapPoints={[0.5, 1]}
        onDismiss={() => order.push("dismiss")}
        onOpenChange={() => order.push("change")}
      />,
    );
    await layoutContainer(400, 800);
    await drag(0, 200);
    expect(order).toEqual(["dismiss", "change"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("snaps back on a short drag and stays open", async () => {
    const seen: Array<number | string> = [];
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        side="bottom"
        snapPoints={[0.5, 1]}
        onSnapPointChange={(p) => seen.push(p)}
      />,
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
      <Drawer
        testID="drawer"
        defaultOpen
        side="bottom"
        snapPoints={[0.5, 1]}
        onSnapPointChange={(p) => seen.push(p)}
      />,
    );
    await layoutContainer(400, 800);
    await drag(0, -300);
    expect(seen).toEqual([1]);
    expect(translateOf("drawer")).toBe(0);
  });

  it("moves through expand/collapse actions, collapsing at the floor dismisses", async () => {
    const dismissed: boolean[] = [];
    const snaps: Array<number | string> = [];
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        side="bottom"
        snapPoints={[0.5, 1]}
        onDismiss={() => dismissed.push(true)}
        onSnapPointChange={(p) => snaps.push(p)}
      />,
    );
    await layoutContainer(400, 800);
    const surface = screen.getByTestId("drawer");
    await act(async () => {
      await fireEvent(surface, "accessibilityAction", {
        nativeEvent: { actionName: "expand" },
      });
    });
    expect(snaps).toEqual([1]);
    await act(async () => {
      await fireEvent(surface, "accessibilityAction", {
        nativeEvent: { actionName: "collapse" },
      });
    });
    expect(snaps).toEqual([1, 0.5]);
    await act(async () => {
      await fireEvent(surface, "accessibilityAction", {
        nativeEvent: { actionName: "collapse" },
      });
    });
    expect(dismissed).toEqual([true]);
  });

  it("follows controlled snap point values", async () => {
    function Host() {
      const [open, setOpen] = useState(true);
      const [point, setPoint] = useState<number | string>(0.5);
      return (
        <Drawer
          testID="drawer"
          side="bottom"
          open={open}
          onOpenChange={setOpen}
          snapPoints={[0.5, 1]}
          snapPoint={point}
          onSnapPointChange={setPoint}
        />
      );
    }
    await render(<Host />);
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(400);
    const surface = screen.getByTestId("drawer");
    await act(async () => {
      await fireEvent(surface, "accessibilityAction", {
        nativeEvent: { actionName: "expand" },
      });
    });
    expect(translateOf("drawer")).toBe(0);
  });

  it("resolves non-positive snap points to fully open without throwing", async () => {
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        side="bottom"
        snapPoints={[Number.NaN, -1, 0]}
      />,
    );
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(0);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("supports dp and px snap points as visible sizes", async () => {
    await render(
      <Drawer
        testID="drawer"
        defaultOpen
        side="bottom"
        snapPoints={[200, "400px"]}
      />,
    );
    await layoutContainer(400, 800);
    // First snap: 200dp visible of 800 → offset 600.
    expect(translateOf("drawer")).toBe(600);
  });

  it("snaps a side drawer along the horizontal axis", async () => {
    await render(
      <Drawer testID="drawer" defaultOpen side="left" snapPoints={[0.5, 1]} />,
    );
    await layoutContainer(400, 800);
    expect(translateOf("drawer")).toBe(-200);
  });
});
