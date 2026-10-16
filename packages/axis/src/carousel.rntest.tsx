import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text, type View } from "react-native";
import { Carousel } from "./index";

/**
 * Carousel through the public entry. Every assertion renders the real
 * component in the RN runtime and interacts through RN events —
 * single-page mounting, bounded prev/next navigation, loop wrapping,
 * controlled following, bound clamping, and ref forwarding are
 * observed, not assumed.
 *
 * Pages are three sibling elements (not a fragment wrapper — a wrapper
 * would be a single opaque child and a single page). No swipe is
 * exercised: gesture paging is deferred (see `Carousel.tsx`), so
 * navigation goes through the Previous/Next controls found by their
 * accessible labels.
 */

async function press(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("Carousel on React Native", () => {
  it("mounts only the first page", async () => {
    await render(
      <Carousel testID="car">
        <Text>Page 1</Text>
        <Text>Page 2</Text>
        <Text>Page 3</Text>
      </Carousel>,
    );
    expect(screen.getByText("Page 1")).toBeTruthy();
    expect(screen.queryByText("Page 2")).toBeNull();
    expect(screen.queryByText("Page 3")).toBeNull();
    expect(screen.getByLabelText("Previous").props.accessibilityRole).toBe(
      "button",
    );
    expect(screen.getByLabelText("Next").props.accessibilityRole).toBe(
      "button",
    );
    expect(
      screen.getByLabelText("Previous").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("next/prev navigate and report each commit", async () => {
    const seen: number[] = [];
    await render(
      <Carousel testID="car" onIndexChange={(i) => seen.push(i)}>
        <Text>Page 1</Text>
        <Text>Page 2</Text>
        <Text>Page 3</Text>
      </Carousel>,
    );
    await press("Next");
    expect(seen).toEqual([1]);
    expect(screen.getByText("Page 2")).toBeTruthy();
    expect(screen.queryByText("Page 1")).toBeNull();
    await press("Next");
    expect(seen).toEqual([1, 2]);
    expect(screen.getByText("Page 3")).toBeTruthy();
    await press("Previous");
    expect(seen).toEqual([1, 2, 1]);
    expect(screen.getByText("Page 2")).toBeTruthy();
    expect(screen.queryByText("Page 3")).toBeNull();
  });

  it("loop wraps at both ends", async () => {
    const seen: number[] = [];
    await render(
      <Carousel
        testID="car"
        defaultIndex={2}
        loop
        onIndexChange={(i) => seen.push(i)}
      >
        <Text>Page 1</Text>
        <Text>Page 2</Text>
        <Text>Page 3</Text>
      </Carousel>,
    );
    expect(screen.getByText("Page 3")).toBeTruthy();
    await press("Next");
    expect(seen).toEqual([0]);
    expect(screen.getByText("Page 1")).toBeTruthy();
    await press("Previous");
    expect(seen).toEqual([0, 2]);
    expect(screen.getByText("Page 3")).toBeTruthy();
  });

  it("follows the controlled index prop", async () => {
    function Host() {
      const [index, setIndex] = useState(0);
      return (
        <Carousel testID="car" index={index} onIndexChange={setIndex}>
          <Text>Page 1</Text>
          <Text>Page 2</Text>
          <Text>Page 3</Text>
        </Carousel>
      );
    }
    await render(<Host />);
    expect(screen.getByText("Page 1")).toBeTruthy();
    await press("Next");
    expect(screen.getByText("Page 2")).toBeTruthy();
    expect(screen.queryByText("Page 1")).toBeNull();
    await press("Previous");
    expect(screen.getByText("Page 1")).toBeTruthy();
  });

  it("clamps bounds without loop: no wrap, no callback, out-of-range defaults settle", async () => {
    const seen: number[] = [];
    await render(
      <Carousel
        testID="car"
        defaultIndex={99}
        onIndexChange={(i) => seen.push(i)}
      >
        <Text>Page 1</Text>
        <Text>Page 2</Text>
        <Text>Page 3</Text>
      </Carousel>,
    );
    expect(screen.getByText("Page 3")).toBeTruthy();
    expect(
      screen.getByLabelText("Next").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await press("Next");
    expect(seen).toEqual([]);
    expect(screen.getByText("Page 3")).toBeTruthy();
  });

  it("forwards a ref to the carousel root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Carousel testID="car" ref={ref}>
        <Text>Page 1</Text>
        <Text>Page 2</Text>
        <Text>Page 3</Text>
      </Carousel>,
    );
    expect(ref.current).not.toBeNull();
  });
});
