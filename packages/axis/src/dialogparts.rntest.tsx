import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Pressable, Text as RNText } from "react-native";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "./index";

/**
 * Dialog compound parts through the public entry. Root state
 * ownership with no host element, trigger open/expanded, portal as
 * the native host, backdrop dismissal (and its disable), popup
 * surface with title/description/close, element and function
 * `render` substitution with state, and function styles — observed
 * in the RN runtime. The single-part `Dialog` keeps its own suite;
 * this suite proves the compound anatomy only.
 */

function Compound({ onOpen }: { onOpen?: (open: boolean) => void }) {
  return (
    <DialogRoot onOpenChange={onOpen}>
      <DialogTrigger accessibilityLabel="Open dialog">
        <RNText>Open</RNText>
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop testID="dlg-backdrop" />
        <DialogPopup testID="dlg-popup" accessibilityLabel="Example">
          <DialogTitle>Example dialog</DialogTitle>
          <DialogDescription>A description</DialogDescription>
          <DialogClose accessibilityLabel="Close dialog">
            <RNText>Close</RNText>
          </DialogClose>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("Dialog compound parts on React Native", () => {
  it("renders the trigger only while closed (root owns state, renders no element)", async () => {
    await render(<Compound />);
    expect(screen.getByLabelText("Open dialog")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByTestId("dlg-popup")).toBeNull();
  });

  it("opens the popup with title, description, and close", async () => {
    const seen: boolean[] = [];
    await render(<Compound onOpen={(v) => seen.push(v)} />);
    await pressLabel("Open dialog");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Example dialog")).toBeTruthy();
    expect(screen.getByText("A description")).toBeTruthy();
    expect(
      screen.getByLabelText("Open dialog").props.accessibilityState,
    ).toMatchObject({ expanded: true });
  });

  it("closes through the close button", async () => {
    const seen: boolean[] = [];
    await render(<Compound onOpen={(v) => seen.push(v)} />);
    await pressLabel("Open dialog");
    await pressLabel("Close dialog");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("dismisses through the backdrop with onDismiss first", async () => {
    const seen: boolean[] = [];
    const dismissed: boolean[] = [];
    await render(
      <DialogRoot
        onOpenChange={(v) => seen.push(v)}
        onDismiss={() => dismissed.push(true)}
      >
        <DialogTrigger accessibilityLabel="Open dialog">
          <RNText>Open</RNText>
        </DialogTrigger>
        <DialogPortal>
          <DialogBackdrop testID="dlg-backdrop" />
          <DialogPopup testID="dlg-popup" accessibilityLabel="Example" />
        </DialogPortal>
      </DialogRoot>,
    );
    await pressLabel("Open dialog");
    await pressLabel("Dismiss");
    expect(dismissed).toEqual([true]);
    expect(seen).toEqual([true, false]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders an inert backdrop when pointer dismissal is disabled", async () => {
    await render(
      <DialogRoot defaultOpen disablePointerDismissal>
        <DialogPortal>
          <DialogBackdrop testID="dlg-backdrop" />
          <DialogPopup accessibilityLabel="Example" />
        </DialogPortal>
      </DialogRoot>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByTestId("dlg-backdrop")).toBeTruthy();
  });

  it("renders nothing outside a root, even with content", async () => {
    await render(
      <DialogPortal testID="dlg-portal">
        <DialogPopup testID="dlg-popup" accessibilityLabel="Example" />
      </DialogPortal>,
    );
    expect(screen.queryByTestId("dlg-portal")).toBeNull();
    expect(screen.queryByTestId("dlg-popup")).toBeNull();
  });

  it("substitutes the trigger element via render element", async () => {
    const seen: boolean[] = [];
    await render(
      <DialogRoot onOpenChange={(v) => seen.push(v)}>
        <DialogTrigger
          render={
            <Pressable
              testID="custom-trigger"
              accessibilityLabel="Custom open"
            />
          }
        />
        <DialogPortal>
          <DialogPopup accessibilityLabel="Example" />
        </DialogPortal>
      </DialogRoot>,
    );
    await pressLabel("Custom open");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("calls function render with (props, state)", async () => {
    const states: Array<{ open: boolean; disabled: boolean }> = [];
    await render(
      <DialogRoot defaultOpen>
        <DialogTrigger
          render={(_props, state) => {
            states.push(state);
            return null;
          }}
        />
        <DialogPortal>
          <DialogPopup accessibilityLabel="Example" />
        </DialogPortal>
      </DialogRoot>,
    );
    expect(states).toEqual([{ open: true, disabled: false }]);
  });

  it("applies function styles with part state", async () => {
    await render(
      <DialogRoot defaultOpen>
        <DialogPortal>
          <DialogPopup
            testID="dlg-popup"
            accessibilityLabel="Example"
            style={(state) => ({ opacity: state.open ? 1 : 0 })}
          />
        </DialogPortal>
      </DialogRoot>,
    );
    const flat: Record<string, unknown> = Object.assign(
      {},
      ...(Array.isArray(screen.getByTestId("dlg-popup").props.style)
        ? screen.getByTestId("dlg-popup").props.style
        : [screen.getByTestId("dlg-popup").props.style]
      ).filter(Boolean),
    );
    expect(flat.opacity).toBe(1);
  });

  it("follows controlled open state", async () => {
    await render(
      <DialogRoot open={false}>
        <DialogPortal>
          <DialogPopup testID="dlg-popup" accessibilityLabel="Example" />
        </DialogPortal>
      </DialogRoot>,
    );
    expect(screen.queryByTestId("dlg-popup")).toBeNull();
  });

  it("renders trigger inert outside a root", async () => {
    await render(
      <DialogTrigger accessibilityLabel="Orphan" testID="orphan">
        <RNText>Orphan</RNText>
      </DialogTrigger>,
    );
    await pressLabel("Orphan");
    expect(screen.getByTestId("orphan").props.accessibilityState).toMatchObject(
      { disabled: true },
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
