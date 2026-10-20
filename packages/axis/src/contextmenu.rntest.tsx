import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import { ContextMenuRoot, PortalHost } from "./index";

/**
 * ContextMenuRoot behavior through the public entry: long-press opens a
 * measured menu, scrim or second long-press dismisses, controlled
 * mode works — observed in the RN runtime.
 */

async function longPressAnchor() {
  const anchor = screen.getByText("File").parent;
  if (anchor === null) throw new Error("contextmenu test: no anchor parent");
  await userEvent.longPress(anchor);
}

describe("ContextMenuRoot on React Native", () => {
  it("hides the menu until long-press", async () => {
    await render(
      <PortalHost>
        <ContextMenuRoot testID="cm" content={<Text>Rename</Text>}>
          <Text>File</Text>
        </ContextMenuRoot>
      </PortalHost>,
    );
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens on long-press and dismisses via scrim", async () => {
    const seen: boolean[] = [];
    const dismissed: number[] = [];
    await render(
      <PortalHost>
        <ContextMenuRoot
          testID="cm"
          content={<Text>Rename</Text>}
          aria-label="File actions"
          onOpenChange={(v) => seen.push(v)}
          onDismiss={() => dismissed.push(1)}
        >
          <Text>File</Text>
        </ContextMenuRoot>
      </PortalHost>,
    );
    await longPressAnchor();
    expect(seen).toEqual([true]);
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByLabelText("File actions")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Dismiss menu"));
    });
    expect(dismissed).toEqual([1]);
    expect(seen).toEqual([true, false]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("second long-press closes", async () => {
    await render(
      <PortalHost>
        <ContextMenuRoot testID="cm" content={<Text>Rename</Text>}>
          <Text>File</Text>
        </ContextMenuRoot>
      </PortalHost>,
    );
    await longPressAnchor();
    expect(screen.getByRole("menu")).toBeTruthy();
    await longPressAnchor();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("controlled open shows the menu", async () => {
    await render(
      <PortalHost>
        <ContextMenuRoot testID="cm" open content={<Text>Rename</Text>}>
          <Text>File</Text>
        </ContextMenuRoot>
      </PortalHost>,
    );
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("forwards a ref to the anchor wrapper", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <ContextMenuRoot testID="cm" ref={ref} content={<Text>Rename</Text>}>
          <Text>File</Text>
        </ContextMenuRoot>
      </PortalHost>,
    );
    expect(ref.current).not.toBeNull();
  });
});
