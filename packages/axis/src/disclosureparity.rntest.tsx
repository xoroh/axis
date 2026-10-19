import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
  AlertDialog,
  Autocomplete,
  CheckboxGroup,
  CheckboxGroupItem,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Combobox,
  ContextMenu,
  Drawer,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Menubar,
  MenubarMenu,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuPanel,
  NavigationMenuTrigger,
  PortalHost,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectItem,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Toast,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
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
  it("CheckboxGroupItem element render preserves toggle", async () => {
    const seen: string[][] = [];
    await render(
      <CheckboxGroup onValueChange={(v) => seen.push([...v])}>
        <CheckboxGroupItem
          value="a"
          accessibilityLabel="A"
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
        <CheckboxGroupItem value="a" accessibilityLabel="A" />
      </CheckboxGroup>,
    );
    expect(screen.getByTestId("g").props.style).toMatchObject({ opacity: 1 });
  });

  it("RadioGroupItem function render observes checked state", async () => {
    await render(
      <RadioGroup defaultValue="a">
        <RadioGroupItem
          value="a"
          accessibilityLabel="A"
          render={(_props, state) => (
            <Text testID="st">{state.checked ? "yes" : "no"}</Text>
          )}
        />
      </RadioGroup>,
    );
    expect(screen.getByText("yes")).toBeTruthy();
  });

  it("ToggleGroupItem element render preserves toggle", async () => {
    const seen: string[][] = [];
    await render(
      <ToggleGroup onValueChange={(v) => seen.push([...v])}>
        <ToggleGroupItem
          value="a"
          accessibilityLabel="A"
          render={<Pressable testID="sub" />}
        />
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
      <Collapsible onOpenChange={(v) => seen.push(v)}>
        <CollapsibleTrigger
          accessibilityLabel="More"
          render={<Pressable testID="sub" />}
        >
          <Text>More</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <Text>Details</Text>
        </CollapsiblePanel>
      </Collapsible>,
    );
    await press("sub");
    expect(seen).toEqual([true]);
    expect(screen.getByText("Details")).toBeTruthy();
  });

  it("TabsTrigger function render observes selected state", async () => {
    await render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger
            value="a"
            accessibilityLabel="A"
            render={(_props, state) => (
              <Text testID="st">{state.selected ? "on" : "off"}</Text>
            )}
          />
        </TabsList>
        <TabsPanel value="a">
          <Text>Panel A</Text>
        </TabsPanel>
      </Tabs>,
    );
    expect(screen.getByText("on")).toBeTruthy();
    expect(screen.getByText("Panel A")).toBeTruthy();
  });
});

