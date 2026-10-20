import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  Autocomplete,
  CheckboxGroup,
  CheckboxRoot,
  CollapsiblePanel,
  CollapsibleRoot,
  CollapsibleTrigger,
  Combobox,
  ContextMenuRoot,
  ContextMenuTrigger,
  DrawerBackdrop,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Menubar,
  MenuRoot,
  MenuTrigger,
  NavigationMenuItem,
  NavigationMenuPanel,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  PortalHost,
  RadioGroup,
  RadioRoot,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  TableCell,
  TableHeader,
  TableRoot,
  TableRow,
  TabsList,
  TabsPanel,
  TabsRoot,
  TabsTrigger,
  ToastRoot,
  Toggle,
  ToggleGroup,
  TooltipRoot,
  TooltipTrigger,
} from "./index";

/**
 * Render composition parity for disclosure, selection, list, overlay,
 * and structural families through the public entry. Each test
 * observes a real substitution — element form preserves the part's
 * behavior wiring, function form observes the part's state.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("render composition: groups", () => {
  it("joined CheckboxRoot element render preserves toggle", async () => {
    const seen: string[][] = [];
    await render(
      <CheckboxGroup onValueChange={(v) => seen.push([...v])}>
        <CheckboxRoot
          value="a"
          aria-label="A"
          render={<Pressable testID="sub" />}
        />
      </CheckboxGroup>,
    );
    await press("sub");
    expect(seen).toEqual([["a"]]);
  });

  it("CheckboxGroup function style resolves against selection", async () => {
    await render(
      <CheckboxGroup
        testID="g"
        defaultValue={["a"]}
        style={(s) => ({ opacity: s.value.includes("a") ? 1 : 0 })}
      >
        <CheckboxRoot value="a" aria-label="A" />
      </CheckboxGroup>,
    );
    expect(screen.getByTestId("g").props.style).toMatchObject({ opacity: 1 });
  });

  it("RadioRoot function render observes checked state", async () => {
    await render(
      <RadioGroup defaultValue="a">
        <RadioRoot
          value="a"
          aria-label="A"
          render={(_props, state) => (
            <Text testID="st">{state.checked ? "yes" : "no"}</Text>
          )}
        />
      </RadioGroup>,
    );
    expect(screen.getByText("yes")).toBeTruthy();
  });

  it("Toggle element render preserves group toggle", async () => {
    const seen: string[][] = [];
    await render(
      <ToggleGroup onValueChange={(v) => seen.push([...v])}>
        <Toggle value="a" aria-label="A" render={<Pressable testID="sub" />} />
      </ToggleGroup>,
    );
    await press("sub");
    expect(seen).toEqual([["a"]]);
  });
});

describe("render composition: disclosure", () => {
  it("AccordionTrigger function render observes open state", async () => {
    await render(
      <AccordionRoot defaultValue={["a"]}>
        <AccordionItem value="a">
          <AccordionHeader>
            <AccordionTrigger
              render={(_props, state) => (
                <Text testID="st">{state.open ? "open" : "shut"}</Text>
              )}
            >
              <Text>Header</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <Text>Panel</Text>
          </AccordionPanel>
        </AccordionItem>
      </AccordionRoot>,
    );
    expect(screen.getByText("open")).toBeTruthy();
  });

  it("CollapsibleTrigger element render preserves toggle", async () => {
    const seen: boolean[] = [];
    await render(
      <CollapsibleRoot onOpenChange={(v) => seen.push(v)}>
        <CollapsibleTrigger
          aria-label="More"
          render={<Pressable testID="sub" />}
        >
          <Text>More</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <Text>Details</Text>
        </CollapsiblePanel>
      </CollapsibleRoot>,
    );
    await press("sub");
    expect(seen).toEqual([true]);
    expect(screen.getByText("Details")).toBeTruthy();
  });

  it("TabsTrigger function render observes selected state", async () => {
    await render(
      <TabsRoot defaultValue="a">
        <TabsList>
          <TabsTrigger
            value="a"
            aria-label="A"
            render={(_props, state) => (
              <Text testID="st">{state.selected ? "on" : "off"}</Text>
            )}
          />
        </TabsList>
        <TabsPanel value="a">
          <Text>Panel A</Text>
        </TabsPanel>
      </TabsRoot>,
    );
    expect(screen.getByText("on")).toBeTruthy();
    expect(screen.getByText("Panel A")).toBeTruthy();
  });
});

describe("render composition: lists", () => {
  it("SelectItem element render preserves choose-and-close", async () => {
    const seen: Array<string | string[]> = [];
    await render(
      <PortalHost>
        <SelectRoot defaultOpen onValueChange={(v) => seen.push(v)}>
          <SelectItem
            value="a"
            aria-label="A"
            render={<Pressable testID="sub" />}
          >
            <Text>Alpha</Text>
          </SelectItem>
        </SelectRoot>
      </PortalHost>,
    );
    await press("sub");
    expect(seen).toEqual(["a"]);
  });

  it("SelectTrigger function render observes open state", async () => {
    await render(
      <SelectRoot defaultValue="a">
        <SelectTrigger
          render={(_props, state) => (
            <Text testID="st">{state.open ? "open" : "closed"}</Text>
          )}
        />
      </SelectRoot>,
    );
    expect(screen.getByText("closed")).toBeTruthy();
  });

  it("Autocomplete function render observes text state", async () => {
    await render(
      <Autocomplete
        options={["apple", "pear"]}
        defaultValue="app"
        render={(_props, state) => <Text testID="st">{state.value}</Text>}
      />,
    );
    expect(screen.getByText("app")).toBeTruthy();
  });

  it("Combobox function render observes selection state", async () => {
    await render(
      <Combobox
        options={[{ value: "a", label: "Alpha" }]}
        defaultValue="a"
        render={(_props, state) => (
          <Text testID="st">{String(state.value)}</Text>
        )}
      />,
    );
    expect(screen.getByText("a")).toBeTruthy();
  });
});

describe("render composition: overlays", () => {
  it("AlertDialog surface render substitutes the popup", async () => {
    await render(
      <PortalHost>
        <AlertDialogRoot defaultOpen>
          <AlertDialogPortal>
            <AlertDialogBackdrop testID="ad-scrim" />
            <AlertDialogPopup
              testID="ad"
              aria-label="Sure?"
              render={<View testID="sub">{null}</View>}
            >
              <AlertDialogTitle>Sure?</AlertDialogTitle>
              <Text>Body</Text>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialogRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
    expect(screen.queryByText("Body")).toBeNull();
  });

  it("ContextMenuTrigger function render observes open state", async () => {
    await render(
      <ContextMenuRoot defaultOpen>
        <ContextMenuTrigger
          render={(_props, state) => (
            <Text testID="st">{state.open ? "open" : "shut"}</Text>
          )}
        >
          <Text>Anchor</Text>
        </ContextMenuTrigger>
      </ContextMenuRoot>,
    );
    expect(screen.getByText("open")).toBeTruthy();
  });

  it("Drawer surface render substitutes the surface", async () => {
    await render(
      <PortalHost>
        <DrawerRoot defaultOpen>
          <DrawerPortal testID="dr-portal">
            <DrawerBackdrop testID="dr-scrim" />
            <DrawerPopup testID="dr" render={<View testID="sub">{null}</View>}>
              <Text>Nav</Text>
            </DrawerPopup>
          </DrawerPortal>
        </DrawerRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
    expect(screen.queryByText("Nav")).toBeNull();
  });

  it("Drawer bottom-sheet surface render substitutes the surface", async () => {
    await render(
      <PortalHost>
        <DrawerRoot defaultOpen side="bottom">
          <DrawerPortal testID="sh-portal">
            <DrawerBackdrop testID="sh-scrim" />
            <DrawerPopup testID="sh" render={<View testID="sub">{null}</View>}>
              <Text>Content</Text>
            </DrawerPopup>
          </DrawerPortal>
        </DrawerRoot>
      </PortalHost>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("TooltipTrigger function render observes visibility", async () => {
    await render(
      <TooltipRoot defaultOpen>
        <TooltipTrigger
          render={(_props, state) => (
            <Text testID="st">{state.open ? "shown" : "hidden"}</Text>
          )}
        >
          <Text>Anchor</Text>
        </TooltipTrigger>
      </TooltipRoot>,
    );
    expect(screen.getByText("shown")).toBeTruthy();
  });

  it("ToastRoot function render observes open state", async () => {
    await render(
      <ToastRoot
        defaultOpen
        render={(_props, state) => (
          <Text testID="st">{state.open ? "up" : "down"}</Text>
        )}
      >
        Saved
      </ToastRoot>,
    );
    expect(screen.getByText("up")).toBeTruthy();
  });

  it("DropdownMenuTrigger element render preserves toggle", async () => {
    const seen: boolean[] = [];
    await render(
      <PortalHost>
        <DropdownMenuRoot onOpenChange={(v) => seen.push(v)}>
          <DropdownMenuTrigger
            aria-label="Open"
            render={<Pressable testID="sub" />}
          >
            <Text>Open</Text>
          </DropdownMenuTrigger>
          <DropdownMenuItem value="a" aria-label="A">
            <Text>Alpha</Text>
          </DropdownMenuItem>
        </DropdownMenuRoot>
      </PortalHost>,
    );
    await press("sub");
    expect(seen).toEqual([true]);
    expect(screen.getByText("Alpha")).toBeTruthy();
  });

  it("DropdownMenuSub panels still open after composition", async () => {
    await render(
      <PortalHost>
        <DropdownMenuRoot defaultOpen>
          <DropdownMenuTrigger aria-label="Open">
            <Text>Open</Text>
          </DropdownMenuTrigger>
          <DropdownMenuSub value="more">
            <DropdownMenuSubTrigger
              aria-label="More"
              render={(props, state) => (
                <Pressable
                  testID="subtrig"
                  onPress={(props as { onPress?: () => void }).onPress}
                >
                  <Text>{state.open ? "open" : "shut"}</Text>
                </Pressable>
              )}
            >
              <Text>More</Text>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent testID="subpanel">
              <DropdownMenuItem value="a" aria-label="A">
                <Text>Alpha</Text>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuRoot>
      </PortalHost>,
    );
    expect(screen.getByText("shut")).toBeTruthy();
    await press("subtrig");
    expect(screen.getByTestId("subpanel")).toBeTruthy();
  });
});

describe("render composition: bars and structure", () => {
  it("Menubar function render observes the open value", async () => {
    await render(
      <Menubar
        defaultOpenValue="file"
        render={(_props, state) => (
          <Text testID="st">{String(state.openValue)}</Text>
        )}
      >
        <MenuRoot value="file">
          <MenuTrigger aria-label="File">
            <Text>File</Text>
          </MenuTrigger>
        </MenuRoot>
      </Menubar>,
    );
    expect(screen.getByText("file")).toBeTruthy();
  });

  it("NavigationMenuTrigger element render preserves open", async () => {
    const seen: (string | null)[] = [];
    await render(
      <NavigationMenuRoot onOpenValueChange={(v) => seen.push(v)}>
        <NavigationMenuItem value="docs">
          <NavigationMenuTrigger
            aria-label="Docs"
            render={<Pressable testID="sub" />}
          >
            <Text>Docs</Text>
          </NavigationMenuTrigger>
          <NavigationMenuPanel testID="panel">
            <Text>Panel</Text>
          </NavigationMenuPanel>
        </NavigationMenuItem>
      </NavigationMenuRoot>,
    );
    await press("sub");
    expect(seen).toEqual(["docs"]);
    expect(screen.getByTestId("panel")).toBeTruthy();
  });

  it("TableRoot parts accept element substitution", async () => {
    await render(
      <TableRoot render={<View testID="sub-table" />}>
        <TableHeader render={<View testID="sub-head" />}>
          <TableRow header render={<View testID="sub-row" />}>
            <TableCell render={<View testID="sub-cell" />}>
              <Text>Hi</Text>
            </TableCell>
          </TableRow>
        </TableHeader>
      </TableRoot>,
    );
    expect(screen.getByTestId("sub-table")).toBeTruthy();
  });
});
