import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
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
        <></>
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
