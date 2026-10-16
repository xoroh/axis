import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { resolveRender, resolveStyle } from "./render";

describe("resolveStyle", () => {
  it("passes values through untouched", () => {
    expect(resolveStyle({ opacity: 1 }, { open: true })).toEqual({
      opacity: 1,
    });
    expect(resolveStyle(undefined, { open: true })).toBeUndefined();
  });

  it("calls function styles with part state", () => {
    const style = vi.fn((state: { open: boolean }) => ({
      opacity: state.open ? 1 : 0,
    }));
    expect(resolveStyle(style, { open: false })).toEqual({ opacity: 0 });
    expect(style).toHaveBeenCalledWith({ open: false });
  });
});

describe("resolveRender", () => {
  it("returns null when render is absent (part renders its default host)", () => {
    expect(resolveRender(undefined, { a: 1 }, {})).toBeNull();
    expect(resolveRender(null, { a: 1 }, {})).toBeNull();
  });

  it("calls function render with (props, state)", () => {
    const render = vi.fn(
      (_props: { a: number }, _state: { open: boolean }) => null,
    );
    resolveRender(render, { a: 1 }, { open: true });
    expect(render).toHaveBeenCalledWith({ a: 1 }, { open: true });
  });

  it("clones element render with part props merged under the element's", () => {
    const calls: string[] = [];
    const node = resolveRender(
      createElement("div" as never, {
        onPress: () => calls.push("consumer"),
        style: { color: "red" },
      }),
      {
        onPress: () => calls.push("part"),
        style: { opacity: 1 },
        testID: "part",
      },
      {},
    );
    expect(node).not.toBeNull();
    const props = (node as { props: Record<string, unknown> }).props;
    // Consumer style wins per key; part props fill the rest.
    expect(props.style).toMatchObject({ opacity: 1, color: "red" });
    expect(props.testID).toBe("part");
    (props.onPress as () => void)();
    // Part handler first, then the consumer's (slot precedent).
    expect(calls).toEqual(["part", "consumer"]);
  });

  it("overrides className to undefined on the clone (no stylesheet engine on native)", () => {
    const node = resolveRender(
      createElement("div" as never, { className: "popup-open" }),
      { testID: "part" },
      {},
    );
    const props = (node as { props: Record<string, unknown> }).props;
    // Present-but-undefined: the renderer skips it, so no host warning
    // fires, and no stylesheet class leaks onto native.
    expect(props.className).toBeUndefined();
    expect(props.testID).toBe("part");
  });

  it("returns null for non-element, non-function render values", () => {
    expect(resolveRender("text" as never, {}, {})).toBeNull();
  });
});
