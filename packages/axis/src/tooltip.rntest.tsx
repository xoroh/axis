import { render, screen, userEvent } from "@testing-library/react-native";
import { createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import { Tooltip } from "./index";

/**
 * Tooltip behavior through the public entry: long-press toggles the
 * tip, the tip carries the tooltip role and label, controlled mode
 * works. Pixel placement is NOT asserted here — anchor measurement
 * (`measure()`) needs the native runtime; the placement math is
 * covered by the `positioning` unit suites, and on-device placement
 * remains an explicit verification gap.
 */

async function longPressAnchor(label: string) {
  const anchor = screen.getByText(label).parent;
  if (anchor === null) throw new Error("tooltip test: anchor has no parent");
  await userEvent.longPress(anchor);
}

describe("Tooltip on React Native", () => {
  it("hides the tip until long-press", async () => {
    await render(
      <Tooltip testID="tip" content={<Text>Details here</Text>}>
        <Text>Info</Text>
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("toggles on long-press and reports through onOpenChange", async () => {
    const seen: boolean[] = [];
    await render(
      <Tooltip
        testID="tip"
        content={<Text>Details here</Text>}
        accessibilityLabel="More info"
        onOpenChange={(v) => seen.push(v)}
      >
        <Text>Info</Text>
      </Tooltip>,
    );
    await longPressAnchor("Info");
    expect(seen).toEqual([true]);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    expect(screen.getByLabelText("More info")).toBeTruthy();
    await longPressAnchor("Info");
    expect(seen).toEqual([true, false]);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("controlled open shows the tip with absolute positioning", async () => {
    await render(
      <Tooltip testID="tip" open content={<Text>Details here</Text>}>
        <Text>Info</Text>
      </Tooltip>,
    );
    const tip = screen.getByRole("tooltip");
    const style = tip.props.style;
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    expect(flat).toMatchObject({ position: "absolute" });
  });

  it("forwards a ref to the anchor wrapper", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Tooltip testID="tip" content={<Text>Details here</Text>} ref={ref}>
        <Text>Info</Text>
      </Tooltip>,
    );
    expect(ref.current).not.toBeNull();
  });
});
