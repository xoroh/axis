import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text as RNText, type View } from "react-native";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Menubar,
  MenubarMenu,
  PortalHost,
} from "./index";

/**
 * Menubar behavior through the public entry. Bar rendering with the
 * menubar role, single-open coordination across menus, switching,
 * leaf selection closing everything, scrim dismissal, controlled
 * following, orphan menus rendering nothing, and ref forwarding —
 * observed in the RN runtime. Panel behavior itself (cascade,
 * scrim, items) is `DropdownMenuRoot`'s tested contract, composed here,
 * not re-proven.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

function Bar({ onOpen }: { onOpen?: (value: string | null) => void }) {
  return (
    <Menubar testID="bar" onOpenValueChange={onOpen}>
      <MenubarMenu value="file" testID="file-menu">
        <DropdownMenuTrigger accessibilityLabel="File trigger">
          <RNText>File</RNText>
        </DropdownMenuTrigger>
        <DropdownMenuItem value="new">
          <RNText>New</RNText>
        </DropdownMenuItem>
        <DropdownMenuSub value="recent">
          <DropdownMenuSubTrigger accessibilityLabel="Recent submenu">
            <RNText>Recent</RNText>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent testID="recent-panel">
            <DropdownMenuItem value="doc">
              <RNText>Document</RNText>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </MenubarMenu>
      <MenubarMenu value="edit" testID="edit-menu">
        <DropdownMenuTrigger accessibilityLabel="Edit trigger">
          <RNText>Edit</RNText>
        </DropdownMenuTrigger>
        <DropdownMenuItem value="undo">
          <RNText>Undo</RNText>
        </DropdownMenuItem>
      </MenubarMenu>
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
          <MenubarMenu value="file" testID="file-menu">
            <DropdownMenuTrigger accessibilityLabel="File trigger">
              <RNText>File</RNText>
            </DropdownMenuTrigger>
            <DropdownMenuItem value="new">
              <RNText>New</RNText>
            </DropdownMenuItem>
          </MenubarMenu>
          <MenubarMenu value="edit" testID="edit-menu">
            <DropdownMenuTrigger accessibilityLabel="Edit trigger">
              <RNText>Edit</RNText>
            </DropdownMenuTrigger>
            <DropdownMenuItem value="undo">
              <RNText>Undo</RNText>
            </DropdownMenuItem>
          </MenubarMenu>
        </Menubar>
      </PortalHost>,
    );
    expect(screen.queryByTestId("file-menu")).toBeNull();
    expect(screen.getByTestId("edit-menu")).toBeTruthy();
  });

  it("renders nothing for menus outside a bar", async () => {
    await render(
      <PortalHost>
        <MenubarMenu value="orphan" testID="orphan">
          <DropdownMenuTrigger accessibilityLabel="Orphan trigger">
            <RNText>Orphan</RNText>
          </DropdownMenuTrigger>
          <DropdownMenuItem value="x">
            <RNText>X</RNText>
          </DropdownMenuItem>
        </MenubarMenu>
      </PortalHost>,
    );
    expect(screen.queryByLabelText("Orphan trigger")).toBeNull();
    expect(screen.queryByTestId("orphan")).toBeNull();
  });

  it("forwards a ref to the bar container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <Menubar ref={ref}>
          <MenubarMenu value="file">
            <DropdownMenuTrigger accessibilityLabel="File trigger">
              <RNText>File</RNText>
            </DropdownMenuTrigger>
            <DropdownMenuItem value="new">
              <RNText>New</RNText>
            </DropdownMenuItem>
          </MenubarMenu>
        </Menubar>
      </PortalHost>,
    );
    expect(ref.current).toBeTruthy();
  });
});
