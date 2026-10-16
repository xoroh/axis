import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Pressable, Text } from "react-native";
import { LoadingButton } from "./index";

/**
 * LoadingButton behavior through the public entry. Every assertion
 * renders the real component in the RN runtime and interacts through
 * RN events — default-busy announcement, press suppression while
 * busy, the explicit opt-out (`loading={false}`), disabled
 * terminality, and ref forwarding are observed, not assumed. Content
 * swap is the caller's: children render exactly as given (no spinner).
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("LoadingButton on React Native", () => {
  it("defaults to loading: busy announced, press suppressed", async () => {
    let calls = 0;
    await render(
      <LoadingButton testID="ld" onPress={() => (calls += 1)}>
        <Text>Saving…</Text>
      </LoadingButton>,
    );
    expect(screen.getByTestId("ld").props.accessibilityState).toMatchObject({
      disabled: false,
      busy: true,
    });
    await press("ld");
    expect(calls).toBe(0);
  });

  it("loading={false} behaves like a plain button", async () => {
    let calls = 0;
    await render(
      <LoadingButton testID="ld" loading={false} onPress={() => (calls += 1)}>
        <Text>Save</Text>
      </LoadingButton>,
    );
    expect(screen.getByTestId("ld").props.accessibilityState).toMatchObject({
      disabled: false,
      busy: false,
    });
    await press("ld");
    expect(calls).toBe(1);
  });

  it("disabled blocks even when not loading", async () => {
    let calls = 0;
    await render(
      <LoadingButton
        testID="ld"
        loading={false}
        disabled
        onPress={() => (calls += 1)}
      >
        <Text>Save</Text>
      </LoadingButton>,
    );
    expect(screen.getByTestId("ld").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await press("ld");
    expect(calls).toBe(0);
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(
      <LoadingButton testID="ld" ref={ref}>
        <Text>Saving…</Text>
      </LoadingButton>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("renders caller content as-is with caller styles and labels", async () => {
    await render(
      <LoadingButton
        testID="ld"
        style={{ opacity: 0.5 }}
        accessibilityLabel="Saving changes"
      >
        <Text>Saving…</Text>
      </LoadingButton>,
    );
    expect(screen.getByText("Saving…")).toBeTruthy();
    expect(screen.getByTestId("ld").props.style).toMatchObject({
      opacity: 0.5,
    });
    expect(screen.getByLabelText("Saving changes")).toBeTruthy();
  });
});
