import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text, type TextInput, View } from "react-native";
import {
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
  NumberFieldScrubArea,
} from "./index";

/**
 * NumberField compound behavior through the public entry. Root state
 * plumbing (controlled/uncontrolled, clamp, snap, locale/format,
 * read-only, commit), the Group adjustable surface, Input entry, hold
 * stepper auto-repeat, and ScrubArea drags — observed in the RN
 * runtime. Drags go through the real PanResponder with synthetic
 * touch histories (the Slider precedent).
 */

function getInput() {
  const root = screen.root;
  if (root === null) throw new Error("NumberField test: no render root");
  const match = root.queryAll((node) => node.type === "TextInput")[0];
  if (match === undefined)
    throw new Error("NumberField test: expected one host TextInput");
  return match;
}

async function typeText(text: string) {
  await act(async () => {
    fireEvent.changeText(getInput(), text);
  });
}

async function press(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

function touchBank(
  timeStamp: number,
  currentX: number,
  currentY: number,
  previousX: number,
  previousY: number,
) {
  return {
    nativeEvent: {},
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: timeStamp,
      touchBank: [
        {
          touchActive: true,
          currentTimeStamp: timeStamp,
          currentPageX: currentX,
          currentPageY: currentY,
          previousPageX: previousX,
          previousPageY: previousY,
        },
      ],
    },
  };
}

async function dragScrub(dx: number, dy: number) {
  const surface = screen.getByTestId("scrub");
  await act(async () => {
    await fireEvent(
      surface,
      "responderGrant",
      touchBank(100, 200, 400, 200, 400),
    );
  });
  await act(async () => {
    await fireEvent(
      surface,
      "responderMove",
      touchBank(200, 200 + dx, 400 + dy, 200, 400),
    );
  });
  await act(async () => {
    await fireEvent(
      surface,
      "responderRelease",
      touchBank(300, 200 + dx, 400 + dy, 200, 400),
    );
  });
}

function StepperField(props: {
  defaultValue?: number | null;
  onValueChange?: (v: number | null) => void;
  onValueCommitted?: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  snapOnStep?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <NumberFieldRoot {...props}>
      <NumberFieldGroup testID="group">
        <NumberFieldDecrement />
        <NumberFieldInput testID="entry" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberFieldRoot>
  );
}

