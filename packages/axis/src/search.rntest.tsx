import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Search } from "./index";

/**
 * Search through the public entry: composed entry with
 * clear/submit — observed in the RN runtime.
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
