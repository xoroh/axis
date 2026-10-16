import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { Toast } from "./index";

/**
 * Toast behavior through the public entry. Every assertion renders the
 * real component in the RN runtime and interacts through RN events —
 * presence, live-region announcement, timed auto-dismiss, and the
 * dismissing action are observed, not assumed. Timers are real with
 * short durations (≤150ms waits); nothing sleeps over 500ms.
 */

async function pressAction() {
  await act(async () => {
    fireEvent.press(screen.getByRole("button"));
  });
}

describe("Toast on React Native", () => {
  it("renders null when closed", async () => {
    await render(
      <Toast testID="toast" accessibilityLabel="Saved">
        Saved
      </Toast>,
    );
    expect(screen.queryByTestId("toast")).toBeNull();
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("shows content with a polite live region when open", async () => {
    await render(
      <Toast testID="toast" defaultOpen accessibilityLabel="Saved">
        Saved
      </Toast>,
    );
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByLabelText("Saved")).toBeTruthy();
    expect(screen.getByTestId("toast").props.accessibilityLiveRegion).toBe(
      "polite",
    );
  });

  it("auto-dismisses after duration via onOpenChange(false)", async () => {
    const seen: boolean[] = [];
    await render(
      <Toast
        testID="toast"
        defaultOpen
        duration={50}
        onOpenChange={(next) => seen.push(next)}
      >
        Saved
      </Toast>,
    );
    expect(screen.getByTestId("toast")).toBeTruthy();
    await waitFor(() => expect(seen).toEqual([false]), { timeout: 500 });
    expect(screen.queryByTestId("toast")).toBeNull();
  });

  it("never auto-dismisses when duration is 0", async () => {
    const seen: boolean[] = [];
    await render(
      <Toast
        testID="toast"
        defaultOpen
        duration={0}
        onOpenChange={(next) => seen.push(next)}
      >
        Saved
      </Toast>,
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    expect(screen.getByTestId("toast")).toBeTruthy();
    expect(seen).toEqual([]);
  });

  it("action press fires onAction and dismisses", async () => {
    const seen: boolean[] = [];
    let actions = 0;
    await render(
      <Toast
        testID="toast"
        defaultOpen
        actionLabel="Undo"
        onAction={() => (actions += 1)}
        onOpenChange={(next) => seen.push(next)}
      >
        Saved
      </Toast>,
    );
    expect(screen.getByLabelText("Undo")).toBeTruthy();
    await pressAction();
    expect(actions).toBe(1);
    expect(seen).toEqual([false]);
    expect(screen.queryByTestId("toast")).toBeNull();
  });

  it("renders no action button without actionLabel", async () => {
    await render(
      <Toast testID="toast" defaultOpen onAction={() => {}}>
        Saved
      </Toast>,
    );
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("accepts caller styles without imposing any", async () => {
    await render(
      <Toast testID="toast" defaultOpen style={{ opacity: 0.5 }}>
        Saved
      </Toast>,
    );
    expect(screen.getByTestId("toast").props.style).toMatchObject({
      opacity: 0.5,
    });
  });
});

describe("Toast ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Toast ref={ref} testID="t" defaultOpen accessibilityLabel="Saved" />,
    );
    expect(ref.current).toBeTruthy();
  });
});
