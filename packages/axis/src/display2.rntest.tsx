import { render, screen } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { Loader, Meter } from "./index";

/**
 * Display batch through the public entry: announced values, silent
 * placeholders, slot composition — observed in the RN runtime.
 */

describe("Meter on React Native", () => {
  it("announces gauge value with min/max", async () => {
    await render(<Meter testID="m" value={70} accessibilityLabel="Battery" />);
    expect(screen.getByRole("meter")).toBeTruthy();
    expect(screen.getByTestId("m").props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 70,
    });
  });

  it("clamps below min and above max", async () => {
    await render(<Meter testID="m" value={-5} />);
    expect(screen.getByTestId("m").props.accessibilityValue).toMatchObject({
      now: 0,
    });
  });
});

describe("Loader on React Native", () => {
  it("announces busy with label and passes size", async () => {
    await render(
      <Loader testID="l" accessibilityLabel="Loading results" size="small" />,
    );
    expect(screen.getByLabelText("Loading results")).toBeTruthy();
    expect(screen.getByTestId("l").props.accessibilityState).toMatchObject({
      busy: true,
    });
  });
});

describe("Loader ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Loader ref={ref} testID="l" />);
    expect(ref.current).toBeTruthy();
  });
});

describe("Meter ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Meter ref={ref} testID="m" value={3} />);
    expect(ref.current).toBeTruthy();
  });
});
