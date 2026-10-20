import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import {
  ContextMenuBackdrop,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
  PortalHost,
} from "./index";

/**
 * ContextMenu compound behavior through the public entry: long-press opens a
 * measured menu, scrim or item press dismisses, controlled
 * mode works — observed in the RN runtime.
 */

async function longPressAnchor() {
  await act(async () => {
    fireEvent(screen.getByTestId("cm-trigger"), "longPress");
  });
}

describe("ContextMenu compound on React Native", () => {
  it("hides the menu until long-press", async () => {
    await render(
      <PortalHost>
        <ContextMenuRoot>
          <ContextMenuTrigger testID="cm-trigger">
            <Text>File</Text>
          </ContextMenuTrigger>
          <ContextMenuPortal>
            <ContextMenuBackdrop testID="cm-scrim" />
            <ContextMenuPositioner testID="cm-positioner">
              <ContextMenuPopup testID="cm-popup">
                <ContextMenuItem testID="cm-item">
                  <Text>Rename</Text>
                </ContextMenuItem>
              </ContextMenuPopup>
            </ContextMenuPositioner>
          </ContextMenuPortal>
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
          onOpenChange={(v) => seen.push(v)}
          onDismiss={() => dismissed.push(1)}
        >
          <ContextMenuTrigger testID="cm-trigger">
            <Text>File</Text>
          </ContextMenuTrigger>
          <ContextMenuPortal>
            <ContextMenuBackdrop testID="cm-scrim" />
            <ContextMenuPositioner testID="cm-positioner">
              <ContextMenuPopup testID="cm-popup" aria-label="File actions">
                <ContextMenuItem testID="cm-item">
                  <Text>Rename</Text>
                </ContextMenuItem>
              </ContextMenuPopup>
            </ContextMenuPositioner>
          </ContextMenuPortal>
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

  it("item selection calls onSelect and closes menu", async () => {
    let selected = 0;
    await render(
      <PortalHost>
        <ContextMenuRoot defaultOpen>
          <ContextMenuTrigger>
            <Text>File</Text>
          </ContextMenuTrigger>
          <ContextMenuPortal>
            <ContextMenuBackdrop />
            <ContextMenuPositioner>
              <ContextMenuPopup aria-label="File actions">
                <ContextMenuItem onSelect={() => (selected += 1)}>
                  <Text>Rename</Text>
                </ContextMenuItem>
                <ContextMenuSeparator />
              </ContextMenuPopup>
            </ContextMenuPositioner>
          </ContextMenuPortal>
        </ContextMenuRoot>
      </PortalHost>,
    );
    expect(screen.getByRole("menu")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByRole("menuitem"));
    });
    expect(selected).toBe(1);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("controlled open shows the menu", async () => {
    await render(
      <PortalHost>
        <ContextMenuRoot open>
          <ContextMenuTrigger>
            <Text>File</Text>
          </ContextMenuTrigger>
          <ContextMenuPortal>
            <ContextMenuBackdrop />
            <ContextMenuPositioner>
              <ContextMenuPopup>
                <ContextMenuItem>
                  <Text>Rename</Text>
                </ContextMenuItem>
              </ContextMenuPopup>
            </ContextMenuPositioner>
          </ContextMenuPortal>
        </ContextMenuRoot>
      </PortalHost>,
    );
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("forwards a ref to the trigger host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <ContextMenuRoot>
          <ContextMenuTrigger ref={ref}>
            <Text>File</Text>
          </ContextMenuTrigger>
        </ContextMenuRoot>
      </PortalHost>,
    );
    expect(ref.current).not.toBeNull();
  });
});
