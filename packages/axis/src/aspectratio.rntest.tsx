import { render, screen } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import { StyleSheet, Text, type View } from "react-native";
import { AspectRatio } from "./index";

/**
 * AspectRatio behavior through the public entry. Every assertion renders
 * the real component in the RN runtime — child rendering, the ratio in
 * the flattened style (the style prop is an array, so `flatten` is the
 * honest read), invalid-ratio clamping, and ref forwarding are
 * observed, not assumed.
 */

describe("AspectRatio on React Native", () => {
  it("renders children inside the ratio container", async () => {
    await render(
      <AspectRatio testID="ar" ratio={16 / 9}>
        <Text>Media</Text>
      </AspectRatio>,
    );
    expect(screen.getByTestId("ar")).toBeTruthy();
    expect(screen.getByText("Media")).toBeTruthy();
  });

  it("applies the ratio in the flattened style and clamps invalid ratios to 1", async () => {
    const view = await render(
      <AspectRatio testID="ar" ratio={16 / 9}>
        <Text>Media</Text>
      </AspectRatio>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("ar").props.style),
    ).toMatchObject({ aspectRatio: 16 / 9 });
    await view.rerender(
      <AspectRatio testID="ar" ratio={0}>
        <Text>Media</Text>
      </AspectRatio>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("ar").props.style),
    ).toMatchObject({ aspectRatio: 1 });
  });

  it("forwards a ref to the root view", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <AspectRatio testID="ar" ratio={1} ref={ref}>
        <Text>Media</Text>
      </AspectRatio>,
    );
    expect(ref.current).not.toBeNull();
  });
});