describe("NumberFieldRoot", () => {
  it("renders the parts through the root", async () => {
    await render(<StepperField defaultValue={3} />);
    expect(screen.getByTestId("group")).toBeTruthy();
    expect(screen.getByTestId("entry")).toBeTruthy();
    expect(screen.getByLabelText("Decrement")).toBeTruthy();
    expect(screen.getByLabelText("Increment")).toBeTruthy();
    expect(screen.getByDisplayValue("3")).toBeTruthy();
  });

  it("typing commits the parsed float", async () => {
    const seen: (number | null)[] = [];
    await render(<StepperField onValueChange={(v) => seen.push(v)} />);
    await typeText("12.5");
    expect(seen).toEqual([12.5]);
    expect(screen.getByDisplayValue("12.5")).toBeTruthy();
  });

  it("empty text clears to null", async () => {
    const seen: (number | null)[] = [];
    await render(
      <StepperField defaultValue={5} onValueChange={(v) => seen.push(v)} />,
    );
    await typeText("");
    expect(seen).toEqual([null]);
    expect(getInput().props.value).toBe("");
  });

  it("controlled value follows the prop", async () => {
    function Host() {
      const [v, setV] = useState<number | null>(3);
      return (
        <NumberFieldRoot value={v} onValueChange={setV}>
          <NumberFieldGroup>
            <NumberFieldInput testID="entry" />
          </NumberFieldGroup>
        </NumberFieldRoot>
      );
    }
    await render(<Host />);
    expect(screen.getByDisplayValue("3")).toBeTruthy();
    await typeText("9");
    expect(screen.getByDisplayValue("9")).toBeTruthy();
  });

  it("steps clamp to min and max", async () => {
    const seen: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={9}
        max={10}
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await press("Increment");
    expect(seen).toEqual([10]);
    await press("Increment");
    expect(seen).toEqual([10]);
    expect(screen.getByDisplayValue("10")).toBeTruthy();
  });

  it("steps by a custom increment", async () => {
    const seen: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={0}
        step={5}
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await press("Increment");
    expect(seen).toEqual([5]);
  });

  it("falls back to a step of 1 on garbage steps", async () => {
    const seen: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={1}
        step={0}
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await press("Increment");
    expect(seen).toEqual([2]);
  });

  it("snaps to the grid only with snapOnStep", async () => {
    const plain: (number | null)[] = [];
    await render(
      <StepperField defaultValue={1.2} onValueChange={(v) => plain.push(v)} />,
    );
    await press("Increment");
    expect(plain[0]).toBeCloseTo(2.2);
  });

  it("snapOnStep rounds stepped values to the grid", async () => {
    const snapped: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={1.2}
        snapOnStep
        onValueChange={(v) => snapped.push(v)}
      />,
    );
    await press("Increment");
    await press("Decrement");
    expect(snapped).toEqual([2, 1]);
  });

  it("disabled blocks typing, stepping, and actions", async () => {
    const seen: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={5}
        disabled
        onValueChange={(v) => seen.push(v)}
      />,
    );
    expect(getInput().props.editable).toBe(false);
    await typeText("9");
    await press("Decrement");
    await press("Increment");
    expect(seen).toEqual([]);
    expect(screen.getByDisplayValue("5")).toBeTruthy();
    expect(screen.getByTestId("group").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("readOnly blocks entry without announcing disabled", async () => {
    const seen: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={5}
        readOnly
        onValueChange={(v) => seen.push(v)}
      />,
    );
    expect(getInput().props.editable).toBe(false);
    await typeText("9");
    await press("Decrement");
    expect(seen).toEqual([]);
    expect(screen.getByDisplayValue("5")).toBeTruthy();
    expect(
      screen.getByTestId("group").props.accessibilityState?.disabled,
    ).toBeUndefined();
  });

  it("formats the display through locale", async () => {
    await render(
      <NumberFieldRoot defaultValue={1234.5} locale="de-DE">
        <NumberFieldGroup>
          <NumberFieldInput testID="entry" />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    expect(screen.getByDisplayValue("1.234,5")).toBeTruthy();
  });

  it("parses locale text back to state", async () => {
    const seen: (number | null)[] = [];
    await render(
      <NumberFieldRoot locale="de-DE" onValueChange={(v) => seen.push(v)}>
        <NumberFieldGroup>
          <NumberFieldInput testID="entry" />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    await typeText("1.234,5");
    expect(seen).toEqual([1234.5]);
  });

  it("commits and reformats on blur", async () => {
    const committed: (number | null)[] = [];
    await render(
      <NumberFieldRoot
        defaultValue={5}
        min={0}
        max={10}
        onValueCommitted={(v) => committed.push(v)}
      >
        <NumberFieldGroup>
          <NumberFieldInput testID="entry" />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    await typeText("250");
    expect(committed).toEqual([]);
    await act(async () => {
      fireEvent(getInput(), "blur");
    });
    expect(committed).toEqual([10]);
    expect(screen.getByDisplayValue("10")).toBeTruthy();
  });

  it("commits on stepper release", async () => {
    const committed: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={5}
        onValueCommitted={(v) => committed.push(v)}
      />,
    );
    await press("Increment");
    expect(committed).toEqual([6]);
  });

  it("rejects use outside a root", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      await expect(render(<NumberFieldGroup />)).rejects.toThrow(
        /under a NumberFieldRoot/,
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

describe("NumberFieldGroup", () => {
  it("is adjustable with increment and decrement actions", async () => {
    const seen: (number | null)[] = [];
    await render(
      <StepperField defaultValue={5} onValueChange={(v) => seen.push(v)} />,
    );
    expect(screen.getByTestId("group").props.accessibilityRole).toBe(
      "adjustable",
    );
    await act(async () => {
      await fireEvent(screen.getByTestId("group"), "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });
    });
    await act(async () => {
      await fireEvent(screen.getByTestId("group"), "accessibilityAction", {
        nativeEvent: { actionName: "decrement" },
      });
    });
    expect(seen).toEqual([6, 5]);
  });

  it("function style observes root state", async () => {
    await render(
      <NumberFieldRoot defaultValue={7}>
        <NumberFieldGroup
          testID="group"
          style={(s) => ({ opacity: s.value === 7 ? 1 : 0 })}
        />
      </NumberFieldRoot>,
    );
    expect(screen.getByTestId("group").props.style).toMatchObject({
      opacity: 1,
    });
  });

  it("element render substitutes the group", async () => {
    await render(
      <NumberFieldRoot defaultValue={7}>
        <NumberFieldGroup render={<View testID="sub" />} />
      </NumberFieldRoot>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("caller container style reaches the surface", async () => {
    await render(
      <NumberFieldRoot defaultValue={7}>
        <NumberFieldGroup
          testID="group"
          style={{ flexDirection: "column", gap: 4 }}
        />
      </NumberFieldRoot>,
    );
    expect(screen.getByTestId("group").props.style).toMatchObject({
      flexDirection: "column",
      gap: 4,
    });
  });

  it("forwards a ref to the group host", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <NumberFieldRoot defaultValue={7}>
        <NumberFieldGroup ref={ref} />
      </NumberFieldRoot>,
    );
    expect(ref.current).not.toBeNull();
  });
});

describe("NumberFieldInput", () => {
  it("shows the formatted value with a placeholder", async () => {
    await render(
      <NumberFieldRoot defaultValue={42}>
        <NumberFieldGroup>
          <NumberFieldInput testID="entry" placeholder="Amount" />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    expect(screen.getByPlaceholderText("Amount")).toBeTruthy();
    expect(screen.getByDisplayValue("42")).toBeTruthy();
  });

  it("is read-only when the field is disabled", async () => {
    await render(
      <NumberFieldRoot defaultValue={42} disabled>
        <NumberFieldGroup>
          <NumberFieldInput testID="entry" />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    expect(getInput().props.editable).toBe(false);
  });

  it("element render substitutes the entry", async () => {
    await render(
      <NumberFieldRoot defaultValue={42}>
        <NumberFieldGroup>
          <NumberFieldInput render={<View testID="sub" />} />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("forwards a ref to the host input", async () => {
    const ref = createRef<ElementRef<typeof TextInput>>();
    await render(
      <NumberFieldRoot defaultValue={42}>
        <NumberFieldGroup>
          <NumberFieldInput ref={ref} />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    expect(ref.current).not.toBeNull();
  });
});

describe("NumberField steppers", () => {
  it("carry default accessible names", async () => {
    await render(<StepperField />);
    expect(screen.getByLabelText("Decrement")).toBeTruthy();
    expect(screen.getByLabelText("Increment")).toBeTruthy();
  });

  it("take custom children and names", async () => {
    await render(
      <NumberFieldRoot>
        <NumberFieldGroup>
          <NumberFieldDecrement accessibilityLabel="Less">
            <Text>−</Text>
          </NumberFieldDecrement>
          <NumberFieldInput />
          <NumberFieldIncrement accessibilityLabel="More">
            <Text>+</Text>
          </NumberFieldIncrement>
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    expect(screen.getByLabelText("Less")).toBeTruthy();
    expect(screen.getByLabelText("More")).toBeTruthy();
    expect(screen.getByText("−")).toBeTruthy();
  });

  it("press steps once and commits", async () => {
    const seen: (number | null)[] = [];
    const committed: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={5}
        onValueChange={(v) => seen.push(v)}
        onValueCommitted={(v) => committed.push(v)}
      />,
    );
    await press("Increment");
    expect(seen).toEqual([6]);
    expect(committed).toEqual([6]);
    await press("Decrement");
    expect(seen).toEqual([6, 5]);
  });

  it("hold auto-repeats and commits once on release", async () => {
    jest.useFakeTimers();
    try {
      const seen: (number | null)[] = [];
      const committed: (number | null)[] = [];
      await render(
        <StepperField
          defaultValue={0}
          onValueChange={(v) => seen.push(v)}
          onValueCommitted={(v) => committed.push(v)}
        />,
      );
      await act(async () => {
        fireEvent(screen.getByLabelText("Increment"), "pressIn");
      });
      await act(async () => {
        jest.advanceTimersByTime(700);
      });
      expect(seen).toEqual([1, 2, 3, 4]);
      await act(async () => {
        fireEvent(screen.getByLabelText("Increment"), "pressOut");
      });
      // No press event fired, so no extra release step — one commit.
      expect(seen).toEqual([1, 2, 3, 4]);
      expect(committed).toEqual([4]);
    } finally {
      jest.useRealTimers();
    }
  });

  it("disabled steppers ignore presses", async () => {
    const seen: (number | null)[] = [];
    await render(
      <StepperField
        defaultValue={5}
        disabled
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await press("Increment");
    await act(async () => {
      fireEvent(screen.getByLabelText("Increment"), "pressIn");
    });
    expect(seen).toEqual([]);
  });

  it("element render substitutes a stepper", async () => {
    await render(
      <NumberFieldRoot>
        <NumberFieldGroup>
          <NumberFieldDecrement render={<View testID="sub-dec" />} />
          <NumberFieldInput />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    expect(screen.getByTestId("sub-dec")).toBeTruthy();
  });

  it("forwards a ref to the stepper host", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <NumberFieldRoot>
        <NumberFieldGroup>
          <NumberFieldDecrement ref={ref} />
        </NumberFieldGroup>
      </NumberFieldRoot>,
    );
    expect(ref.current).not.toBeNull();
  });
});

describe("NumberFieldScrubArea", () => {
  function ScrubField(props: {
    defaultValue?: number | null;
    min?: number;
    max?: number;
    step?: number;
    pixelSensitivity?: number;
    direction?: "horizontal" | "vertical";
    disabled?: boolean;
    onValueChange?: (v: number | null) => void;
    onValueCommitted?: (v: number | null) => void;
  }) {
    return (
      <NumberFieldRoot {...props}>
        <NumberFieldScrubArea
          testID="scrub"
          direction={props.direction}
          pixelSensitivity={props.pixelSensitivity}
        />
      </NumberFieldRoot>
    );
  }

  it("drags horizontally by pixel sensitivity", async () => {
    const seen: (number | null)[] = [];
    await render(
      <ScrubField defaultValue={0} onValueChange={(v) => seen.push(v)} />,
    );
    await dragScrub(10, 0);
    expect(seen).toEqual([5]);
  });

  it("drags upward to increase on the vertical axis", async () => {
    const seen: (number | null)[] = [];
    await render(
      <ScrubField
        defaultValue={0}
        direction="vertical"
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await dragScrub(0, -10);
    expect(seen).toEqual([5]);
  });

  it("honors custom pixel sensitivity and clamps", async () => {
    const seen: (number | null)[] = [];
    await render(
      <ScrubField
        defaultValue={0}
        max={3}
        pixelSensitivity={5}
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await dragScrub(10, 0);
    expect(seen).toEqual([2]);
    await dragScrub(100, 0);
    expect(seen).toEqual([2, 3]);
  });

  it("commits on release", async () => {
    const committed: (number | null)[] = [];
    await render(
      <ScrubField
        defaultValue={0}
        onValueCommitted={(v) => committed.push(v)}
      />,
    );
    await dragScrub(10, 0);
    expect(committed).toEqual([5]);
  });

  it("ignores drags while disabled", async () => {
    const seen: (number | null)[] = [];
    await render(
      <ScrubField
        defaultValue={0}
        disabled
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await dragScrub(10, 0);
    expect(seen).toEqual([]);
  });

  it("forwards a ref to the scrub host", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <NumberFieldRoot>
        <NumberFieldScrubArea ref={ref} />
      </NumberFieldRoot>,
    );
    expect(ref.current).not.toBeNull();
  });
});
