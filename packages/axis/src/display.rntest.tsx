import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Image, Text, type View } from "react-native";
import { Avatar, Badge, Progress } from "./index";

/**
 * Display primitives through the public entry: announced values,
 * fallback behavior, and honest semantics — observed in the RN
 * runtime, not assumed.
 */

describe("Progress on React Native", () => {
  it("announces role and clamped value", async () => {
    await render(
      <Progress testID="pg" value={42} accessibilityLabel="Loading" />,
    );
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(screen.getByTestId("pg").props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 42,
    });
  });

  it("clamps out-of-range values and fills proportionally", async () => {
    await render(<Progress testID="pg" value={250} max={100} />);
    expect(screen.getByTestId("pg").props.accessibilityValue).toMatchObject({
      now: 100,
    });
  });

  it("indeterminate announces busy with no value", async () => {
    await render(<Progress testID="pg" indeterminate />);
    const props = screen.getByTestId("pg").props;
    expect(props.accessibilityState).toMatchObject({ busy: true });
    expect(props.accessibilityValue).toBeUndefined();
  });
});

describe("Badge on React Native", () => {
  it("renders content with caller style and label", async () => {
    await render(
      <Badge testID="bd" accessibilityLabel="3 unread" style={{ opacity: 1 }}>
        3
      </Badge>,
    );
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByLabelText("3 unread")).toBeTruthy();
    expect(screen.getByTestId("bd").props.style).toMatchObject({ opacity: 1 });
  });
});

describe("Avatar on React Native", () => {
  it("shows fallback content without a source", async () => {
    await render(
      <Avatar testID="av" accessibilityLabel="Ada">
        <Text>AD</Text>
      </Avatar>,
    );
    expect(screen.getByTestId("av")).toBeTruthy();
    expect(screen.getByLabelText("Ada")).toBeTruthy();
  });

  it("shows the image with role and label when sourced", async () => {
    await render(
      <Avatar
        testID="av"
        accessibilityLabel="Ada"
        source={{ uri: "https://example.com/ada.png" }}
      />,
    );
    expect(screen.getByRole("image")).toBeTruthy();
    expect(screen.getByLabelText("Ada")).toBeTruthy();
  });

  it("falls back after a load error", async () => {
    await render(
      <Avatar testID="av" source={{ uri: "https://example.com/nope.png" }} />,
    );
    await act(async () => {
      fireEvent(screen.getByRole("image"), "error");
    });
    expect(screen.queryByRole("image")).toBeNull();
    expect(screen.getByTestId("av")).toBeTruthy();
  });
});

describe("Avatar ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof Image>>();
    await render(
      <Avatar
        ref={ref}
        source={{ uri: "https://example.com/a.png" }}
        testID="a"
      />,
    );
    expect(ref.current).toBeTruthy();
  });
});

describe("Badge ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Badge ref={ref} testID="b" accessibilityLabel="3 unread" />);
    expect(ref.current).toBeTruthy();
  });
});

describe("Progress ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Progress ref={ref} testID="p" value={42} />);
    expect(ref.current).toBeTruthy();
  });
});