describe("render composition: lists", () => {
  it("SelectItem element render preserves choose-and-close", async () => {
    const seen: string[] = [];
    await render(
      <PortalHost>
        <Select
          testID="sel"
          defaultOpen
          placeholder={<Text>Pick</Text>}
          onValueChange={(v) => seen.push(v)}
        >
          <SelectItem
            value="a"
            accessibilityLabel="A"
            render={<Pressable testID="sub" />}
          >
            <Text>Alpha</Text>
          </SelectItem>
        </Select>
      </PortalHost>,
    );
    await press("sub");
    expect(seen).toEqual(["a"]);
  });

  it("Select function render observes value and open state", async () => {
    await render(
      <Select
        defaultValue="a"
        placeholder={<Text>Pick</Text>}
        render={(_props, state) => (
          <Text testID="st">{`${String(state.value)}${state.open ? "+" : "-"}`}</Text>
        )}
      >
        <SelectItem value="a" accessibilityLabel="A">
          <Text>Alpha</Text>
        </SelectItem>
      </Select>,
    );
    expect(screen.getByText("a-")).toBeTruthy();
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
        <AlertDialog
          testID="ad"
          defaultOpen
          title="Sure?"
          actions={<Text>OK</Text>}
          render={<View testID="sub">{null}</View>}
        >
          <Text>Body</Text>
        </AlertDialog>
      </PortalHost>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
    expect(screen.queryByText("Body")).toBeNull();
  });

  it("ContextMenu function render observes open state", async () => {
    await render(
      <ContextMenu
        defaultOpen
        content={<Text>Menu</Text>}
        render={(_props, state) => (
          <Text testID="st">{state.open ? "open" : "shut"}</Text>
        )}
      >
        <Text>Anchor</Text>
      </ContextMenu>,
    );
    expect(screen.getByText("open")).toBeTruthy();
  });

  it("Drawer surface render substitutes the surface", async () => {
    await render(
      <PortalHost>
        <Drawer
          testID="dr"
          defaultOpen
          render={<View testID="sub">{null}</View>}
        >
          <Text>Nav</Text>
        </Drawer>
      </PortalHost>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
    expect(screen.queryByText("Nav")).toBeNull();
  });

  it("Drawer bottom-sheet surface render substitutes the surface", async () => {
    await render(
      <PortalHost>
        <Drawer
          testID="sh"
          defaultOpen
          side="bottom"
          render={<View testID="sub">{null}</View>}
        >
          <Text>Content</Text>
        </Drawer>
      </PortalHost>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("Tooltip function render observes visibility", async () => {
    await render(
      <Tooltip
        content={<Text>Hint</Text>}
        defaultOpen
        render={(_props, state) => (
          <Text testID="st">{state.open ? "shown" : "hidden"}</Text>
        )}
      >
        <Text>Anchor</Text>
      </Tooltip>,
    );
    expect(screen.getByText("shown")).toBeTruthy();
  });

  it("Toast function render observes open state", async () => {
    await render(
      <Toast
        defaultOpen
        render={(_props, state) => (
          <Text testID="st">{state.open ? "up" : "down"}</Text>
        )}
      >
        Saved
      </Toast>,
    );
    expect(screen.getByText("up")).toBeTruthy();
  });

  it("DropdownMenuTrigger element render preserves toggle", async () => {
    const seen: boolean[] = [];
    await render(
      <PortalHost>
        <DropdownMenu onOpenChange={(v) => seen.push(v)}>
          <DropdownMenuTrigger
            accessibilityLabel="Open"
            render={<Pressable testID="sub" />}
          >
            <Text>Open</Text>
          </DropdownMenuTrigger>
          <DropdownMenuItem value="a" accessibilityLabel="A">
            <Text>Alpha</Text>
          </DropdownMenuItem>
        </DropdownMenu>
      </PortalHost>,
    );
    await press("sub");
    expect(seen).toEqual([true]);
    expect(screen.getByText("Alpha")).toBeTruthy();
  });

  it("DropdownMenuSub panels still open after composition", async () => {
    await render(
      <PortalHost>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger accessibilityLabel="Open">
            <Text>Open</Text>
          </DropdownMenuTrigger>
          <DropdownMenuSub value="more">
            <DropdownMenuSubTrigger
              accessibilityLabel="More"
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
              <DropdownMenuItem value="a" accessibilityLabel="A">
                <Text>Alpha</Text>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenu>
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
        <MenubarMenu value="file">
          <DropdownMenuTrigger accessibilityLabel="File">
            <Text>File</Text>
          </DropdownMenuTrigger>
        </MenubarMenu>
      </Menubar>,
    );
    expect(screen.getByText("file")).toBeTruthy();
  });

  it("NavigationMenuTrigger element render preserves open", async () => {
    const seen: (string | null)[] = [];
    await render(
      <NavigationMenu onOpenValueChange={(v) => seen.push(v)}>
        <NavigationMenuItem value="docs">
          <NavigationMenuTrigger
            accessibilityLabel="Docs"
            render={<Pressable testID="sub" />}
          >
            <Text>Docs</Text>
          </NavigationMenuTrigger>
          <NavigationMenuPanel testID="panel">
            <Text>Panel</Text>
          </NavigationMenuPanel>
        </NavigationMenuItem>
      </NavigationMenu>,
    );
    await press("sub");
    expect(seen).toEqual(["docs"]);
    expect(screen.getByTestId("panel")).toBeTruthy();
  });

  it("Table parts accept element substitution", async () => {
    await render(
      <Table render={<View testID="sub-table" />}>
        <TableHeader render={<View testID="sub-head" />}>
          <TableRow header render={<View testID="sub-row" />}>
            <TableCell render={<View testID="sub-cell" />}>
              <Text>Hi</Text>
            </TableCell>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    expect(screen.getByTestId("sub-table")).toBeTruthy();
  });
});
