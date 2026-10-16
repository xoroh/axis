import { render, screen } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import type { Text as HostTextType } from "react-native";
import { Text } from "./index";

/**
 * Text behavior through the public entry. Readable content with an
 * explicit label source, truncation passthrough, and ref forwarding —
 * observed in the RN runtime, not assumed. Carries no type scale by
 * design (caller style only); that absence is asserted by having no
 * scale prop to exercise.
 */

describe("Text on React Native", () => {
  it("renders children as readable text", async () => {
    await render(<Text testID="t">Airplane mode</Text>);
    expect(screen.getByText("Airplane mode")).toBeTruthy();
    expect(screen.getByTestId("t")).toBeTruthy();
  });

  it("announces the label source when provided", async () => {
    await render(
      <Text testID="t" accessibilityLabel="Airplane mode, on">
        On
      </Text>,
    );
    expect(screen.getByLabelText("Airplane mode, on")).toBeTruthy();
  });

  it("passes truncation props to the host", async () => {
    await render(
      <Text testID="t" numberOfLines={1} ellipsizeMode="tail">
        A very long line
      </Text>,
    );
    const host = screen.getByTestId("t");
    expect(host.props.numberOfLines).toBe(1);
    expect(host.props.ellipsizeMode).toBe("tail");
  });

  it("passes selectable to the host", async () => {
    await render(
      <Text testID="t" selectable>
        Copy me
      </Text>,
    );
    expect(screen.getByTestId("t").props.selectable).toBe(true);
  });

  it("forwards a ref to the host text element", async () => {
    const ref = createRef<ElementRef<typeof HostTextType>>();
    await render(<Text ref={ref}>Ref target</Text>);
    expect(ref.current).toBeTruthy();
    expect(screen.getByText("Ref target")).toBeTruthy();
  });

  it("accepts a header role passthrough", async () => {
    await render(
      <Text testID="t" accessibilityRole="header">
        Settings
      </Text>,
    );
    expect(screen.getByRole("header")).toBeTruthy();
  });
});
