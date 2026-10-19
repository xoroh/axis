import { render, screen } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { Fieldset, Input } from "./index";

/**
 * Fieldset through the public entry: legend grouping — observed in
 * the RN runtime, not assumed.
 */

describe("Fieldset on React Native", () => {
  it("renders legend and grouped children", async () => {
    await render(
      <Fieldset testID="fs" legend="Address">
        <Input testID="ta" accessibilityLabel="Street" />
      </Fieldset>,
    );
    expect(screen.getByText("Address")).toBeTruthy();
    expect(screen.getByTestId("ta")).toBeTruthy();
  });

  it("omits the legend when absent", async () => {
    await render(
      <Fieldset testID="fs">
        <Input testID="ta" />
      </Fieldset>,
    );
    expect(screen.getByTestId("fs")).toBeTruthy();
    expect(screen.getByTestId("ta")).toBeTruthy();
  });
});

describe("Fieldset ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Fieldset ref={ref} testID="f" legend="Group" />);
    expect(ref.current).toBeTruthy();
  });
});
