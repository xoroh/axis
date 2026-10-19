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
  PortalHost,
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

async function pressLabel(label: string, hidden = false) {
  await act(async () => {
    fireEvent.press(
      screen.getByLabelText(
        label,
        hidden ? { includeHiddenElements: true } : undefined,
      ),
    );
  });
}

describe("Dialog compound parts on React Native", () => {
  it("renders the trigger only while closed (root owns state, renders no element)", async () => {
    await render(
      <PortalHost>
        <Compound />
      </PortalHost>,
    );
    expect(screen.getByLabelText("Open dialog")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByTestId("dlg-popup")).toBeNull();
  });

  it("opens the popup with title, description, and close", async () => {
    const seen: boolean[] = [];
    await render(
      <PortalHost>
        <Compound onOpen={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await pressLabel("Open dialog");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Example dialog")).toBeTruthy();
    expect(screen.getByText("A description")).toBeTruthy();
    // The trigger sits behind the open modal layer, so it is hidden
    // from assistive tech (`accessibilityViewIsModal` on the top
    // overlay layer) — the same thing VoiceOver does with a dialog.
    // Its state is still readable with the hidden-element opt-in.
    expect(
      screen.getByLabelText("Open dialog", { includeHiddenElements: true })
        .props.accessibilityState,
    ).toMatchObject({ expanded: true });
  });

  it("reports trigger-press, close-press, and outside-press reasons", async () => {
    const seen: Array<{ open: boolean; reason?: string }> = [];
    await render(
      <PortalHost>
        <DialogRoot
          onOpenChange={(v, details) =>
            seen.push({ open: v, reason: details?.reason })
          }
        >
          <DialogTrigger accessibilityLabel="Open dialog">
            <RNText>Open</RNText>
          </DialogTrigger>
          <DialogPortal>
            <DialogBackdrop testID="dlg-backdrop" />
            <DialogPopup testID="dlg-popup" accessibilityLabel="Example">
              <DialogClose accessibilityLabel="Close dialog">
                <RNText>Close</RNText>
              </DialogClose>
            </DialogPopup>
          </DialogPortal>
        </DialogRoot>
      </PortalHost>,
    );
    await pressLabel("Open dialog");
    await pressLabel("Close dialog");
    // Reopen for the scrim path (the close unmounted the popup).
    await pressLabel("Open dialog", true);
    await pressLabel("Dismiss", true);
    expect(seen).toEqual([
      { open: true, reason: "trigger-press" },
      { open: false, reason: "close-press" },
      { open: true, reason: "trigger-press" },
      { open: false, reason: "outside-press" },
    ]);
  });

  it("dismisses through the backdrop with onDismiss first", async () => {
    const seen: boolean[] = [];
    const dismissed: boolean[] = [];
    await render(
      <PortalHost>
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
        </DialogRoot>
      </PortalHost>,
    );
    await pressLabel("Open dialog");
    // The open modal popup claims iOS modality, so the scrim sibling
    // hides from assistive tech exactly like the trigger does (same
    // hidden-element opt-in as the trigger assertion above) — on
    // Android the labelled scrim stays reachable (see overlay.md).
    await pressLabel("Dismiss", true);
    expect(dismissed).toEqual([true]);
    expect(seen).toEqual([true, false]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders an inert backdrop when pointer dismissal is disabled", async () => {
    await render(
      <PortalHost>
        <DialogRoot defaultOpen disablePointerDismissal>
          <DialogPortal>
            <DialogBackdrop testID="dlg-backdrop" />
            <DialogPopup accessibilityLabel="Example" />
          </DialogPortal>
        </DialogRoot>
      </PortalHost>,
    );
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    expect(screen.getByRole("dialog")).toBeTruthy();
    // Inert but present — and hidden from AT behind the modal popup
    // (the iOS modality rule above), so the hidden opt-in applies.
    expect(
      screen.getByTestId("dlg-backdrop", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("renders nothing outside a root, even with content", async () => {
    await render(
      <PortalHost>
        <DialogPortal testID="dlg-portal">
          <DialogPopup testID="dlg-popup" accessibilityLabel="Example" />
        </DialogPortal>
      </PortalHost>,
    );
    expect(screen.queryByTestId("dlg-portal")).toBeNull();
    expect(screen.queryByTestId("dlg-popup")).toBeNull();
  });

  it("substitutes the trigger element via render element", async () => {
    const seen: boolean[] = [];
    await render(
      <PortalHost>
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
        </DialogRoot>
      </PortalHost>,
    );
    await pressLabel("Custom open");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("calls function render with (props, state)", async () => {
    const states: Array<{ open: boolean; disabled: boolean }> = [];
    await render(
      <PortalHost>
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
        </DialogRoot>
      </PortalHost>,
    );
    expect(states).toEqual([{ open: true, disabled: false }]);
  });

  it("applies function styles with part state", async () => {
    await render(
      <PortalHost>
        <DialogRoot defaultOpen>
          <DialogPortal>
            <DialogPopup
              testID="dlg-popup"
              accessibilityLabel="Example"
              style={(state) => ({ opacity: state.open ? 1 : 0 })}
            />
          </DialogPortal>
        </DialogRoot>
      </PortalHost>,
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
      <PortalHost>
        <DialogRoot open={false}>
          <DialogPortal>
            <DialogPopup testID="dlg-popup" accessibilityLabel="Example" />
          </DialogPortal>
        </DialogRoot>
      </PortalHost>,
    );
    expect(screen.queryByTestId("dlg-popup")).toBeNull();
  });

  it("renders trigger inert outside a root", async () => {
    await render(
      <PortalHost>
        <DialogTrigger accessibilityLabel="Orphan" testID="orphan">
          <RNText>Orphan</RNText>
        </DialogTrigger>
      </PortalHost>,
    );
    await pressLabel("Orphan");
    expect(screen.getByTestId("orphan").props.accessibilityState).toMatchObject(
      { disabled: true },
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
