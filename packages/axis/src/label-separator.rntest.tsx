import { render, screen } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import type { Text, View } from "react-native";
import { Label, Separator } from "./index";

/**
 * Label + Separator through the public entry. Static structure with
 * honest semantics: Label associates by nativeID, Separator stays
 * silent (no invented role).
 */

describe("Label on React Native", () => {
  it("renders content with association id and caller style", async () => {
    await render(
      <Label testID="lb" nativeID="email-label" style={{ fontSize: 12 }}>
        Email
      </Label>,
    );
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByTestId("lb").props.nativeID).toBe("email-label");
    expect(screen.getByTestId("lb").props.style).toMatchObject({
      fontSize: 12,
    });
  });
});

describe("Separator on React Native", () => {
  it("renders a silent divider with caller style", async () => {
    await render(<Separator testID="sep" style={{ height: 1 }} />);
    const node = screen.getByTestId("sep");
    expect(node.props.accessible).toBe(false);
    expect(node.props.style).toMatchObject({ height: 1 });
  });
});

describe("Label ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof Text>>();
    await render(
      <Label ref={ref} testID="l">
        Name
      </Label>,
    );
    expect(ref.current).toBeTruthy();
  });
});

describe("Separator ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Separator ref={ref} testID="s" />);
    expect(ref.current).toBeTruthy();
  });
});
