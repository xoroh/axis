import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { View } from "react-native";
import { TimePicker, type TimePickerValue } from "./index";

/**
 * TimePicker behavior through the public entry. Every assertion renders
 * the real composed component (two Axis Inputs + four Axis Buttons) in
 * the RN runtime and interacts through RN events — formatted display,
 * commit normalisation, stepper stepping/clamping, controlled
 * following, disabled terminality, and container ref forwarding are
 * observed, not assumed.
 */

async function typeHours(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId("tp-hours"), text);
  });
}

async function pressStepper(
  label:
    | "Decrement hours"
    | "Increment hours"
    | "Decrement minutes"
    | "Increment minutes",
) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("TimePicker on React Native", () => {
  it("renders the formatted value with all four steppers", async () => {
    await render(<TimePicker testID="tp" value={{ hours: 9, minutes: 5 }} />);
    expect(screen.getByTestId("tp-hours").props.value).toBe("9");
    expect(screen.getByTestId("tp-minutes").props.value).toBe("05");
    expect(screen.getByLabelText("Decrement hours")).toBeTruthy();
    expect(screen.getByLabelText("Increment hours")).toBeTruthy();
    expect(screen.getByLabelText("Decrement minutes")).toBeTruthy();
    expect(screen.getByLabelText("Increment minutes")).toBeTruthy();
  });

  it("typing an hour normalizes on commit", async () => {
    const seen: TimePickerValue[] = [];
    await render(
      <TimePicker
        testID="tp"
        defaultValue={{ hours: 9, minutes: 5 }}
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await typeHours("25");
    expect(seen).toEqual([{ hours: 23, minutes: 5 }]);
    expect(screen.getByTestId("tp-hours").props.value).toBe("23");
  });

  it("steppers step and clamp at bounds", async () => {
    const seen: TimePickerValue[] = [];
    await render(
      <TimePicker
        testID="tp"
        defaultValue={{ hours: 10, minutes: 30 }}
        step={15}
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await pressStepper("Increment minutes");
    expect(seen).toEqual([{ hours: 10, minutes: 45 }]);
    expect(screen.getByTestId("tp-minutes").props.value).toBe("45");
    await pressStepper("Increment minutes");
    expect(seen).toHaveLength(1);
    await pressStepper("Decrement minutes");
    expect(seen).toEqual([
      { hours: 10, minutes: 45 },
      { hours: 10, minutes: 30 },
    ]);
    expect(screen.getByTestId("tp-minutes").props.value).toBe("30");
    await pressStepper("Increment hours");
    expect(seen[seen.length - 1]).toEqual({ hours: 11, minutes: 30 });
    // Hours clamp at 23: further increments are silent no-ops.
    for (let i = 0; i < 13; i += 1) {
      await pressStepper("Increment hours");
    }
    expect(seen[seen.length - 1]).toEqual({ hours: 23, minutes: 30 });
    const atTop = seen.length;
    await pressStepper("Increment hours");
    expect(seen).toHaveLength(atTop);
    // Minutes clamp at the grid floor: further decrements are silent.
    await pressStepper("Decrement minutes");
    await pressStepper("Decrement minutes");
    expect(seen[seen.length - 1]).toEqual({ hours: 23, minutes: 0 });
    const atBottom = seen.length;
    await pressStepper("Decrement minutes");
    expect(seen).toHaveLength(atBottom);
  });

  it("controlled value follows the parent", async () => {
    function Host() {
      const [val, setVal] = useState<TimePickerValue | null>({
        hours: 10,
        minutes: 30,
      });
      return <TimePicker testID="tp" value={val} onValueChange={setVal} />;
    }
    await render(<Host />);
    await pressStepper("Increment hours");
    expect(screen.getByTestId("tp-hours").props.value).toBe("11");
    expect(screen.getByTestId("tp-minutes").props.value).toBe("30");
  });

  it("disabled blocks typing and all four steppers", async () => {
    const seen: TimePickerValue[] = [];
    await render(
      <TimePicker
        testID="tp"
        defaultValue={{ hours: 10, minutes: 30 }}
        disabled
        onValueChange={(v) => seen.push(v)}
      />,
    );
    expect(screen.getByTestId("tp-hours").props.editable).toBe(false);
    expect(screen.getByTestId("tp-minutes").props.editable).toBe(false);
    await typeHours("15");
    await pressStepper("Decrement hours");
    await pressStepper("Increment hours");
    await pressStepper("Decrement minutes");
    await pressStepper("Increment minutes");
    expect(seen).toEqual([]);
    expect(screen.getByTestId("tp-hours").props.value).toBe("10");
  });

  it("forwards a ref to the container view", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<TimePicker testID="tp" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
