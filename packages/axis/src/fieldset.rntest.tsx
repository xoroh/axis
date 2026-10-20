import { render, screen } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { FieldsetLegend, FieldsetRoot, Input } from "./index";

/**
 * FieldsetRoot through the public entry: legend grouping — observed in
 * the RN runtime, not assumed.
 */

describe("FieldsetRoot on React Native", () => {
  it("renders legend and grouped children", async () => {
    await render(
      <FieldsetRoot testID="fs" legend="Address">
        <Input testID="ta" aria-label="Street" />
      </FieldsetRoot>,
    );
    expect(screen.getByText("Address")).toBeTruthy();
    expect(screen.getByTestId("ta")).toBeTruthy();
  });

  it("omits the legend when absent", async () => {
    await render(
      <FieldsetRoot testID="fs">
        <Input testID="ta" />
      </FieldsetRoot>,
    );
    expect(screen.getByTestId("fs")).toBeTruthy();
    expect(screen.getByTestId("ta")).toBeTruthy();
  });
});

describe("FieldsetRoot ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<FieldsetRoot ref={ref} testID="f" legend="Group" />);
    expect(ref.current).toBeTruthy();
  });

  it("composes the legend part", async () => {
    await render(
      <FieldsetRoot testID="fs">
        <FieldsetLegend testID="fs-legend">Address</FieldsetLegend>
        <Input testID="ta" aria-label="Street" />
      </FieldsetRoot>,
    );
    expect(screen.getByTestId("fs-legend")).toBeTruthy();
    expect(screen.getByText("Address")).toBeTruthy();
  });
});
