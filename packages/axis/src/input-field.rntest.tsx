import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { View } from "react-native";
import {
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  Input,
} from "./index";

/**
 * Form primitives through the public entry: controlled/uncontrolled
 * text flow, read-only terminality, ref forwarding, and the
 * label/control/error row — observed in the RN runtime.
 */

describe("Input on React Native", () => {
  it("renders with placeholder and caller style", async () => {
    await render(
      <Input testID="in" placeholder="Name" style={{ fontSize: 14 }} />,
    );
    expect(screen.getByPlaceholderText("Name")).toBeTruthy();
    expect(screen.getByTestId("in").props.style).toMatchObject({
      fontSize: 14,
    });
  });

  it("uncontrolled typing reports text", async () => {
    const seen: string[] = [];
    await render(
      <Input testID="in" defaultValue="" onValueChange={(t) => seen.push(t)} />,
    );
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("in"), "Ada");
    });
    expect(seen).toEqual(["Ada"]);
    expect(screen.getByTestId("in").props.value).toBe("Ada");
  });

  it("controlled value wins and follows the prop", async () => {
    const seen: string[] = [];
    function Host() {
      const [v, setV] = useState("a");
      return (
        <Input
          testID="in"
          value={v}
          onValueChange={(t) => {
            seen.push(t);
            setV(t.toUpperCase());
          }}
        />
      );
    }
    await render(<Host />);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("in"), "ab");
    });
    expect(seen).toEqual(["ab"]);
    expect(screen.getByTestId("in").props.value).toBe("AB");
  });

  it("editable={false} is read-only", async () => {
    let calls = 0;
    await render(
      <Input
        testID="in"
        value="fixed"
        editable={false}
        onValueChange={() => (calls += 1)}
      />,
    );
    expect(screen.getByTestId("in").props.editable).toBe(false);
    expect(calls).toBe(0);
  });

  it("secure entry passes through", async () => {
    await render(<Input testID="in" secureTextEntry />);
    expect(screen.getByTestId("in").props.secureTextEntry).toBe(true);
  });

  it("multiline renders with 3-line default and reports typing", async () => {
    const seen: string[] = [];
    await render(
      <Input
        testID="in"
        multiline
        placeholder="Notes"
        defaultValue=""
        onValueChange={(t) => seen.push(t)}
        style={{ fontSize: 14 }}
      />,
    );
    expect(screen.getByPlaceholderText("Notes")).toBeTruthy();
    expect(screen.getByTestId("in").props.multiline).toBe(true);
    expect(screen.getByTestId("in").props.numberOfLines).toBe(3);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("in"), "line one\nline two");
    });
    expect(seen).toEqual(["line one\nline two"]);
  });

  it("single-line input passes no line hint", async () => {
    await render(<Input testID="in" />);
    expect(screen.getByTestId("in").props.multiline).toBe(false);
    expect(screen.getByTestId("in").props.numberOfLines).toBeUndefined();
  });

  it("grows with content when autoGrow is set", async () => {
    await render(<Input testID="in" multiline autoGrow />);
    await act(async () => {
      fireEvent(screen.getByTestId("in"), "contentSizeChange", {
        nativeEvent: { contentSize: { width: 100, height: 64 } },
      });
    });
    const style = screen.getByTestId("in").props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ height: 64 });
  });

  it("autoGrow stays off without multiline", async () => {
    await render(<Input testID="in" autoGrow style={{ fontSize: 14 }} />);
    await act(async () => {
      fireEvent(screen.getByTestId("in"), "contentSizeChange", {
        nativeEvent: { contentSize: { width: 100, height: 64 } },
      });
    });
    expect(screen.getByTestId("in").props.style).toMatchObject({
      fontSize: 14,
    });
  });

  it("minRows and maxRows clamp the grown height and report it", async () => {
    const seen: number[] = [];
    await render(
      <Input
        testID="in"
        multiline
        autoGrow
        minRows={2}
        maxRows={4}
        onHeightChange={(h) => seen.push(h)}
        style={{ fontSize: 16 }}
      />,
    );
    await act(async () => {
      fireEvent(screen.getByTestId("in"), "contentSizeChange", {
        nativeEvent: { contentSize: { width: 100, height: 10 } },
      });
    });
    await act(async () => {
      fireEvent(screen.getByTestId("in"), "contentSizeChange", {
        nativeEvent: { contentSize: { width: 100, height: 400 } },
      });
    });
    // One row is the caller fontSize (16): floor 32, ceiling 64.
    expect(seen).toEqual([32, 64]);
    const style = screen.getByTestId("in").props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ height: 64 });
  });
});

describe("FieldRoot on React Native", () => {
  it("renders label, control, and polite error", async () => {
    await render(
      <FieldRoot testID="f" label="Email" error="Required">
        <Input testID="in" accessibilityLabel="Email" />
      </FieldRoot>,
    );
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("Required")).toBeTruthy();
    expect(screen.getByTestId("in")).toBeTruthy();
  });

  it("omits label and error when absent", async () => {
    await render(
      <FieldRoot testID="f">
        <Input testID="in" />
      </FieldRoot>,
    );
    expect(screen.getByTestId("f")).toBeTruthy();
    expect(screen.getByTestId("in")).toBeTruthy();
  });
});

describe("FieldRoot ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<FieldRoot ref={ref} testID="f" label="Name" />);
    expect(ref.current).toBeTruthy();
  });
});

describe("FieldRoot parts on React Native", () => {
  it("composes label, control, description, and error parts", async () => {
    await render(
      <FieldRoot testID="f" error="Required">
        <FieldLabel testID="f-label">Email</FieldLabel>
        <FieldControl>
          <Input testID="in" accessibilityLabel="Email" />
        </FieldControl>
        <FieldDescription testID="f-desc">We never share it.</FieldDescription>
        <FieldError testID="f-error">Required</FieldError>
      </FieldRoot>,
    );
    expect(screen.getByTestId("f-label")).toBeTruthy();
    expect(screen.getByTestId("in")).toBeTruthy();
    expect(screen.getByTestId("f-desc")).toBeTruthy();
    expect(screen.getByTestId("f-error")).toBeTruthy();
  });

  it("hides the error part while valid and outside a root", async () => {
    await render(
      <FieldRoot testID="f">
        <FieldError testID="f-error">Required</FieldError>
      </FieldRoot>,
    );
    expect(screen.queryByTestId("f-error")).toBeNull();
    await render(<FieldError testID="orphan">Required</FieldError>);
    expect(screen.queryByTestId("orphan")).toBeNull();
  });
});
