import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { ToastRoot } from "./index";

/**
 * ToastRoot behavior through the public entry. Every assertion renders the
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

describe("ToastRoot on React Native", () => {
  it("renders null when closed", async () => {
    await render(
      <ToastRoot testID="toast" aria-label="Saved">
        Saved
      </ToastRoot>,
    );
    expect(screen.queryByTestId("toast")).toBeNull();
    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("shows content with a polite live region when open", async () => {
    await render(
      <ToastRoot testID="toast" defaultOpen aria-label="Saved">
        Saved
      </ToastRoot>,
    );
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByLabelText("Saved")).toBeTruthy();
    expect(screen.getByTestId("toast").props["aria-live"]).toBe("polite");
  });

  it("auto-dismisses after duration via onOpenChange(false)", async () => {
    const seen: boolean[] = [];
    await render(
      <ToastRoot
        testID="toast"
        defaultOpen
        duration={50}
        onOpenChange={(next) => seen.push(next)}
      >
        Saved
      </ToastRoot>,
    );
    expect(screen.getByTestId("toast")).toBeTruthy();
    await waitFor(() => expect(seen).toEqual([false]), { timeout: 500 });
    expect(screen.queryByTestId("toast")).toBeNull();
  });

  it("never auto-dismisses when duration is 0", async () => {
    const seen: boolean[] = [];
    await render(
      <ToastRoot
        testID="toast"
        defaultOpen
        duration={0}
        onOpenChange={(next) => seen.push(next)}
      >
        Saved
      </ToastRoot>,
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
      <ToastRoot
        testID="toast"
        defaultOpen
        actionLabel="Undo"
        onAction={() => (actions += 1)}
        onOpenChange={(next) => seen.push(next)}
      >
        Saved
      </ToastRoot>,
    );
    expect(screen.getByLabelText("Undo")).toBeTruthy();
    await pressAction();
    expect(actions).toBe(1);
    expect(seen).toEqual([false]);
    expect(screen.queryByTestId("toast")).toBeNull();
  });

  it("renders no action button without actionLabel", async () => {
    await render(
      <ToastRoot testID="toast" defaultOpen onAction={() => {}}>
        Saved
      </ToastRoot>,
    );
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("accepts caller styles without imposing any", async () => {
    await render(
      <ToastRoot testID="toast" defaultOpen style={{ opacity: 0.5 }}>
        Saved
      </ToastRoot>,
    );
    expect(screen.getByTestId("toast").props.style).toMatchObject({
      opacity: 0.5,
    });
  });
});

describe("ToastRoot ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <ToastRoot ref={ref} testID="t" defaultOpen aria-label="Saved" />,
    );
    expect(ref.current).toBeTruthy();
  });
});
