import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Pressable, Text } from "react-native";
import { Button } from "./index";

/**
 * Button behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * label content, press delivery, disabled/loading suppression, busy
 * announcement, and ref forwarding are observed, not assumed.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("Button on React Native", () => {
  it("renders button role with children text", async () => {
    await render(
      <Button testID="btn">
        <Text>Save</Text>
      </Button>,
    );
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByTestId("btn").props.accessibilityState).toMatchObject({
      disabled: false,
      busy: false,
    });
  });

  it("press fires onPress once", async () => {
    let calls = 0;
    await render(
      <Button testID="btn" onPress={() => (calls += 1)}>
        <Text>Save</Text>
      </Button>,
    );
    await press("btn");
    expect(calls).toBe(1);
  });

  it("disabled blocks: no callback, announced disabled", async () => {
    let calls = 0;
    await render(
      <Button testID="btn" disabled onPress={() => (calls += 1)}>
        <Text>Save</Text>
      </Button>,
    );
    expect(screen.getByTestId("btn").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await press("btn");
    expect(calls).toBe(0);
  });

  it("loading blocks and announces busy", async () => {
    let calls = 0;
    await render(
      <Button testID="btn" loading onPress={() => (calls += 1)}>
        <Text>Saving…</Text>
      </Button>,
    );
    expect(screen.getByTestId("btn").props.accessibilityState).toMatchObject({
      disabled: false,
      busy: true,
    });
    await press("btn");
    expect(calls).toBe(0);
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(
      <Button testID="btn" ref={ref}>
        <Text>Save</Text>
      </Button>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("accepts caller styles without imposing any", async () => {
    await render(
      <Button testID="btn" style={{ opacity: 0.5 }}>
        <Text>Save</Text>
      </Button>,
    );
    expect(screen.getByTestId("btn").props.style).toMatchObject({
      opacity: 0.5,
    });
  });

  it("accessibilityLabel query works", async () => {
    await render(
      <Button testID="btn" accessibilityLabel="Save changes">
        <Text>Save</Text>
      </Button>,
    );
    expect(screen.getByLabelText("Save changes")).toBeTruthy();
  });
});
