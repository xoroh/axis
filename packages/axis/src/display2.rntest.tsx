import { render, screen } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import {
  MeterIndicator,
  MeterLabel,
  MeterRoot,
  MeterTrack,
  MeterValue,
} from "./index";

/**
 * Display batch through the public entry: announced values, silent
 * placeholders, slot composition — observed in the RN runtime.
 */

describe("Meter on React Native", () => {
  it("announces gauge value with min/max", async () => {
    await render(
      <MeterRoot testID="m" value={70} accessibilityLabel="Battery">
        <MeterTrack testID="m-track">
          <MeterIndicator testID="m-fill" />
        </MeterTrack>
      </MeterRoot>,
    );
    expect(screen.getByRole("meter")).toBeTruthy();
    expect(screen.getByTestId("m").props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 70,
    });
    expect(screen.getByTestId("m-fill")).toBeTruthy();
  });

  it("fills proportionally to the clamped value", async () => {
    await render(
      <MeterRoot testID="m" value={70}>
        <MeterTrack>
          <MeterIndicator testID="m-fill" />
        </MeterTrack>
      </MeterRoot>,
    );
    const style = screen.getByTestId("m-fill").props.style;
    const merged = Object.assign(
      {},
      ...(Array.isArray(style) ? style.flat(Infinity) : [style]),
    );
    expect(merged.width).toBe("70%");
  });

  it("clamps below min and above max", async () => {
    await render(
      <MeterRoot testID="m" value={-5}>
        <MeterTrack>
          <MeterIndicator testID="m-fill" />
        </MeterTrack>
      </MeterRoot>,
    );
    expect(screen.getByTestId("m").props.accessibilityValue).toMatchObject({
      now: 0,
    });
  });

  it("label names and value displays, including function children", async () => {
    await render(
      <MeterRoot testID="m" value={70} accessibilityLabel="Battery">
        <MeterLabel testID="m-label">
          <Text>Battery</Text>
        </MeterLabel>
        <MeterValue testID="m-value">{(v) => `${v}%`}</MeterValue>
      </MeterRoot>,
    );
    expect(screen.getByTestId("m-label")).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
  });

  it("parts outside a root render nothing", async () => {
    await render(
      <MeterTrack testID="orphan-track">
        <MeterIndicator testID="orphan-fill" />
      </MeterTrack>,
    );
    expect(screen.queryByTestId("orphan-track")).toBeNull();
    expect(screen.queryByTestId("orphan-fill")).toBeNull();
  });
});

describe("Meter ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <MeterRoot ref={ref} testID="m" value={3}>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </MeterRoot>,
    );
    expect(ref.current).toBeTruthy();
  });
});
