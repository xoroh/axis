import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  isAtBottom,
  resolveScrollButtonVisible,
  useStickToBottom,
} from "./stickToBottom";

describe("isAtBottom", () => {
  it("pins when the remaining distance is within threshold", () => {
    expect(
      isAtBottom({
        contentHeight: 1000,
        viewportHeight: 400,
        scrollOffset: 590,
      }),
    ).toBe(true);
    expect(
      isAtBottom({
        contentHeight: 1000,
        viewportHeight: 400,
        scrollOffset: 500,
      }),
    ).toBe(false);
  });

  it("treats short content as pinned", () => {
    expect(
      isAtBottom({ contentHeight: 300, viewportHeight: 400, scrollOffset: 0 }),
    ).toBe(true);
  });

  it("honours a custom threshold", () => {
    const metrics = {
      contentHeight: 1000,
      viewportHeight: 400,
      scrollOffset: 550,
    };
    expect(isAtBottom(metrics, 24)).toBe(false);
    expect(isAtBottom(metrics, 60)).toBe(true);
  });
});

describe("resolveScrollButtonVisible", () => {
  it("shows only when unpinned with overflow", () => {
    expect(
      resolveScrollButtonVisible({
        stuck: false,
        contentHeight: 1000,
        viewportHeight: 400,
      }),
    ).toBe(true);
    expect(
      resolveScrollButtonVisible({
        stuck: true,
        contentHeight: 1000,
        viewportHeight: 400,
      }),
    ).toBe(false);
    expect(
      resolveScrollButtonVisible({
        stuck: false,
        contentHeight: 300,
        viewportHeight: 400,
      }),
    ).toBe(false);
  });
});

describe("useStickToBottom", () => {
  const tall = (scrollOffset: number) => ({
    contentHeight: 1000,
    viewportHeight: 400,
    scrollOffset,
  });

  it("starts pinned", () => {
    const { result } = renderHook(() => useStickToBottom());
    expect(result.current.stuck).toBe(true);
  });

  it("pauses on scroll-up and resumes at the bottom", () => {
    const onStuckChange = vi.fn();
    const { result } = renderHook(() => useStickToBottom({ onStuckChange }));
    act(() => result.current.handleScroll(tall(100)));
    expect(result.current.stuck).toBe(false);
    expect(onStuckChange).toHaveBeenLastCalledWith(false);
    act(() => result.current.handleScroll(tall(590)));
    expect(result.current.stuck).toBe(true);
    expect(onStuckChange).toHaveBeenLastCalledWith(true);
  });

  it("auto-scrolls on content growth only while stuck", () => {
    const { result } = renderHook(() => useStickToBottom());
    expect(result.current.handleContentChange(tall(590))).toBe(true);
    act(() => result.current.handleScroll(tall(100)));
    expect(result.current.handleContentChange(tall(100))).toBe(false);
  });

  it("unpins when growth removes the overflow without a scroll event", () => {
    const { result } = renderHook(() => useStickToBottom());
    act(() =>
      result.current.handleContentChange({
        contentHeight: 300,
        viewportHeight: 400,
        scrollOffset: 0,
      }),
    );
    expect(result.current.stuck).toBe(true);
    // Growth that leaves the viewport short of the bottom unpins.
    let scrolled = false;
    act(() => {
      scrolled = result.current.handleContentChange(tall(100));
    });
    expect(scrolled).toBe(false);
    expect(result.current.stuck).toBe(false);
  });

  it("scrollToBottom re-pins for the button press", () => {
    const { result } = renderHook(() => useStickToBottom());
    act(() => result.current.handleScroll(tall(100)));
    expect(result.current.stuck).toBe(false);
    act(() => result.current.scrollToBottom());
    expect(result.current.stuck).toBe(true);
  });

  it("reports button visibility from the stuck bit", () => {
    const { result } = renderHook(() => useStickToBottom());
    expect(result.current.showScrollButton(tall(590))).toBe(false);
    act(() => result.current.handleScroll(tall(100)));
    expect(result.current.showScrollButton(tall(100))).toBe(true);
    expect(
      result.current.showScrollButton({
        contentHeight: 300,
        viewportHeight: 400,
        scrollOffset: 0,
      }),
    ).toBe(false);
  });

  it("follows the controlled stuck value", () => {
    const { result, rerender } = renderHook(
      ({ stuck }: { stuck: boolean }) => useStickToBottom({ stuck }),
      { initialProps: { stuck: false } },
    );
    expect(result.current.stuck).toBe(false);
    rerender({ stuck: true });
    expect(result.current.stuck).toBe(true);
  });
});
