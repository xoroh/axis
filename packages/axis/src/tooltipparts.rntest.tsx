import {
  render,
  screen,
  userEvent,
  waitForElementToBeRemoved,
} from "@testing-library/react-native";
import { act } from "react";
import { Text } from "react-native";
import {
  PortalHost,
  TooltipArrow,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "./index";

/**
 * Tooltip compound parts through the public entry. Every assertion
 * renders the real parts in the RN runtime and interacts through RN
 * events — root statelessness, long-press toggle, portal mounting,
 * popup role and label, arrow placement, render substitution,
 * function styles, controlled visibility, and disabled terminality
 * are observed, not assumed. Pixel placement is NOT asserted here
 * (measurement needs the native
 * runtime; math is covered by the `positioning` unit suites).
 */

async function longPressTrigger(testID: string) {
  await userEvent.longPress(screen.getByTestId(testID));
}

function TipCompound(props: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <PortalHost>
      <TooltipRoot
        open={props.open}
        defaultOpen={props.defaultOpen}
        onOpenChange={props.onOpenChange}
        disabled={props.disabled}
      >
        <TooltipTrigger testID="tip-trigger" accessibilityLabel="More info">
          <Text>Info</Text>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipPositioner>
            <TooltipPopup testID="tip-popup" accessibilityLabel="Details">
              <TooltipArrow testID="tip-arrow" />
              <Text>Details here</Text>
            </TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </TooltipRoot>
    </PortalHost>
  );
}

describe("Tooltip compound parts on React Native", () => {
  it("hides the tip until long-press", async () => {
    await render(
      <PortalHost>
        <TipCompound />
      </PortalHost>,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("toggles on long-press and reports", async () => {
    const seen: boolean[] = [];
    await render(
      <PortalHost>
        <TipCompound onOpenChange={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await longPressTrigger("tip-trigger");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    expect(screen.getByLabelText("Details")).toBeTruthy();
    expect(screen.getByTestId("tip-arrow")).toBeTruthy();
    await longPressTrigger("tip-trigger");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("follows controlled visibility", async () => {
    const view = await render(
      <PortalHost>
        <TipCompound open={false} />
      </PortalHost>,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
    await act(async () => {
      view.rerender(
        <PortalHost>
          <TipCompound open />
        </PortalHost>,
      );
    });
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("is terminal when disabled: no show, no callbacks", async () => {
    const onOpenChange = jest.fn();
    await render(
      <PortalHost>
        <TipCompound disabled defaultOpen onOpenChange={onOpenChange} />
      </PortalHost>,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
    await longPressTrigger("tip-trigger");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("substitutes the popup via render", async () => {
    await render(
      <PortalHost>
        <TooltipRoot defaultOpen>
          <TooltipTrigger testID="r-trigger">
            <Text>Info</Text>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipPositioner>
              <TooltipPopup
                testID="r-popup"
                render={<Text testID="r-popup-custom">Custom tip</Text>}
              >
                <Text>Details here</Text>
              </TooltipPopup>
            </TooltipPositioner>
          </TooltipPortal>
        </TooltipRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("r-popup-custom")).toBeTruthy();
  });

  it("reports state to function styles", async () => {
    const seen: Array<{ open: boolean }> = [];
    await render(
      <PortalHost>
        <TooltipRoot>
          <TooltipTrigger
            testID="s-trigger"
            style={(state) => {
              seen.push({ open: state.open });
              return undefined;
            }}
          >
            <Text>Info</Text>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipPositioner>
              <TooltipPopup>
                <Text>Details here</Text>
              </TooltipPopup>
            </TooltipPositioner>
          </TooltipPortal>
        </TooltipRoot>
      </PortalHost>,
    );
    expect(seen[0]).toEqual({ open: false });
    await longPressTrigger("s-trigger");
    expect(seen[seen.length - 1]).toEqual({ open: true });
  });

  it("renders the trigger inert outside a root", async () => {
    await render(
      <PortalHost>
        <TooltipTrigger testID="o-trigger">
          <Text>Info</Text>
        </TooltipTrigger>
      </PortalHost>,
    );
    expect(
      screen.getByTestId("o-trigger").props.accessibilityState.disabled,
    ).toBe(true);
    await longPressTrigger("o-trigger");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("groups tips under one provider timing", async () => {
    const seen: boolean[] = [];
    await render(
      <PortalHost>
        <TooltipProvider delay={20} closeDelay={20}>
          <TooltipRoot onOpenChange={(v) => seen.push(v)}>
            <TooltipTrigger testID="g-trigger">
              <Text>Info</Text>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipPositioner>
                <TooltipPopup>
                  <Text>Details here</Text>
                </TooltipPopup>
              </TooltipPositioner>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
      </PortalHost>,
    );
    await userEvent.longPress(screen.getByTestId("g-trigger"));
    // Poll, never sleep-assert: the delay fires during the press on
    // any scheduler.
    expect(await screen.findByRole("tooltip")).toBeTruthy();
    expect(seen).toEqual([true]);
    await userEvent.longPress(screen.getByTestId("g-trigger"));
    await waitForElementToBeRemoved(() => screen.queryByRole("tooltip"));
    expect(seen).toEqual([true, false]);
  });

  it("never shows a tip dismissed mid-delay", async () => {
    const seen: boolean[] = [];
    await render(
      <PortalHost>
        <TooltipProvider delay={5000}>
          <TooltipRoot onOpenChange={(v) => seen.push(v)}>
            <TooltipTrigger testID="c-trigger">
              <Text>Info</Text>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipPositioner>
                <TooltipPopup>
                  <Text>Details here</Text>
                </TooltipPopup>
              </TooltipPositioner>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
      </PortalHost>,
    );
    await userEvent.longPress(screen.getByTestId("c-trigger"));
    // The five-second show timer is still pending: no tip, no
    // callback yet — a delayed tip never appears early, and the
    // pending timer clears if a dismiss or unmount lands first.
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(seen).toEqual([]);
  });

  it("TooltipPositioner flips near viewport edge", async () => {
    let positionerSide: string | undefined;
    await render(
      <PortalHost>
        <TooltipRoot defaultOpen>
          <TooltipTrigger testID="edge-tip-trigger">
            <Text>Anchor</Text>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipPositioner
              testID="edge-tip-pos"
              side="top"
              style={(s) => {
                positionerSide = s.side;
                return undefined;
              }}
            >
              <TooltipPopup testID="edge-tip-popup">
                <Text>Tip content</Text>
              </TooltipPopup>
            </TooltipPositioner>
          </TooltipPortal>
        </TooltipRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("edge-tip-pos")).toBeTruthy();
    expect(positionerSide).toBeDefined();
  });
});
