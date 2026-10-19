import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Text } from "react-native";
import {
  Menu,
  MenuBackdrop,
  MenuCheckboxItem,
  MenuClear,
  MenuEmpty,
  MenuInput,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRoot,
  MenuTrigger,
} from "./index";

/**
 * Menu filter parts through the public entry. Every assertion
 * renders the real parts in the RN runtime and interacts through
 * RN events — query narrowing across plain, checkbox, and radio
 * items, textless items staying visible, empty-state agreement
 * with item visibility, clear behavior and disabled state,
 * controlled queries, and compound-only presence (nothing renders
 * in the monolith or outside a root) are observed, not assumed.
 */

async function changeFilter(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId("menu-filter"), text);
  });
}

async function pressTestId(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

function FilterMenu(props: {
  filterValue?: string;
  defaultFilterValue?: string;
  onFilterChange?: (query: string) => void;
}) {
  return (
    <MenuRoot
      defaultOpen
      filterValue={props.filterValue}
      defaultFilterValue={props.defaultFilterValue}
      onFilterChange={props.onFilterChange}
    >
      <MenuTrigger accessibilityLabel="Open">
        <Text>Open</Text>
      </MenuTrigger>
      <MenuPortal>
        <MenuBackdrop />
        <MenuPositioner>
          <MenuPopup>
            <MenuInput
              testID="menu-filter"
              placeholder="Filter"
              accessibilityLabel="Filter items"
            />
            <MenuItem value="apple" filterText="Apple" testID="item-apple">
              <Text>Apple</Text>
            </MenuItem>
            <MenuItem
              value="apricot"
              filterText="Apricot"
              testID="item-apricot"
            >
              <Text>Apricot</Text>
            </MenuItem>
            <MenuItem value="banana" filterText="Banana" testID="item-banana">
              <Text>Banana</Text>
            </MenuItem>
            <MenuCheckboxItem filterText="Organic" testID="item-organic">
              <Text>Organic</Text>
            </MenuCheckboxItem>
            <MenuRadioGroup>
              <MenuRadioItem value="red" filterText="Red" testID="item-red">
                <Text>Red</Text>
              </MenuRadioItem>
            </MenuRadioGroup>
            <MenuItem value="plain" testID="item-plain">
              <Text>No filter text</Text>
            </MenuItem>
            <MenuEmpty testID="menu-empty">
              <Text>No matches</Text>
            </MenuEmpty>
            <MenuClear testID="menu-clear" accessibilityLabel="Clear filter">
              <Text>Clear</Text>
            </MenuClear>
          </MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </MenuRoot>
  );
}

describe("Menu filter parts on React Native", () => {
  it("shows everything unfiltered with no empty state", async () => {
    await render(<FilterMenu />);
    expect(screen.getByTestId("item-apple")).toBeTruthy();
    expect(screen.getByTestId("item-banana")).toBeTruthy();
    expect(screen.queryByTestId("menu-empty")).toBeNull();
  });

  it("narrows items by query, case-insensitively", async () => {
    const onFilterChange = jest.fn();
    await render(<FilterMenu onFilterChange={onFilterChange} />);
    await changeFilter("ap");
    expect(onFilterChange).toHaveBeenLastCalledWith("ap");
    expect(screen.getByTestId("item-apple")).toBeTruthy();
    expect(screen.getByTestId("item-apricot")).toBeTruthy();
    expect(screen.queryByTestId("item-banana")).toBeNull();
    expect(screen.queryByTestId("menu-empty")).toBeNull();
  });

  it("filters checkbox and radio items by their filter text", async () => {
    await render(<FilterMenu />);
    await changeFilter("red");
    expect(screen.getByTestId("item-red")).toBeTruthy();
    expect(screen.queryByTestId("item-apple")).toBeNull();
    expect(screen.queryByTestId("item-organic")).toBeNull();
  });

  it("keeps textless items visible under any query", async () => {
    await render(<FilterMenu />);
    await changeFilter("zzz-no-match");
    expect(screen.getByTestId("item-plain")).toBeTruthy();
  });

  it("shows the empty state only when nothing visible matches", async () => {
    await render(<FilterMenu />);
    await changeFilter("zzz-no-match");
    // The textless item stays visible, so no empty state.
    expect(screen.queryByTestId("menu-empty")).toBeNull();
    expect(screen.getByTestId("item-plain")).toBeTruthy();
  });

  it("shows the empty state when every item has text and none match", async () => {
    await render(
      <MenuRoot defaultOpen>
        <MenuTrigger accessibilityLabel="Open">
          <Text>Open</Text>
        </MenuTrigger>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuInput testID="solo-filter" />
              <MenuItem value="apple" filterText="Apple" testID="solo-apple">
                <Text>Apple</Text>
              </MenuItem>
              <MenuEmpty testID="solo-empty">
                <Text>No matches</Text>
              </MenuEmpty>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("solo-filter"), "zzz");
    });
    expect(screen.queryByTestId("solo-apple")).toBeNull();
    expect(screen.getByTestId("solo-empty")).toBeTruthy();
    expect(screen.getByText("No matches")).toBeTruthy();
  });

  it("clears the query through MenuClear, disabled when empty", async () => {
    await render(<FilterMenu />);
    expect(
      screen.getByTestId("menu-clear").props.accessibilityState.disabled,
    ).toBe(true);
    await changeFilter("ap");
    expect(screen.queryByTestId("item-banana")).toBeNull();
    expect(
      screen.getByTestId("menu-clear").props.accessibilityState.disabled,
    ).toBe(false);
    await pressTestId("menu-clear");
    expect(screen.getByTestId("item-banana")).toBeTruthy();
    expect(screen.queryByTestId("menu-empty")).toBeNull();
  });

  it("selecting a filtered item still reports and closes", async () => {
    const onOpenChange = jest.fn();
    await render(
      <MenuRoot defaultOpen onOpenChange={onOpenChange}>
        <MenuTrigger accessibilityLabel="Open">
          <Text>Open</Text>
        </MenuTrigger>
        <MenuPortal>
          <MenuPositioner>
            <MenuPopup>
              <MenuInput testID="pick-filter" />
              <MenuItem value="apple" filterText="Apple" testID="pick-apple">
                <Text>Apple</Text>
              </MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </MenuRoot>,
    );
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("pick-filter"), "app");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("pick-apple"));
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("follows a controlled filter query", async () => {
    const view = await render(<FilterMenu filterValue="ap" />);
    expect(screen.getByTestId("item-apple")).toBeTruthy();
    expect(screen.queryByTestId("item-banana")).toBeNull();
    await act(async () => {
      view.rerender(<FilterMenu filterValue="" />);
    });
    expect(screen.getByTestId("item-banana")).toBeTruthy();
  });

  it("renders filter parts nowhere outside a compound root", async () => {
    await render(
      <Menu defaultOpen testID="mono-menu">
        <MenuTrigger accessibilityLabel="Open">
          <Text>Open</Text>
        </MenuTrigger>
        <MenuInput testID="mono-filter" />
        <MenuEmpty testID="mono-empty">
          <Text>No matches</Text>
        </MenuEmpty>
        <MenuClear testID="mono-clear">
          <Text>Clear</Text>
        </MenuClear>
      </Menu>,
    );
    expect(screen.queryByTestId("mono-filter")).toBeNull();
    expect(screen.queryByTestId("mono-empty")).toBeNull();
    expect(screen.queryByTestId("mono-clear")).toBeNull();
  });
});
