import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text as RNText, type View } from "react-native";
import { Sheet } from "./index";

/**
 * Sheet behavior through the public entry. Mount/unmount presence,
 * scrim dismissal, detent resting positions from measured layout,
 * drag-to-dismiss vs snap-back, drag-to-snap with settle reporting,
 * expand/collapse accessibility actions, controlled following, and
 * ref forwarding — observed in the RN runtime. Drags go through the
 * real PanResponder with synthetic touch histories (the Slider
 * precedent); velocity-triggered dismissal is not synthesized (the
 * distance trigger is the pinned path).
 */

function touchBank(
  timeStamp: number,
  currentPageY: number,
  previousPageY: number,
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
          currentPageX: 200,
          currentPageY,
          previousPageX: 200,
          previousPageY,
        },
      ],
    },
  };
}

async function layoutContainer(height: number) {
  await act(async () => {
    await fireEvent.layout(screen.getByTestId("sh-container"), {
      x: 0,
      y: 0,
      width: 400,
      height,
    });
  });
}

async function drag(dy: number) {
  const surface = screen.getByTestId("sh");
  await act(async () => {
    await fireEvent(surface, "responderGrant", touchBank(100, 400, 400));
  });
  await act(async () => {
    await fireEvent(surface, "responderMove", touchBank(200, 400 + dy, 400));
  });
  await act(async () => {
    await fireEvent(surface, "responderRelease", touchBank(300, 400 + dy, 400));
  });
}

function translateYOf(testID: string): number {
  const style = screen.getByTestId(testID).props.style;
  const flat = Array.isArray(style) ? style.flat(10) : [style];
  const transform = flat
    .filter(Boolean)
    .flatMap(
      (s: { transform?: Array<{ translateY?: number }> }) => s.transform ?? [],
    );
  return (
    transform.find((t) => t.translateY !== undefined)?.translateY ?? Number.NaN
  );
}

describe("Sheet on React Native", () => {
  it("renders nothing when closed", async () => {
    await render(<Sheet testID="sh" title="Filters" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens with the dialog role and title", async () => {
    await render(
      <Sheet testID="sh" defaultOpen title="Filters">
        <RNText>Content</RNText>
      </Sheet>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Filters")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("dismisses through the scrim with onDismiss before onOpenChange", async () => {
    const order: string[] = [];
    await render(
      <Sheet
        testID="sh"
        defaultOpen
        onDismiss={() => order.push("dismiss")}
        onOpenChange={() => order.push("change")}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Dismiss"));
    });
    expect(order).toEqual(["dismiss", "change"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders an inert scrim when not dismissable", async () => {
    let dismissed = 0;
    await render(
      <Sheet
        testID="sh"
        defaultOpen
        dismissable={false}
        onDismiss={() => (dismissed += 1)}
      />,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(dismissed).toBe(0);
  });

  it("rests at the first detent of the measured container", async () => {
    await render(<Sheet testID="sh" defaultOpen detents={[0.5, 1]} />);
    await layoutContainer(800);
    expect(translateYOf("sh")).toBe(400);
  });

  it("dismisses on a downward drag past the dismiss distance", async () => {
    const order: string[] = [];
    await render(
      <Sheet
        testID="sh"
        defaultOpen
        detents={[0.5, 1]}
        onDismiss={() => order.push("dismiss")}
        onOpenChange={() => order.push("change")}
      />,
    );
    await layoutContainer(800);
    await drag(200);
    expect(order).toEqual(["dismiss", "change"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("snaps back on a short drag and stays open", async () => {
    const seen: number[] = [];
    await render(
      <Sheet
        testID="sh"
        defaultOpen
        detents={[0.5, 1]}
        onSnapIndexChange={(i) => seen.push(i)}
      />,
    );
    await layoutContainer(800);
    await drag(20);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(translateYOf("sh")).toBe(400);
    // Settling to the already-active detent changes nothing, so the
    // shared controllable-state semantic reports nothing (Object.is).
    expect(seen).toEqual([]);
  });

  it("settles to the nearest detent on an upward drag", async () => {
    const seen: number[] = [];
    await render(
      <Sheet
        testID="sh"
        defaultOpen
        detents={[0.5, 1]}
        onSnapIndexChange={(i) => seen.push(i)}
      />,
    );
    await layoutContainer(800);
    await drag(-300);
    expect(seen).toEqual([1]);
    expect(translateYOf("sh")).toBe(0);
  });

  it("moves through expand/collapse actions, collapsing at the floor dismisses", async () => {
    const dismissed: boolean[] = [];
    const snaps: number[] = [];
    await render(
      <Sheet
        testID="sh"
        defaultOpen
        detents={[0.5, 1]}
        onDismiss={() => dismissed.push(true)}
        onSnapIndexChange={(i) => snaps.push(i)}
      />,
    );
    await layoutContainer(800);
    const surface = screen.getByTestId("sh");
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
    expect(snaps).toEqual([1, 0]);
    await act(async () => {
      await fireEvent(surface, "accessibilityAction", {
        nativeEvent: { actionName: "collapse" },
      });
    });
    expect(dismissed).toEqual([true]);
  });

  it("follows controlled open and snap index", async () => {
    function Host() {
      const [open, setOpen] = useState(true);
      const [snap, setSnap] = useState(0);
      return (
        <Sheet
          testID="sh"
          open={open}
          onOpenChange={setOpen}
          detents={[0.5, 1]}
          snapIndex={snap}
          onSnapIndexChange={setSnap}
        />
      );
    }
    await render(<Host />);
    await layoutContainer(800);
    expect(translateYOf("sh")).toBe(400);
    const surface = screen.getByTestId("sh");
    await act(async () => {
      await fireEvent(surface, "accessibilityAction", {
        nativeEvent: { actionName: "expand" },
      });
    });
    expect(translateYOf("sh")).toBe(0);
  });

  it("resolves garbage detents to fully open without throwing", async () => {
    await render(
      <Sheet testID="sh" defaultOpen detents={[5, Number.NaN, -1]} />,
    );
    await layoutContainer(800);
    expect(translateYOf("sh")).toBe(0);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("forwards a ref to the surface", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Sheet testID="sh" defaultOpen ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});
