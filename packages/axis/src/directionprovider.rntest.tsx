import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { I18nManager, Text } from "react-native";
import { DirectionProvider, useDirection } from "./index";

/**
 * DirectionProvider behavior through the public entry: the Base UI
 * direction API (`<DirectionProvider direction>` +
 * `useDirection()`, default `"ltr"`) with the native-locale
 * fallback (`I18nManager.isRTL`) when no provider is present.
 */

function Probe({ testID }: { testID: string }) {
  const direction = useDirection();
  return <Text testID={testID}>{direction}</Text>;
}

describe("DirectionProvider on React Native", () => {
  it("defaults to ltr with no provider (test runtime is LTR)", async () => {
    await render(<Probe testID="dir" />);
    expect(screen.getByText("ltr")).toBeTruthy();
  });

  it("provides the configured direction to descendants", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <Probe testID="dir" />
      </DirectionProvider>,
    );
    expect(screen.getByText("rtl")).toBeTruthy();
  });

  it("falls back to I18nManager.isRTL with no provider", async () => {
    const previous = I18nManager.isRTL;
    (I18nManager as { isRTL: boolean }).isRTL = true;
    try {
      await act(async () => {
        await render(<Probe testID="dir" />);
      });
      expect(screen.getByText("rtl")).toBeTruthy();
    } finally {
      (I18nManager as { isRTL: boolean }).isRTL = previous;
    }
  });

  it("nests: the nearest provider wins", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <DirectionProvider direction="ltr">
          <Probe testID="dir" />
        </DirectionProvider>
      </DirectionProvider>,
    );
    expect(screen.getByText("ltr")).toBeTruthy();
  });
});
