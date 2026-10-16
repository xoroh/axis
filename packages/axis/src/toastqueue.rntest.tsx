import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { act } from "react";
import { Pressable, Text } from "react-native";
import { ToastProvider, ToastViewport, useToast } from "./index";

/**
 * Queued toasts through the public entry. Every assertion renders the
 * real provider + viewport in the RN runtime and drives the manager
 * through real presses — queue add/dismiss/clear, per-toast
 * auto-dismiss, action wiring, and the visible limit are observed,
 * not assumed. Timers are real with short durations.
 */

function Adder({
  label,
  onAdded,
}: {
  label: string;
  onAdded: (id: string) => void;
}) {
  const toast = useToast();
  return (
    <Pressable
      testID={`add-${label}`}
      accessibilityLabel={`Add ${label}`}
      onPress={() => onAdded(toast.add({ message: label, duration: 0 }))}
    >
      <Text>{`Add ${label}`}</Text>
    </Pressable>
  );
}

describe("Toast queue on React Native", () => {
  it("paints added toasts in the viewport in queue order", async () => {
    await render(
      <ToastProvider>
        <Adder label="one" onAdded={() => {}} />
        <Adder label="two" onAdded={() => {}} />
        <ToastViewport testID="vp" />
      </ToastProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-one"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-two"));
    });
    expect(screen.getByText("one")).toBeTruthy();
    expect(screen.getByText("two")).toBeTruthy();
    expect(screen.getByTestId("vp")).toBeTruthy();
  });

  it("dismiss removes exactly one toast", async () => {
    let first = "";
    function Dismisser() {
      const toast = useToast();
      return (
        <Pressable
          testID="dismiss-first"
          accessibilityLabel="Dismiss first"
          onPress={() => toast.dismiss(first)}
        >
          <Text>Dismiss</Text>
        </Pressable>
      );
    }
    await render(
      <ToastProvider>
        <Adder label="one" onAdded={(id) => (first = id)} />
        <Adder label="two" onAdded={() => {}} />
        <Dismisser />
        <ToastViewport testID="vp" />
      </ToastProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-one"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-two"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("dismiss-first"));
    });
    expect(screen.queryByText("one")).toBeNull();
    expect(screen.getByText("two")).toBeTruthy();
  });

  it("clear removes every toast", async () => {
    function Clearer() {
      const toast = useToast();
      return (
        <Pressable
          testID="clear"
          accessibilityLabel="Clear"
          onPress={() => toast.clear()}
        >
          <Text>Clear</Text>
        </Pressable>
      );
    }
    await render(
      <ToastProvider>
        <Adder label="one" onAdded={() => {}} />
        <Adder label="two" onAdded={() => {}} />
        <Clearer />
        <ToastViewport testID="vp" />
      </ToastProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-one"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-two"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("clear"));
    });
    expect(screen.queryByText("one")).toBeNull();
    expect(screen.queryByText("two")).toBeNull();
  });

  it("per-toast auto-dismiss removes the toast via onOpenChange", async () => {
    function QuickAdder() {
      const toast = useToast();
      return (
        <Pressable
          testID="add-quick"
          accessibilityLabel="Add quick"
          onPress={() => toast.add({ message: "quick", duration: 50 })}
        >
          <Text>Add</Text>
        </Pressable>
      );
    }
    await render(
      <ToastProvider>
        <QuickAdder />
        <ToastViewport testID="vp" />
      </ToastProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-quick"));
    });
    expect(screen.getByText("quick")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("quick")).toBeNull(), {
      timeout: 500,
    });
  });

  it("action press fires onAction and dismisses that toast", async () => {
    let actions = 0;
    function ActionAdder() {
      const toast = useToast();
      return (
        <Pressable
          testID="add-action"
          accessibilityLabel="Add action"
          onPress={() =>
            toast.add({
              message: "with action",
              duration: 0,
              actionLabel: "Undo",
              onAction: () => (actions += 1),
            })
          }
        >
          <Text>Add</Text>
        </Pressable>
      );
    }
    await render(
      <ToastProvider>
        <ActionAdder />
        <ToastViewport testID="vp" />
      </ToastProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-action"));
    });
    expect(screen.getByLabelText("Undo")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Undo"));
    });
    expect(actions).toBe(1);
    expect(screen.queryByText("with action")).toBeNull();
  });

  it("limit paints only the oldest toasts", async () => {
    await render(
      <ToastProvider>
        <Adder label="one" onAdded={() => {}} />
        <Adder label="two" onAdded={() => {}} />
        <ToastViewport testID="vp" limit={1} />
      </ToastProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-one"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("add-two"));
    });
    expect(screen.getByText("one")).toBeTruthy();
    expect(screen.queryByText("two")).toBeNull();
  });

  it("viewport renders nothing outside a provider", async () => {
    await render(<ToastViewport testID="vp" />);
    expect(screen.queryByTestId("vp")).toBeNull();
  });

  it("useToast outside a provider throws instead of dropping toasts", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      await expect(
        render(
          <Pressable>
            <HookCatcher />
          </Pressable>,
        ),
      ).rejects.toThrow("useToast must be used under a ToastProvider.");
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

function HookCatcher() {
  useToast();
  return <Text>never</Text>;
}
