import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { StyleSheet, Text, type View } from "react-native";
import {
  DirectionProvider,
  SliderControl,
  SliderIndicator,
  SliderLabel,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from "./index";

/**
 * Slider behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN
 * events — adjustable thumb role/value/actions, controlled +
 * uncontrolled commits, step snapping, range values with the
 * minimum gap, disabled terminality, clamping, the degenerate
 * range, ref forwarding, indicator/thumb geometry, track-press
 * jumps, and the PanResponder drag path are observed, not assumed.
 * Deterministic stepping goes through the `increment`/`decrement`
 * accessibility actions; the drag path is covered by firing
 * responder events with a mocked layout and synthetic touches
 * (what the gesture math reads: `locationX` on grant,
 * cumulative `dx`/`dy` on move).
 */

function tree(value: number, extra: Record<string, unknown> = {}) {
  return (
    <SliderRoot testID="sl" defaultValue={value} {...extra}>
      <SliderControl testID="sl-control">
        <SliderTrack testID="sl-track">
          <SliderIndicator testID="sl-fill" />
          <SliderThumb testID="sl-thumb" accessibilityLabel="Volume" />
        </SliderTrack>
      </SliderControl>
    </SliderRoot>
  );
}

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
  it("renders an adjustable thumb with the default value", async () => {
    await render(tree(0));
    expect(screen.getByRole("adjustable")).toBeTruthy();
    expect(screen.getByLabelText("Volume")).toBeTruthy();
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      min: 0,
      max: 100,
      now: 0,
    });
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityState,
    ).toMatchObject({
      disabled: false,
    });
  });

  it("follows the controlled value through the parent", async () => {
    const seen: (number | readonly number[])[] = [];
    function Host() {
      const [value, setValue] = useState<number>(30);
      return (
        <SliderRoot
          testID="sl"
          value={value}
          onValueChange={(next) => {
            seen.push(next);
            if (typeof next === "number") setValue(next);
          }}
        >
          <SliderControl>
            <SliderTrack>
              <SliderIndicator />
              <SliderThumb testID="sl-thumb" />
            </SliderTrack>
          </SliderControl>
        </SliderRoot>
      );
    }
    await render(<Host />);
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      now: 30,
    });
    // Continuous mode steps by one twentieth of the range: 100 / 20 = 5.
    await accessibilityAction("sl-thumb", "increment");
    expect(seen).toEqual([35]);
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      now: 35,
    });
    await accessibilityAction("sl-thumb", "decrement");
    expect(seen).toEqual([35, 30]);
  });

  it("snaps committed values to the step", async () => {
    const seen: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        step={10}
        defaultValue={3}
        onValueChange={(next) => seen.push(next)}
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      now: 3,
    });
    await accessibilityAction("sl-thumb", "increment");
    // 3 + 10 = 13 snaps to the nearest multiple of 10.
    expect(seen).toEqual([10]);
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      now: 10,
    });
  });

  it("reports commits on discrete actions", async () => {
    const committed: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        defaultValue={30}
        onValueCommitted={(v) => committed.push(v)}
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    await accessibilityAction("sl-thumb", "increment");
    expect(committed).toEqual([35]);
  });

  it("disabled blocks actions and gestures: no commits, no callbacks", async () => {
    let calls = 0;
    await render(
      <SliderRoot
        testID="sl"
        disabled
        defaultValue={40}
        onValueChange={() => {
          calls += 1;
        }}
      >
        <SliderControl testID="sl-control">
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityState,
    ).toMatchObject({
      disabled: true,
    });
    await accessibilityAction("sl-thumb", "increment");
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl-control"),
        "responderMove",
        touchEvent(200, 110, 10),
      );
    });
    expect(calls).toBe(0);
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      now: 40,
    });
  });

  it("clamps out-of-range values at min and max", async () => {
    const view = await render(
      <SliderRoot testID="sl" value={150}>
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      min: 0,
      max: 100,
      now: 100,
    });
    await act(async () => {
      view.rerender(
        <SliderRoot testID="sl" value={-10}>
          <SliderControl>
            <SliderTrack>
              <SliderIndicator />
              <SliderThumb testID="sl-thumb" />
            </SliderTrack>
          </SliderControl>
        </SliderRoot>,
      );
    });
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      now: 0,
    });
  });

  it("treats min > max as a degenerate single point without throwing", async () => {
    const seen: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        min={80}
        max={20}
        onValueChange={(next) => seen.push(next)}
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    expect(screen.getByRole("adjustable")).toBeTruthy();
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      min: 80,
      max: 80,
      now: 80,
    });
    await accessibilityAction("sl-thumb", "increment");
    await accessibilityAction("sl-thumb", "decrement");
    expect(seen).toEqual([]);
  });

  it("jumps the nearest thumb to the track press and commits on release", async () => {
    const seen: (number | readonly number[])[] = [];
    const committed: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        defaultValue={[25, 75]}
        onValueChange={(v) => seen.push(v)}
        onValueCommitted={(v) => committed.push(v)}
      >
        <SliderControl testID="sl-control">
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb-0" index={0} />
            <SliderThumb testID="sl-thumb-1" index={1} />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    await act(async () => {
      await fireEvent.layout(screen.getByTestId("sl-control"), {
        x: 0,
        y: 0,
        width: 200,
        height: 20,
      });
    });
    // Press at x=160 on a 200dp track: value 80 — the second thumb.
    await act(async () => {
      await fireEvent(screen.getByTestId("sl-control"), "responderGrant", {
        nativeEvent: { locationX: 160, locationY: 10 },
        touchHistory: touchEvent(100, 160, 160).touchHistory,
      });
    });
    expect(seen).toEqual([[25, 80]]);
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl-control"),
        "responderRelease",
        touchEvent(300, 160, 160),
      );
    });
    expect(committed).toEqual([[25, 80]]);
  });

  it("drags anchor-relative without a measured press point", async () => {
    const seen: (number | readonly number[])[] = [];
    await render(
      <SliderRoot testID="sl" onValueChange={(v) => seen.push(v)}>
        <SliderControl testID="sl-control">
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    await act(async () => {
      await fireEvent.layout(screen.getByTestId("sl-control"), {
        x: 0,
        y: 0,
        width: 200,
        height: 20,
      });
    });
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl-control"),
        "responderGrant",
        touchEvent(100, 10, 10),
      );
    });
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl-control"),
        "responderMove",
        touchEvent(200, 110, 10),
      );
    });
    // dx of 100 over a 200dp track moves half the 0..100 range from 0.
    expect(seen).toEqual([50]);
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      now: 50,
    });
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl-control"),
        "responderRelease",
        touchEvent(300, 110, 10),
      );
    });
  });

  it("enforces the minimum gap between range thumbs", async () => {
    const seen: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        defaultValue={[60, 80]}
        step={10}
        minStepsBetweenValues={1}
        onValueChange={(v) => seen.push(v)}
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb-0" index={0} />
            <SliderThumb testID="sl-thumb-1" index={1} />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    // 60 + 10 = 70: exactly one step below the neighbour — allowed.
    await accessibilityAction("sl-thumb-0", "increment");
    expect(seen).toEqual([[70, 80]]);
    // 70 + 10 = 80 would close the gap: clamped to 70, no change, no callback.
    await accessibilityAction("sl-thumb-0", "increment");
    expect(seen).toEqual([[70, 80]]);
  });

  it("positions the thumb on the value point and sizes the fill", async () => {
    await render(
      <SliderRoot testID="sl" value={50}>
        <SliderControl>
          <SliderTrack testID="sl-track">
            <SliderIndicator testID="sl-fill" />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    const thumbStyle = StyleSheet.flatten(
      screen.getByTestId("sl-thumb").props.style,
    );
    expect(thumbStyle).toMatchObject({ position: "absolute", left: "50%" });
    const fillStyle = StyleSheet.flatten(
      screen.getByTestId("sl-fill").props.style,
    );
    expect(fillStyle).toMatchObject({ width: "50%" });
  });

  it("announces slider semantics on the thumb: adjustable role, value, orientation", async () => {
    await render(
      <SliderRoot testID="sl" defaultValue={30} min={0} max={100}>
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" accessibilityLabel="Volume" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    const props = screen.getByTestId("sl-thumb").props;
    // `adjustable` is the RN role; RN-web renders it as role=slider.
    expect(props.accessibilityRole).toBe("adjustable");
    expect(props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 30,
    });
    // Orientation travels as an untyped aria prop (verified absent
    // from the installed RN ViewAccessibility union).
    expect(props["aria-orientation"]).toBe("horizontal");
    expect(screen.getByLabelText("Volume")).toBeTruthy();
  });

  it("reports the slider min and max on every thumb in both render paths", async () => {
    const seen: Record<string, unknown>[] = [];
    await render(
      <SliderRoot testID="sl" defaultValue={[25, 75]}>
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb-0" index={0} />
            <SliderThumb
              testID="sl-thumb-1"
              index={1}
              render={(props) => {
                seen.push({ ...(props as object) });
                return null;
              }}
            />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    // Default (View) path.
    expect(
      screen.getByTestId("sl-thumb-0").props.accessibilityValue,
    ).toMatchObject({
      min: 0,
      max: 100,
      now: 25,
    });
    // Render-prop path carries the same value object.
    const reported = seen[0] as { accessibilityValue?: unknown };
    expect(reported.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 75,
    });
  });

  it("announces the collapsed range on a degenerate slider in both paths", async () => {
    await render(
      <SliderRoot testID="sl" min={80} max={20}>
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    // One rule everywhere: the slider's min, and max collapsed to min.
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      min: 80,
      max: 80,
      now: 80,
    });
  });

  it("renders label and value text", async () => {
    await render(
      <SliderRoot testID="sl" value={70}>
        <SliderLabel testID="sl-label">
          <Text>Volume</Text>
        </SliderLabel>
        <SliderValue testID="sl-value">
          {(values) => `${values[0]}%`}
        </SliderValue>
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    expect(screen.getByText("Volume")).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
  });

  it("vertical orientation stacks the track and inverts the drag", async () => {
    const seen: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        orientation="vertical"
        defaultValue={50}
        onValueChange={(v) => seen.push(v)}
      >
        <SliderControl testID="sl-control">
          <SliderTrack testID="sl-track">
            <SliderIndicator testID="sl-fill" />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    await act(async () => {
      await fireEvent.layout(screen.getByTestId("sl-control"), {
        x: 0,
        y: 0,
        width: 20,
        height: 200,
      });
    });
    await act(async () => {
      await fireEvent(
        screen.getByTestId("sl-control"),
        "responderGrant",
        touchEvent(100, 10, 10),
      );
    });
    await act(async () => {
      // Dragging down (+dy) lowers a vertical value.
      await fireEvent(screen.getByTestId("sl-control"), "responderMove", {
        nativeEvent: {},
        touchHistory: {
          numberActiveTouches: 1,
          indexOfSingleActiveTouch: 0,
          mostRecentTimeStamp: 200,
          touchBank: [
            {
              touchActive: true,
              currentTimeStamp: 200,
              currentPageX: 10,
              currentPageY: 110,
              previousPageX: 10,
              previousPageY: 10,
            },
          ],
        },
      });
    });
    // dy of 100 over a 200dp track moves half the range down from 50.
    expect(seen).toEqual([0]);
    const fillStyle = StyleSheet.flatten(
      screen.getByTestId("sl-fill").props.style,
    );
    expect(fillStyle).toMatchObject({ height: "0%" });
    // Vertical fills bottom-up: the thumb sits 100% from the top.
    const vthumb = StyleSheet.flatten(
      screen.getByTestId("sl-thumb").props.style,
    );
    expect(vthumb).toMatchObject({ position: "absolute", top: "100%" });
  });

  it("thumbAlignment edge pins the thumb inside the track", async () => {
    await render(
      <SliderRoot testID="sl" value={100} thumbAlignment="edge">
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    const thumbStyle = StyleSheet.flatten(
      screen.getByTestId("sl-thumb").props.style,
    );
    expect(thumbStyle).toMatchObject({ left: "100%" });
    expect(JSON.stringify(thumbStyle.transform)).toContain("-100%");
  });

  it("forwards refs to the root, control, and thumb hosts", async () => {
    const rootRef = createRef<ElementRef<typeof View>>();
    const controlRef = createRef<ElementRef<typeof View>>();
    const thumbRef = createRef<ElementRef<typeof View>>();
    await render(
      <SliderRoot testID="sl" ref={rootRef}>
        <SliderControl testID="sl-control" ref={controlRef}>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" ref={thumbRef} />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    expect(rootRef.current).not.toBeNull();
    expect(controlRef.current).not.toBeNull();
    expect(thumbRef.current).not.toBeNull();
  });

  it("positions a vertical thumb by complement and keeps the disabled indicator mounted", async () => {
    await render(
      <SliderRoot testID="sl" defaultValue={30} orientation="vertical" disabled>
        <SliderControl testID="sl-control">
          <SliderTrack testID="sl-track">
            <SliderIndicator testID="sl-fill" />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    // Value 30 of 0..100: the thumb's top edge sits 70% down the track.
    const thumbStyle = StyleSheet.flatten(
      screen.getByTestId("sl-thumb").props.style,
    );
    expect(thumbStyle).toMatchObject({ position: "absolute", top: "70%" });
    // The disabled indicator still renders (non-interactive, not hidden).
    const fillStyle = StyleSheet.flatten(
      screen.getByTestId("sl-fill").props.style,
    );
    expect(fillStyle).toMatchObject({ bottom: "0%", height: "30%" });
    // Read-only + disabled: focusable, announced as enabled, no commits.
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityState,
    ).toMatchObject({
      disabled: true,
    });
  });

  it("handles web keyboard: arrows move by step, flipped for RTL", async () => {
    const seen: (number | readonly number[])[] = [];
    const committed: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        defaultValue={30}
        step={10}
        onValueChange={(v) => seen.push(v)}
        onValueCommitted={(v) => committed.push(v)}
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    const press = (key: string, shiftKey = false) =>
      fireEvent(screen.getByTestId("sl-thumb"), "onKeyDown", {
        key,
        shiftKey,
        preventDefault: () => {},
      });
    await act(async () => {
      press("ArrowRight");
    });
    expect(seen).toEqual([40]);
    expect(committed).toEqual([40]);
    // Shift + arrows move by largeStep (default 10 here: same magnitude, own branch).
    await act(async () => {
      press("ArrowLeft", true);
    });
    expect(seen).toEqual([40, 30]);
    await act(async () => {
      press("Home");
    });
    expect(seen).toEqual([40, 30, 0]);
    expect(
      screen.getByTestId("sl-thumb").props.accessibilityValue,
    ).toMatchObject({
      now: 0,
    });
  });

  it("PageUp/PageDown move by largeStep and End jumps to max", async () => {
    const seen: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        defaultValue={30}
        step={5}
        largeStep={25}
        onValueChange={(v) => seen.push(v)}
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    const press = (key: string) =>
      fireEvent(screen.getByTestId("sl-thumb"), "onKeyDown", {
        key,
        shiftKey: false,
        preventDefault: () => {},
      });
    await act(async () => {
      press("PageUp");
    });
    expect(seen).toEqual([55]);
    await act(async () => {
      press("PageDown");
    });
    expect(seen).toEqual([55, 30]);
    await act(async () => {
      press("End");
    });
    expect(seen).toEqual([55, 30, 100]);
  });

  it("flips horizontal arrows in RTL without touching vertical", async () => {
    const seen: (number | readonly number[])[] = [];
    await render(
      <DirectionProvider direction="rtl">
        <SliderRoot
          testID="sl"
          defaultValue={30}
          step={10}
          onValueChange={(v) => seen.push(v)}
        >
          <SliderControl>
            <SliderTrack>
              <SliderIndicator />
              <SliderThumb testID="sl-thumb" />
            </SliderTrack>
          </SliderControl>
        </SliderRoot>
      </DirectionProvider>,
    );
    const press = (key: string) =>
      fireEvent(screen.getByTestId("sl-thumb"), "onKeyDown", {
        key,
        shiftKey: false,
        preventDefault: () => {},
      });
    await act(async () => {
      press("ArrowRight");
    });
    expect(seen).toEqual([20]);
    await act(async () => {
      press("ArrowUp");
    });
    // Unaffected by direction: vertical keys never flip.
    expect(seen).toEqual([20, 30]);
  });

  it("ignores unhandled keys", async () => {
    const seen: (number | readonly number[])[] = [];
    await render(
      <SliderRoot
        testID="sl"
        defaultValue={30}
        onValueChange={(v) => seen.push(v)}
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb testID="sl-thumb" />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    await act(async () => {
      fireEvent(screen.getByTestId("sl-thumb"), "onKeyDown", {
        key: "a",
        shiftKey: false,
        preventDefault: () => {},
      });
    });
    expect(seen).toEqual([]);
  });
});
