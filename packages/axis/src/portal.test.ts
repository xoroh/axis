import { describe, expect, it, vi } from "vitest";
import { createPortalRegistry, resolvePortalTarget } from "./portal";

describe("createPortalRegistry", () => {
  it("orders mounts bottom-first", () => {
    const registry = createPortalRegistry();
    registry.mount("menu");
    registry.mount("dialog");
    expect(registry.order()).toEqual(["menu", "dialog"]);
    expect(registry.isMounted("dialog")).toBe(true);
  });

  it("treats re-mount as a no-op that keeps the original order", () => {
    const registry = createPortalRegistry();
    registry.mount("a");
    registry.mount("b");
    registry.mount("a");
    expect(registry.order()).toEqual(["a", "b"]);
  });

  it("removes exactly one registration on unmount", () => {
    const registry = createPortalRegistry();
    registry.mount("a");
    registry.mount("b");
    registry.unmount("a");
    expect(registry.order()).toEqual(["b"]);
    expect(registry.isMounted("a")).toBe(false);
  });

  it("ignores unknown unmounts instead of erroring", () => {
    const registry = createPortalRegistry();
    expect(() => registry.unmount("never-mounted")).not.toThrow();
    expect(registry.order()).toEqual([]);
  });

  it("notifies subscribers on mount and unmount only", () => {
    const registry = createPortalRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    registry.mount("a");
    registry.mount("a");
    registry.unmount("missing");
    expect(listener).toHaveBeenCalledTimes(1);
    registry.unmount("a");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("resolvePortalTarget", () => {
  it("prefers the owner-provided host", () => {
    expect(
      resolvePortalTarget({ ownerProvided: "host-a", defaultTarget: "root" }),
    ).toBe("host-a");
  });

  it("falls back to the default, then the kern root", () => {
    expect(resolvePortalTarget({ defaultTarget: "root" })).toBe("root");
    expect(resolvePortalTarget({})).toBe("kern-portal-root");
  });
});
