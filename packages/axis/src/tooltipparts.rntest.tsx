import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  TooltipArrow,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
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
 * (the monolith tooltip precedent: measurement needs the native
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
  );
}

describe("Tooltip compound parts on React Native", () => {
  it("hides the tip until long-press", async () => {
    await render(<TipCompound />);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("toggles on long-press and reports", async () => {
    const seen: boolean[] = [];
    await render(<TipCompound onOpenChange={(v) => seen.push(v)} />);
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
    const view = await render(<TipCompound open={false} />);
    expect(screen.queryByRole("tooltip")).toBeNull();
    view.rerender(<TipCompound open />);
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("is terminal when disabled: no show, no callbacks", async () => {
    const onOpenChange = jest.fn();
    await render(
      <TipCompound disabled defaultOpen onOpenChange={onOpenChange} />,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
    await longPressTrigger("tip-trigger");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("substitutes the popup via render", async () => {
    await render(
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
      </TooltipRoot>,
    );
    expect(screen.getByTestId("r-popup-custom")).toBeTruthy();
  });

  it("reports state to function styles", async () => {
    const seen: Array<{ open: boolean }> = [];
    await render(
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
      </TooltipRoot>,
    );
    expect(seen[0]).toEqual({ open: false });
    await longPressTrigger("s-trigger");
    expect(seen[seen.length - 1]).toEqual({ open: true });
  });

  it("renders the trigger inert outside a root", async () => {
    await render(
      <TooltipTrigger testID="o-trigger">
        <Text>Info</Text>
      </TooltipTrigger>,
    );
    expect(screen.getByTestId("o-trigger").props.disabled).toBe(true);
    await longPressTrigger("o-trigger");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
