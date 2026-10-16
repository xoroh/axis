import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import type { View } from "react-native";
import { Text } from "react-native";
import { Pagination, Search } from "./index";

/**
 * Search + Pagination through the public entry: composed entry with
 * clear/submit, bounded page transitions — observed in the RN runtime.
 */

describe("Search on React Native", () => {
  it("renders entry with placeholder and no clear button when empty", async () => {
    await render(<Search testID="s" placeholder="Search" />);
    expect(screen.getByPlaceholderText("Search")).toBeTruthy();
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });

  it("typing reports and reveals clear; clear resets", async () => {
    const seen: string[] = [];
    await render(
      <Search
        testID="s"
        placeholder="Search"
        defaultValue=""
        onValueChange={(v) => seen.push(v)}
      />,
    );
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText("Search"), "Ada");
    });
    expect(seen).toEqual(["Ada"]);
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Clear search"));
    });
    expect(seen).toEqual(["Ada", ""]);
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });

  it("submit fires with the current query", async () => {
    const submitted: string[] = [];
    await render(
      <Search
        testID="s"
        placeholder="Search"
        defaultValue="Ada"
        onSubmit={(v) => submitted.push(v)}
      />,
    );
    await act(async () => {
      fireEvent(screen.getByPlaceholderText("Search"), "submitEditing");
    });
    expect(submitted).toEqual(["Ada"]);
  });

  it("controlled value wins", async () => {
    await render(<Search testID="s" value="fixed" placeholder="Search" />);
    expect(screen.getByDisplayValue("fixed")).toBeTruthy();
  });
});

describe("Pagination on React Native", () => {
  it("navigates within bounds and reports", async () => {
    const seen: number[] = [];
    await render(
      <Pagination
        testID="pg"
        defaultPage={1}
        pageCount={3}
        onPageChange={(p) => seen.push(p)}
      >
        <Text>1 of 3</Text>
      </Pagination>,
    );
    expect(
      screen.getByLabelText("Previous page").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Next page"));
    });
    expect(seen).toEqual([2]);
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Next page"));
    });
    expect(seen).toEqual([2, 3]);
    expect(
      screen.getByLabelText("Next page").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Previous page"));
    });
    expect(seen).toEqual([2, 3, 2]);
  });

  it("degenerate pageCount collapses to one page", async () => {
    await render(
      <Pagination testID="pg" defaultPage={5} pageCount={0}>
        <Text>1 of 3</Text>
      </Pagination>,
    );
    expect(
      screen.getByLabelText("Previous page").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByLabelText("Next page").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("disabled blocks navigation", async () => {
    const seen: number[] = [];
    await render(
      <Pagination
        testID="pg"
        defaultPage={1}
        pageCount={5}
        disabled
        onPageChange={(p) => seen.push(p)}
      >
        <Text>1 of 3</Text>
      </Pagination>,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Next page"));
    });
    expect(seen).toEqual([]);
  });

  it("forwards a ref to the container", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Pagination testID="pg" ref={ref}>
        <Text>1 of 3</Text>
      </Pagination>,
    );
    expect(ref.current).not.toBeNull();
  });
});
