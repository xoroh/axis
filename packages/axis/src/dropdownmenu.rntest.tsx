import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text as RNText, type View } from "react-native";
import {
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  PortalHost,
} from "./index";

/**
 * DropdownMenuRoot behavior through the public entry. Root open/close,
 * leaf selection closing the whole cascade, submenu opening with
 * sibling replacement, scrim dismissal clearing the path, disabled
 * terminality, inert parts outside a menu, and ref forwarding —
 * observed in the RN runtime.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

function Tree({ onSelect }: { onSelect?: (value: string) => void }) {
  return (
    <DropdownMenuRoot testID="dd" defaultOpen={false}>
      <DropdownMenuTrigger aria-label="Open menu">
        <RNText>Open</RNText>
      </DropdownMenuTrigger>
      <DropdownMenuItem value="new" onSelect={onSelect}>
        <RNText>New</RNText>
      </DropdownMenuItem>
      <DropdownMenuSub value="share">
        <DropdownMenuSubTrigger aria-label="Share submenu">
          <RNText>Share</RNText>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent testID="share-panel">
          <DropdownMenuItem value="email" onSelect={onSelect}>
            <RNText>Email</RNText>
          </DropdownMenuItem>
          <DropdownMenuSub value="more">
            <DropdownMenuSubTrigger aria-label="More submenu">
              <RNText>More</RNText>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent testID="more-panel">
              <DropdownMenuItem value="sms" onSelect={onSelect}>
                <RNText>SMS</RNText>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuRoot>
  );
}

describe("DropdownMenuRoot on React Native", () => {
  it("renders the trigger only while closed", async () => {
    await render(
      <PortalHost>
        <Tree />
      </PortalHost>,
    );
    expect(screen.getByLabelText("Open menu")).toBeTruthy();
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("opens the content box with items and sub triggers", async () => {
    await render(
      <PortalHost>
        <Tree />
      </PortalHost>,
    );
    await pressLabel("Open menu");
    expect(screen.getByTestId("dd")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.getByLabelText("Share submenu")).toBeTruthy();
    expect(screen.queryByTestId("share-panel")).toBeNull();
  });

  it("selects a leaf, reports, and closes everything", async () => {
    const seen: string[] = [];
    await render(
      <PortalHost>
        <Tree onSelect={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await pressLabel("Open menu");
    await act(async () => {
      fireEvent.press(screen.getByText("New"));
    });
    expect(seen).toEqual(["new"]);
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("opens a submenu panel on trigger press", async () => {
    await render(
      <PortalHost>
        <Tree />
      </PortalHost>,
    );
    await pressLabel("Open menu");
    await pressLabel("Share submenu");
    expect(screen.getByTestId("share-panel")).toBeTruthy();
    expect(screen.getByText("Email")).toBeTruthy();
    expect(
      screen.getByLabelText("Share submenu").props.accessibilityState,
    ).toMatchObject({ expanded: true });
  });

  it("cascades to a second level and selects through it", async () => {
    const seen: string[] = [];
    await render(
      <PortalHost>
        <Tree onSelect={(v) => seen.push(v)} />
      </PortalHost>,
    );
    await pressLabel("Open menu");
    await pressLabel("Share submenu");
    await pressLabel("More submenu");
    expect(screen.getByTestId("more-panel")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText("SMS"));
    });
    expect(seen).toEqual(["sms"]);
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("dismisses the whole cascade through the scrim", async () => {
    const order: string[] = [];
    await render(
      <PortalHost>
        <DropdownMenuRoot
          testID="dd2"
          defaultOpen
          onDismiss={() => order.push("dismiss")}
          onOpenChange={() => order.push("change")}
        >
          <DropdownMenuTrigger aria-label="Open">
            <RNText>Open</RNText>
          </DropdownMenuTrigger>
          <DropdownMenuItem value="x">
            <RNText>X</RNText>
          </DropdownMenuItem>
        </DropdownMenuRoot>
      </PortalHost>,
    );
    await pressLabel("Dismiss menu");
    expect(order).toEqual(["dismiss", "change"]);
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("keeps disabled sub triggers closed", async () => {
    await render(
      <PortalHost>
        <DropdownMenuRoot defaultOpen>
          <DropdownMenuTrigger aria-label="Open">
            <RNText>Open</RNText>
          </DropdownMenuTrigger>
          <DropdownMenuSub value="share">
            <DropdownMenuSubTrigger aria-label="Share" disabled>
              <RNText>Share</RNText>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent testID="share-panel">
              <DropdownMenuItem value="email">
                <RNText>Email</RNText>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuRoot>
      </PortalHost>,
    );
    await pressLabel("Share");
    expect(screen.queryByTestId("share-panel")).toBeNull();
  });

  it("renders items inert outside a menu", async () => {
    await render(
      <PortalHost>
        <DropdownMenuItem value="orphan" testID="orphan">
          <RNText>Orphan</RNText>
        </DropdownMenuItem>
      </PortalHost>,
    );
    expect(screen.getByTestId("orphan").props.accessibilityState).toMatchObject(
      { disabled: true },
    );
  });

  it("follows controlled open state", async () => {
    await render(
      <PortalHost>
        <DropdownMenuRoot testID="dd" open={false}>
          <DropdownMenuTrigger aria-label="Open">
            <RNText>Open</RNText>
          </DropdownMenuTrigger>
          <DropdownMenuItem value="x">
            <RNText>X</RNText>
          </DropdownMenuItem>
        </DropdownMenuRoot>
      </PortalHost>,
    );
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("forwards a ref to the container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <DropdownMenuRoot ref={ref}>
          <DropdownMenuTrigger aria-label="Open">
            <RNText>Open</RNText>
          </DropdownMenuTrigger>
        </DropdownMenuRoot>
      </PortalHost>,
    );
    expect(ref.current).toBeTruthy();
  });
});
