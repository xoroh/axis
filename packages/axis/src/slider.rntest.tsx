import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { StyleSheet, type View } from "react-native";
import { Slider } from "./index";

/**
 * Slider behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * role/value announcements, controlled + uncontrolled commits,
 * step snapping, disabled terminality, clamping, the degenerate
 * range, ref forwarding, style passthrough, and the PanResponder drag
 * path are observed, not assumed. Deterministic stepping goes through
 * the `increment`/`decrement` accessibility actions; the drag path is
 * covered by firing the responder events with a mocked layout and a
 * synthetic touch history (what the PanResponder machinery reads).
 */

async function accessibilityAction(testID: string, actionName: string) {
  await act(async () => {
    await fireEvent(screen.getByTestId(testID), "accessibilityAction", {
      nativeEvent: { actionName },
    });
  });
}

function touchEvent(
  timeStamp: number,
  currentPageX: number,
  previousPageX: number,
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
          currentPageX,
          currentPageY: 0,
          previousPageX,
          previousPageY: 0,
        },
      ],
    },
  };
}

describe("Slider on React Native", () => {
  it("renders the slider role with the default value", async () => {
    await render(<Slider testID="sl" accessibilityLabel="Volume" />);
    expect(screen.getByRole("slider")).toBeTruthy();
    expect(screen.getByLabelText("Volume")).toBeTruthy();
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 0,
    });
    expect(screen.getByTestId("sl").props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("follows the controlled value through the parent", async () => {
    const seen: number[] = [];
    function Host() {
      const [value, setValue] = useState(30);
      return (
        <Slider
          testID="sl"
          value={value}
          onValueChange={(next) => {
            seen.push(next);
            setValue(next);
          }}
        />
      );
    }
    await render(<Host />);
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 30,
    });
    // Continuous mode steps by one twentieth of the range: 100 / 20 = 5.
    await accessibilityAction("sl", "increment");
    expect(seen).toEqual([35]);
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 35,
    });
    await accessibilityAction("sl", "decrement");
    expect(seen).toEqual([35, 30]);
  });

  it("snaps committed values to the step", async () => {
    const seen: number[] = [];
    await render(
      <Slider
        testID="sl"
        step={10}
        defaultValue={3}
        onValueChange={(next) => seen.push(next)}
      />,
    );
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 3,
    });
    await accessibilityAction("sl", "increment");
    // 3 + 10 = 13 snaps to the nearest multiple of 10.
    expect(seen).toEqual([10]);
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 10,
    });
  });

  it("disabled blocks actions and gestures: no commits, no callbacks", async () => {
    let calls = 0;
    await render(
      <Slider
        testID="sl"
        disabled
        defaultValue={40}
        onValueChange={() => (calls += 1)}
      />,
    );
    expect(screen.getByTestId("sl").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await accessibilityAction("sl", "increment");
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl"),
        "responderMove",
        touchEvent(200, 110, 10),
      );
    });
    expect(calls).toBe(0);
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 40,
    });
  });

  it("clamps out-of-range values at min and max", async () => {
    const view = await render(<Slider testID="sl" value={150} />);
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 100,
    });
    await act(async () => {
      view.rerender(<Slider testID="sl" value={-10} />);
    });
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 0,
    });
    // Stepping down at the floor stays at the floor.
    await accessibilityAction("sl", "decrement");
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 0,
    });
  });

  it("treats min > max as a degenerate single point without throwing", async () => {
    const seen: number[] = [];
    await render(
      <Slider
        testID="sl"
        min={80}
        max={20}
        onValueChange={(next) => seen.push(next)}
      />,
    );
    expect(screen.getByRole("slider")).toBeTruthy();
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      min: 80,
      max: 80,
      now: 80,
    });
    await accessibilityAction("sl", "increment");
    await accessibilityAction("sl", "decrement");
    expect(seen).toEqual([]);
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 80,
    });
  });

  it("forwards a ref to the track container host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Slider testID="sl" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("passes caller styles through without imposing any", async () => {
    await render(
      <Slider
        testID="sl"
        value={50}
        style={{ opacity: 0.5 }}
        trackStyle={{ backgroundColor: "red" }}
        fillStyle={{ backgroundColor: "blue" }}
        thumbStyle={{ width: 20 }}
      />,
    );
    const track = screen.getByTestId("sl");
    expect(StyleSheet.flatten(track.props.style)).toMatchObject({
      opacity: 0.5,
      backgroundColor: "red",
    });
    const innerStyles = track
      .queryAll(
        (node: { type: string; props: { style?: unknown } }) =>
          typeof node.type === "string" && node.props.style !== undefined,
      )
      .map((node) => StyleSheet.flatten(node.props.style));
    expect(innerStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ width: "50%", backgroundColor: "blue" }),
        expect.objectContaining({ width: 20 }),
      ]),
    );
  });

  it("drags through the PanResponder path using the measured track width", async () => {
    const seen: number[] = [];
    await render(
      <Slider testID="sl" onValueChange={(next) => seen.push(next)} />,
    );
    await act(async () => {
      await fireEvent.layout(screen.getByTestId("sl"), {
        x: 0,
        y: 0,
        width: 200,
        height: 20,
      });
    });
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl"),
        "responderGrant",
        touchEvent(100, 10, 10),
      );
    });
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl"),
        "responderMove",
        touchEvent(200, 110, 10),
      );
    });
    // dx of 100 over a 200dp track moves half the 0..100 range from 0.
    expect(seen).toEqual([50]);
    expect(screen.getByTestId("sl").props.accessibilityValue).toMatchObject({
      now: 50,
    });
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl"),
        "responderRelease",
        touchEvent(300, 110, 10),
      );
    });
    // Release re-commits the same value — no duplicate callback.
    expect(seen).toEqual([50]);
  });
});
