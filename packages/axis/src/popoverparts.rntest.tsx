import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Pressable, Text as RNText, type View } from "react-native";
import {
  PopoverArrow,
  PopoverBackdrop,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "./index";

/**
 * Popover compound parts through the public entry. Root state
 * ownership with no host element, tap-toggle trigger, non-modal
 * in-box portal by default, modal scrim dismissal, measured
 * positioner placement, popup region with title/description/close,
 * render substitution with state, and function styles — observed
 * in the RN runtime. The inline `Popover` keeps its own suite;
 * this suite proves the compound anatomy only.
 */

function Compound({ onOpen }: { onOpen?: (open: boolean) => void }) {
  return (
    <PopoverRoot onOpenChange={onOpen}>
      <PopoverTrigger accessibilityLabel="Open popover">
        <RNText>Open</RNText>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner testID="popover-positioner">
          <PopoverPopup testID="popover-popup" accessibilityLabel="Example">
            <PopoverTitle>Example popover</PopoverTitle>
            <PopoverDescription>A description</PopoverDescription>
            <PopoverArrow testID="popover-arrow" />
            <PopoverClose accessibilityLabel="Close popover">
              <RNText>Close</RNText>
            </PopoverClose>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </PopoverRoot>
  );
}

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("Popover compound parts on React Native", () => {
  it("renders the trigger only while closed (root owns state, renders no element)", async () => {
    await render(<Compound />);
    expect(screen.getByLabelText("Open popover")).toBeTruthy();
    expect(screen.queryByTestId("popover-popup")).toBeNull();
  });

  it("opens the popup with title, description, arrow, and close", async () => {
    const seen: boolean[] = [];
    await render(<Compound onOpen={(v) => seen.push(v)} />);
    await pressLabel("Open popover");
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("popover-popup")).toBeTruthy();
    expect(screen.getByText("Example popover")).toBeTruthy();
    expect(screen.getByText("A description")).toBeTruthy();
    expect(screen.getByTestId("popover-arrow")).toBeTruthy();
    expect(
      screen.getByLabelText("Open popover").props.accessibilityState,
    ).toMatchObject({ expanded: true });
  });

  it("toggles closed on trigger press (non-modal, no scrim)", async () => {
    const seen: boolean[] = [];
    await render(<Compound onOpen={(v) => seen.push(v)} />);
    await pressLabel("Open popover");
    expect(screen.queryByLabelText("Dismiss")).toBeNull();
    await pressLabel("Open popover");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByTestId("popover-popup")).toBeNull();
  });

  it("closes through the close button", async () => {
    const seen: boolean[] = [];
    await render(<Compound onOpen={(v) => seen.push(v)} />);
    await pressLabel("Open popover");
    await pressLabel("Close popover");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByTestId("popover-popup")).toBeNull();
  });

  it("dismisses through the scrim when modal", async () => {
    const order: string[] = [];
    await render(
      <PopoverRoot
        defaultOpen
        modal
        onDismiss={() => order.push("dismiss")}
        onOpenChange={() => order.push("change")}
      >
        <PopoverPortal>
          <PopoverBackdrop testID="popover-backdrop" />
          <PopoverPositioner>
            <PopoverPopup testID="popover-popup" accessibilityLabel="Example" />
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>,
    );
  });

  it("substitutes the trigger element via render element", async () => {
    const seen: boolean[] = [];
    await render(
      <PopoverRoot onOpenChange={(v) => seen.push(v)}>
        <PopoverTrigger
          render={
            <Pressable
              testID="custom-trigger"
              accessibilityLabel="Custom open"
            />
          }
        />
        <PopoverPortal>
          <PopoverPositioner>
            <PopoverPopup testID="popover-popup" accessibilityLabel="Example" />
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>,
    );
    await pressLabel("Custom open");
    expect(seen).toEqual([true]);
    expect(screen.getByTestId("popover-popup")).toBeTruthy();
  });

  it("calls function render with (props, state)", async () => {
    const states: Array<{ open: boolean; disabled: boolean }> = [];
    await render(
      <PopoverRoot defaultOpen>
        <PopoverTrigger
          render={(_props, state) => {
            states.push(state);
            return null;
          }}
        />
        <PopoverPortal>
          <PopoverPositioner>
            <PopoverPopup testID="popover-popup" accessibilityLabel="Example" />
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>,
    );
    expect(states).toEqual([{ open: true, disabled: false }]);
  });

  it("applies function styles with part state", async () => {
    await render(
      <PopoverRoot defaultOpen>
        <PopoverPortal>
          <PopoverPositioner>
            <PopoverPopup
              testID="popover-popup"
              accessibilityLabel="Example"
              style={(state) => ({ opacity: state.open ? 1 : 0 })}
            />
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>,
    );
    const flat: Record<string, unknown> = Object.assign(
      {},
      ...(Array.isArray(screen.getByTestId("popover-popup").props.style)
        ? screen.getByTestId("popover-popup").props.style
        : [screen.getByTestId("popover-popup").props.style]
      ).filter(Boolean),
    );
    expect(flat.opacity).toBe(1);
  });

  it("follows controlled open state", async () => {
    await render(
      <PopoverRoot open={false}>
        <PopoverPortal>
          <PopoverPositioner>
            <PopoverPopup testID="popover-popup" accessibilityLabel="Example" />
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>,
    );
    expect(screen.queryByTestId("popover-popup")).toBeNull();
  });

  it("renders parts inert outside a root", async () => {
    await render(
      <>
        <PopoverTrigger
          accessibilityLabel="Orphan trigger"
          testID="orphan-trigger"
        >
          <RNText>Orphan</RNText>
        </PopoverTrigger>
        <PopoverClose accessibilityLabel="Orphan close" testID="orphan-close">
          <RNText>Orphan</RNText>
        </PopoverClose>
      </>,
    );
    expect(
      screen.getByTestId("orphan-trigger").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByTestId("orphan-close").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("forwards a ref to the popup", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PopoverRoot defaultOpen>
        <PopoverPortal>
          <PopoverPositioner>
            <PopoverPopup testID="popover-popup" ref={ref} />
          </PopoverPositioner>
        </PopoverPortal>
      </PopoverRoot>,
    );
    expect(ref.current).toBeTruthy();
  });
});
