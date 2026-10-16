import { describe, expect, it, vi } from "vitest";
import { createToastQueue } from "./toastQueue";

describe("createToastQueue", () => {
  it("orders adds oldest-first", () => {
    const queue = createToastQueue();
    queue.add("first");
    queue.add("second");
    expect(queue.order()).toEqual(["first", "second"]);
    expect(queue.count()).toBe(2);
    expect(queue.isOpen("first")).toBe(true);
  });

  it("treats re-add as a no-op that keeps the original order", () => {
    const queue = createToastQueue();
    queue.add("a");
    queue.add("b");
    queue.add("a");
    expect(queue.order()).toEqual(["a", "b"]);
    expect(queue.count()).toBe(2);
  });

  it("removes exactly one registration on dismiss", () => {
    const queue = createToastQueue();
    queue.add("a");
    queue.add("b");
    queue.dismiss("a");
    expect(queue.order()).toEqual(["b"]);
    expect(queue.isOpen("a")).toBe(false);
  });

  it("ignores unknown dismisses instead of erroring", () => {
    const queue = createToastQueue();
    expect(() => queue.dismiss("never-queued")).not.toThrow();
    expect(queue.order()).toEqual([]);
  });

  it("clears every toast at once", () => {
    const queue = createToastQueue();
    queue.add("a");
    queue.add("b");
    queue.clear();
    expect(queue.order()).toEqual([]);
    expect(queue.count()).toBe(0);
  });

  it("notifies subscribers on mutation only", () => {
    const queue = createToastQueue();
    const listener = vi.fn();
    queue.subscribe(listener);
    queue.add("a");
    queue.add("a");
    queue.dismiss("missing");
    expect(listener).toHaveBeenCalledTimes(1);
    queue.dismiss("a");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("bumps the version on every mutation for store snapshots", () => {
    const queue = createToastQueue();
    const first = queue.version();
    queue.add("a");
    expect(queue.version()).toBeGreaterThan(first);
    const second = queue.version();
    queue.add("a");
    queue.dismiss("missing");
    expect(queue.version()).toBe(second);
  });
});
