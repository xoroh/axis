import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { Fieldset, Textarea } from "./index";

/**
 * Textarea + Fieldset through the public entry: multiline plumbing,
 * measured growth, and legend grouping — observed in the RN runtime.
 */

describe("Textarea on React Native", () => {
  it("renders multiline with placeholder and caller style", async () => {
    await render(
      <Textarea testID="ta" placeholder="Notes" style={{ fontSize: 14 }} />,
    );
    expect(screen.getByPlaceholderText("Notes")).toBeTruthy();
    expect(screen.getByTestId("ta").props.multiline).toBe(true);
    const style = screen.getByTestId("ta").props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ fontSize: 14 });
  });

  it("uncontrolled typing reports text", async () => {
    const seen: string[] = [];
    await render(
      <Textarea
        testID="ta"
        defaultValue=""
        onValueChange={(t) => seen.push(t)}
      />,
    );
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("ta"), "line one\nline two");
    });
    expect(seen).toEqual(["line one\nline two"]);
    expect(screen.getByTestId("ta").props.value).toBe("line one\nline two");
  });

  it("controlled value wins", async () => {
    await render(<Textarea testID="ta" value="fixed" />);
    expect(screen.getByTestId("ta").props.value).toBe("fixed");
  });

  it("grows with content when autoGrow is set", async () => {
    await render(<Textarea testID="ta" autoGrow />);
    await act(async () => {
      fireEvent(screen.getByTestId("ta"), "contentSizeChange", {
        nativeEvent: { contentSize: { width: 100, height: 64 } },
      });
    });
    const style = screen.getByTestId("ta").props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ height: 64 });
  });
});

describe("Fieldset on React Native", () => {
  it("renders legend and grouped children", async () => {
    await render(
      <Fieldset testID="fs" legend="Address">
        <Textarea testID="ta" accessibilityLabel="Street" />
      </Fieldset>,
    );
    expect(screen.getByText("Address")).toBeTruthy();
    expect(screen.getByTestId("ta")).toBeTruthy();
  });

  it("omits the legend when absent", async () => {
    await render(
      <Fieldset testID="fs">
        <Textarea testID="ta" />
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
