import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { View } from "react-native";
import { OtpField } from "./index";

/**
 * OtpField behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and types through the hidden
 * host input — cell fan-out, controlled/uncontrolled flow, the
 * fire-once completion guard, disabled terminality, and ref forwarding
 * are observed, not assumed.
 */

async function type(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(`${testID}-input`), text);
  });
}

describe("OtpField on React Native", () => {
  it("renders length cells empty", async () => {
    await render(<OtpField testID="a" />);
    for (let i = 0; i < 6; i += 1) {
      expect(screen.getByTestId(`a-cell-${i}`).props.children).toBe("");
    }
    expect(screen.queryByTestId("a-cell-6")).toBeNull();

    await render(<OtpField testID="b" length={4} />);
    expect(screen.getByTestId("b-cell-3").props.children).toBe("");
    expect(screen.queryByTestId("b-cell-4")).toBeNull();

    await render(<OtpField testID="c" length={0} />);
    expect(screen.getByTestId("c-cell-0").props.children).toBe("");
    expect(screen.queryByTestId("c-cell-1")).toBeNull();
  });

  it("typing fills cells and fires onValueChange", async () => {
    const seen: string[] = [];
    await render(<OtpField testID="otp" onValueChange={(v) => seen.push(v)} />);
    await type("otp", "12");
    expect(seen).toEqual(["12"]);
    expect(screen.getByTestId("otp-cell-0").props.children).toBe("1");
    expect(screen.getByTestId("otp-cell-1").props.children).toBe("2");
    expect(screen.getByTestId("otp-cell-2").props.children).toBe("");
    expect(screen.getByTestId("otp-input").props.value).toBe("12");
  });

  it("controlled value follows the prop", async () => {
    function Host() {
      const [v, setV] = useState("");
      return <OtpField testID="otp" value={v} onValueChange={setV} />;
    }
    await render(<Host />);
    await type("otp", "987");
    expect(screen.getByTestId("otp-cell-0").props.children).toBe("9");
    expect(screen.getByTestId("otp-cell-1").props.children).toBe("8");
    expect(screen.getByTestId("otp-cell-2").props.children).toBe("7");
    expect(screen.getByTestId("otp-input").props.value).toBe("987");
  });

  it("autoSubmit fires onComplete once at full length, never on rerender", async () => {
    const seen: string[] = [];
    const onComplete = (v: string) => seen.push(v);
    const ui = await render(
      <OtpField testID="otp" length={4} autoSubmit onComplete={onComplete} />,
    );
    await type("otp", "12");
    expect(seen).toEqual([]);
    await type("otp", "1234");
    expect(seen).toEqual(["1234"]);
    await ui.rerender(
      <OtpField testID="otp" length={4} autoSubmit onComplete={onComplete} />,
    );
    expect(seen).toEqual(["1234"]);
    await type("otp", "12");
    await type("otp", "5678");
    expect(seen).toEqual(["1234", "5678"]);
  });

  it("disabled blocks entry", async () => {
    let calls = 0;
    await render(
      <OtpField
        testID="otp"
        disabled
        defaultValue=""
        onValueChange={() => (calls += 1)}
      />,
    );
    expect(screen.getByTestId("otp-input").props.editable).toBe(false);
    expect(screen.getByTestId("otp-input").props.onChangeText).toBeUndefined();
    expect(screen.getByTestId("otp-cell-0").props.children).toBe("");
    expect(calls).toBe(0);
  });

  it("secureTextEntry passes through to the hidden input", async () => {
    await render(<OtpField testID="otp" secureTextEntry />);
    expect(screen.getByTestId("otp-input").props.secureTextEntry).toBe(true);
  });

  it("hides the capture input from layout but keeps it focusable", async () => {
    await render(<OtpField testID="otp" />);
    const style = screen.getByTestId("otp-input").props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({
      position: "absolute",
      opacity: 0,
      width: 1,
      height: 1,
    });
    // Behavior-hidden is not entry-hidden: the input stays editable
    // so hardware keyboards and password managers can still drive it.
    expect(screen.getByTestId("otp-input").props.editable).toBe(true);
  });

  it("caller inputStyle overrides the hidden base", async () => {
    await render(<OtpField testID="otp" inputStyle={{ opacity: 1 }} />);
    const style = screen.getByTestId("otp-input").props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ opacity: 1, position: "absolute" });
  });

  it("forwards a ref to the container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<OtpField testID="otp" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("caller container style reaches the surface", async () => {
    await render(
      <OtpField testID="otp" style={{ flexDirection: "column", gap: 4 }} />,
    );
    const style = screen.getByTestId("otp").props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ flexDirection: "column", gap: 4 });
  });
});
