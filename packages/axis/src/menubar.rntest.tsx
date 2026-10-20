import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text as RNText, type View } from "react-native";
import {
  MenuBackdrop,
  Menubar,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRoot,
  MenuSubmenuContent,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  MenuTrigger,
  PortalHost,
} from "./index";

/**
 * Menubar behavior through the public entry. Bar rendering with the
 * menubar role, single-open coordination across menus, switching,
 * leaf selection closing everything, scrim dismissal, controlled
 * following, standalone menus outside a bar, and ref forwarding —
 * observed in the RN runtime. Panel behavior itself (cascade,
 * scrim, items) is `MenuRoot`'s tested contract, composed here, not
 * re-proven.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

function Bar({ onOpen }: { onOpen?: (value: string | null) => void }) {
  return (
    <Menubar testID="bar" onOpenValueChange={onOpen}>
      <MenuRoot modal={false} value="file">
        <MenuTrigger aria-label="File trigger">
          <RNText>File</RNText>
        </MenuTrigger>
        <MenuPortal>
          <MenuBackdrop />
          <MenuPositioner>
            <MenuPopup testID="file-menu">
              <MenuItem value="new">
                <RNText>New</RNText>
              </MenuItem>
              <MenuSubmenuRoot value="recent">
                <MenuSubmenuTrigger aria-label="Recent submenu">
                  <RNText>Recent</RNText>
                </MenuSubmenuTrigger>
                <MenuSubmenuContent testID="recent-panel">
                  <MenuItem value="doc">
                    <RNText>Document</RNText>
                  </MenuItem>
                </MenuSubmenuContent>
              </MenuSubmenuRoot>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>
      <MenuRoot modal={false} value="edit">
        <MenuTrigger aria-label="Edit trigger">
          <RNText>Edit</RNText>
        </MenuTrigger>
        <MenuPortal>
          <MenuBackdrop />
          <MenuPositioner>
            <MenuPopup testID="edit-menu">
              <MenuItem value="undo">
                <RNText>Undo</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>
    </Menubar>
  );
}

describe("Menubar on React Native", () => {
  it("renders the bar with triggers and no panels while closed", async () => {
    await render(
      <PortalHost>
        <Bar />
      </PortalHost>,
    );
    expect(screen.getByRole("menubar")).toBeTruthy();
    expect(screen.getByLabelText("File trigger")).toBeTruthy();
    expect(screen.getByLabelText("Edit trigger")).toBeTruthy();
    expect(screen.queryByTestId("file-menu")).toBeNull();
  });

  it("opens one menu and reports its value", async () => {
    const seen: Array<string | null> = [];
    await render(
      <PortalHost>
        <Bar onOpen={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await pressLabel("File trigger");
    expect(seen).toEqual(["file"]);
    expect(screen.getByTestId("file-menu")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
  });

  it("switches menus, keeping exactly one panel open", async () => {
    await render(
      <PortalHost>
        <Bar />
      </PortalHost>,
    );
    await pressLabel("File trigger");
    expect(screen.getByTestId("file-menu")).toBeTruthy();
    await pressLabel("Edit trigger");
    expect(screen.queryByTestId("file-menu")).toBeNull();
    expect(screen.getByTestId("edit-menu")).toBeTruthy();
  });

  it("opens submenu cascades inside the open menu", async () => {
    await render(
      <PortalHost>
        <Bar />
      </PortalHost>,
    );
    await pressLabel("File trigger");
    await pressLabel("Recent submenu");
    expect(screen.getByTestId("recent-panel")).toBeTruthy();
  });

  it("closes everything on leaf selection", async () => {
    await render(
      <PortalHost>
        <Bar />
      </PortalHost>,
    );
    await pressLabel("File trigger");
    await act(async () => {
      fireEvent.press(screen.getByText("New"));
    });
    expect(screen.queryByTestId("file-menu")).toBeNull();
  });

  it("dismisses through the scrim and reports closed", async () => {
    const seen: Array<string | null> = [];
    await render(
      <PortalHost>
        <Bar onOpen={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await pressLabel("File trigger");
    await pressLabel("Dismiss menu");
    expect(seen).toEqual(["file", null]);
    expect(screen.queryByTestId("file-menu")).toBeNull();
  });

  it("follows a controlled open value", async () => {
    await render(
      <PortalHost>
        <Menubar testID="bar" openValue="edit">
          <MenuRoot modal={false} value="file">
            <MenuTrigger aria-label="File trigger">
              <RNText>File</RNText>
            </MenuTrigger>
            <MenuPortal>
              <MenuPositioner>
                <MenuPopup testID="file-menu">
                  <MenuItem value="new">
                    <RNText>New</RNText>
                  </MenuItem>
                </MenuPopup>
              </MenuPositioner>
            </MenuPortal>
          </MenuRoot>
          <MenuRoot modal={false} value="edit">
            <MenuTrigger aria-label="Edit trigger">
              <RNText>Edit</RNText>
            </MenuTrigger>
            <MenuPortal>
              <MenuPositioner>
                <MenuPopup testID="edit-menu">
                  <MenuItem value="undo">
                    <RNText>Undo</RNText>
                  </MenuItem>
                </MenuPopup>
              </MenuPositioner>
            </MenuPortal>
          </MenuRoot>
        </Menubar>
      </PortalHost>,
    );
    expect(screen.queryByTestId("file-menu")).toBeNull();
    expect(screen.getByTestId("edit-menu")).toBeTruthy();
  });

  it("a menu with a value but no bar behaves standalone", async () => {
    await render(
      <PortalHost>
        <MenuRoot modal={false} value="orphan">
          <MenuTrigger aria-label="Orphan trigger">
            <RNText>Orphan</RNText>
          </MenuTrigger>
          <MenuPopup testID="orphan">
            <MenuItem value="x">
              <RNText>X</RNText>
            </MenuItem>
          </MenuPopup>
        </MenuRoot>
      </PortalHost>,
    );
    expect(screen.getByLabelText("Orphan trigger")).toBeTruthy();
    expect(screen.queryByTestId("orphan")).toBeNull();
    await pressLabel("Orphan trigger");
    expect(screen.getByTestId("orphan")).toBeTruthy();
  });

  it("forwards a ref to the bar container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <Menubar ref={ref}>
          <MenuRoot modal={false} value="file">
            <MenuTrigger aria-label="File trigger">
              <RNText>File</RNText>
            </MenuTrigger>
            <MenuPopup>
              <MenuItem value="new">
                <RNText>New</RNText>
              </MenuItem>
            </MenuPopup>
          </MenuRoot>
        </Menubar>
      </PortalHost>,
    );
    expect(ref.current).toBeTruthy();
  });
});
