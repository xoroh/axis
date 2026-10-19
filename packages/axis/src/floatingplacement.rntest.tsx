import { render, screen, userEvent } from "@testing-library/react-native";
import { useRef } from "react";
import { Pressable, View } from "react-native";
import {
  type MeasurableRef,
  useFloatingPlacement,
} from "./components/useFloatingPlacement";

/**
 * Placement resolving through the hook with an injectable anchor node.
 *
 * The hook reads its anchor through a host ref, so the test supplies
 * the node directly: a web element shape (a rect without `measure`,
 * the way React Native Web host refs behave where `measure` never
 * delivers) and the native shape (a synchronous `measure` callback).
 * Content size arrives through an explicit control — the exact event
 * shape the hook consumes — rather than depending on host layout.
 */

const CONTENT_SIZE = { width: 100, height: 40 };

function Harness({
  node,
  active = true,
}: {
  node: MeasurableRef["current"];
  active?: boolean;
}) {
  const anchorRef = useRef<MeasurableRef["current"]>(node);
  const floating = useFloatingPlacement({ anchorRef, active });
  return (
    <>
      <View testID="floating-box" style={floating.style} />
      <Pressable
        accessibilityLabel="report content size"
        onPress={() =>
          floating.onContentLayout({
            nativeEvent: { layout: { ...CONTENT_SIZE } },
          })
        }
      />
    </>
  );
}

async function reportContentSize() {
  await userEvent.press(screen.getByLabelText("report content size"));
}

function boxStyle(): Record<string, unknown> {
  const style = screen.getByTestId("floating-box").props.style;
  return Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style;
}

describe("useFloatingPlacement anchor shapes", () => {
  it("resolves placement for a web element anchor without measure", async () => {
    // The React Native Web shape: the host ref is the element itself,
    // carrying its viewport rect but no working `measure`. Placement
    // must resolve from the rect — viewport-positioned, real size.
    await render(
      <Harness
        node={{
          getBoundingClientRect: () => ({
            left: 10,
            top: 20,
            width: 100,
            height: 40,
          }),
        }}
      />,
    );
    await reportContentSize();
    expect(boxStyle()).toMatchObject({
      position: "fixed",
      left: 10,
      top: 60,
    });
    expect(boxStyle().opacity).toBeUndefined();
  });

  it("keeps the native measure path absolutely positioned", async () => {
    // The native shape: `measure` reports window coordinates and the
    // popup stays `absolute`. The web fix must not move this path.
    await render(
      <Harness
        node={{
          measure: (callback) => callback(0, 0, 100, 40, 10, 20),
        }}
      />,
    );
    await reportContentSize();
    expect(boxStyle()).toMatchObject({
      position: "absolute",
      left: 10,
      top: 60,
    });
    expect(boxStyle().opacity).toBeUndefined();
  });

  it("stays transparent at origin until content size arrives", async () => {
    await render(
      <Harness
        node={{
          getBoundingClientRect: () => ({
            left: 10,
            top: 20,
            width: 100,
            height: 40,
          }),
        }}
      />,
    );
    expect(boxStyle()).toMatchObject({
      opacity: 0,
      left: 0,
      top: 0,
    });
  });

  it("stays transparent while inactive", async () => {
    await render(
      <Harness
        active={false}
        node={{
          getBoundingClientRect: () => ({
            left: 10,
            top: 20,
            width: 100,
            height: 40,
          }),
        }}
      />,
    );
    await reportContentSize();
    expect(boxStyle()).toMatchObject({ opacity: 0 });
  });
});
