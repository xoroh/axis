import { render, screen } from "@testing-library/react-native";
import { act, useMemo } from "react";
import { Text } from "react-native";
import {
  createOverlayModality,
  useOverlayModality,
  useOverlayRegistration,
} from "./index";

/**
 * Overlay stack under the React Native runtime. Two mounted overlays resolve
 * a single topmost interactive one; unmounting restores the previous top;
 * a mounted-but-inactive registration never enters the stack. Pure-stack
 * semantics, proven in the RN host with no DOM.
 */

function OverlayProbe({
  registry,
  id,
  active,
}: {
  registry: ReturnType<typeof createOverlayModality>;
  id: string;
  active?: boolean;
}) {
  useOverlayRegistration(registry, id, active);
  return null;
}

function StackReader({
  registry,
}: {
  registry: ReturnType<typeof createOverlayModality>;
}) {
  const state = useOverlayModality(registry);
  return <Text testID="top">{state.top ?? "none"}</Text>;
}

describe("overlay modality on React Native", () => {
  it("last registered is top; unmount restores the previous top", async () => {
    const registry = createOverlayModality();
    function Host({ showSecond }: { showSecond: boolean }) {
      const stable = useMemo(() => registry, []);
      return (
        <>
          <OverlayProbe registry={stable} id="sheet" />
          {showSecond ? <OverlayProbe registry={stable} id="dialog" /> : null}
          <StackReader registry={stable} />
        </>
      );
    }
    const rendered = await render(<Host showSecond={false} />);
    expect(screen.getByTestId("top").props.children).toBe("sheet");
    await act(async () => {
      rendered.rerender(<Host showSecond={true} />);
    });
    expect(screen.getByTestId("top").props.children).toBe("dialog");
    await act(async () => {
      rendered.rerender(<Host showSecond={false} />);
    });
    expect(screen.getByTestId("top").props.children).toBe("sheet");
  });

  it("mounted-but-inactive registration never enters the stack", async () => {
    const registry = createOverlayModality();
    await render(
      <>
        <OverlayProbe registry={registry} id="sheet" />
        <OverlayProbe registry={registry} id="closed-sheet" active={false} />
        <StackReader registry={registry} />
      </>,
    );
    expect(screen.getByTestId("top").props.children).toBe("sheet");
  });
});
