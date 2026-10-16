import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import type { View } from "react-native";
import { Calendar } from "./index";

/**
 * Calendar behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN
 * events — grid structure, ISO selection, controlled following,
 * min/max disabling, month navigation, disabled terminality, and ref
 * forwarding are observed, not assumed.
 */

function currentMonthKey(): string {
  const now = new Date();
  return `${String(now.getUTCFullYear()).padStart(4, "0")}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysInCurrentMonth(): number {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate();
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Calendar on React Native", () => {
  it("renders the current-month grid with a 7-cell weekday structure", async () => {
    // An invalid value string must never throw — it selects nothing
    // and the grid falls back to the current month.
    await render(<Calendar testID="cal" value="not-a-date" />);
    const monthKey = currentMonthKey();
    expect(screen.getByText(monthKey)).toBeTruthy();
    for (let i = 0; i < 7; i += 1) {
      expect(screen.getByTestId(`cal-weekday-${i}`)).toBeTruthy();
    }
    const dayCount = daysInCurrentMonth();
    for (let day = 1; day <= dayCount; day += 1) {
      const iso = `${monthKey}-${String(day).padStart(2, "0")}`;
      expect(screen.getByTestId(`cal-day-${iso}`)).toBeTruthy();
    }
  });

  it("selecting a day fires the ISO value and marks it selected", async () => {
    const seen: (string | null)[] = [];
    await render(
      <Calendar
        testID="cal"
        month="2026-03"
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await press("cal-day-2026-03-15");
    expect(seen).toEqual(["2026-03-15"]);
    expect(
      screen.getByTestId("cal-day-2026-03-15").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByTestId("cal-day-2026-03-15").props.accessibilityRole,
    ).toBe("button");
  });

  it("controlled value follows the parent", async () => {
    function Host() {
      const [val, setVal] = useState<string | null>("2026-03-10");
      return (
        <Calendar
          testID="cal"
          month="2026-03"
          value={val}
          onValueChange={setVal}
        />
      );
    }
    await render(<Host />);
    expect(
      screen.getByTestId("cal-day-2026-03-10").props.accessibilityState,
    ).toMatchObject({ selected: true });
    await press("cal-day-2026-03-12");
    expect(
      screen.getByTestId("cal-day-2026-03-12").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByTestId("cal-day-2026-03-10").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("days outside min/max are disabled and skip selection", async () => {
    const seen: (string | null)[] = [];
    await render(
      <Calendar
        testID="cal"
        month="2026-03"
        minDate="2026-03-10"
        maxDate="2026-03-20"
        onValueChange={(v) => seen.push(v)}
      />,
    );
    expect(
      screen.getByTestId("cal-day-2026-03-09").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByTestId("cal-day-2026-03-21").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByTestId("cal-day-2026-03-10").props.accessibilityState,
    ).toMatchObject({ disabled: false });
    await press("cal-day-2026-03-09");
    await press("cal-day-2026-03-21");
    expect(seen).toEqual([]);
    await press("cal-day-2026-03-10");
    expect(seen).toEqual(["2026-03-10"]);
  });

  it("prev/next navigate the grid and fire onMonthChange", async () => {
    const seen: string[] = [];
    await render(
      <Calendar
        testID="cal"
        value="2026-01-15"
        onMonthChange={(m) => seen.push(m)}
      />,
    );
    expect(screen.getByText("2026-01")).toBeTruthy();
    await press("cal-prev");
    expect(seen).toEqual(["2025-12"]);
    expect(screen.getByText("2025-12")).toBeTruthy();
    await press("cal-next");
    expect(seen).toEqual(["2025-12", "2026-01"]);
    expect(screen.getByText("2026-01")).toBeTruthy();
    expect(screen.getByLabelText("Previous month")).toBeTruthy();
    expect(screen.getByLabelText("Next month")).toBeTruthy();
  });

  it("disabled blocks selection and navigation", async () => {
    const seenValues: (string | null)[] = [];
    const seenMonths: string[] = [];
    await render(
      <Calendar
        testID="cal"
        month="2026-03"
        disabled
        onValueChange={(v) => seenValues.push(v)}
        onMonthChange={(m) => seenMonths.push(m)}
      />,
    );
    expect(
      screen.getByTestId("cal-day-2026-03-15").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await press("cal-day-2026-03-15");
    await press("cal-prev");
    await press("cal-next");
    expect(seenValues).toEqual([]);
    expect(seenMonths).toEqual([]);
  });

  it("forwards a ref to the root view", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Calendar testID="cal" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
