import {
  createPortalRegistry,
  resolveFloatingRect,
  resolvePortalTarget,
} from "./index";

/**
 * Registry + rect math under the React Native runtime (jest RN preset, no
 * DOM). These models are pure, so the proof here is portability: identical
 * mount-order and dp-space semantics where the RN host — not a browser —
 * is the execution environment.
 */

describe("portal registry on React Native", () => {
  it("mount order is bottom-first; re-mount is a no-op; unknown unmount is safe", () => {
    const registry = createPortalRegistry();
    registry.mount("sheet");
    registry.mount("dialog");
    registry.mount("sheet");
    expect(registry.order()).toEqual(["sheet", "dialog"]);
    expect(registry.isMounted("sheet")).toBe(true);
    registry.unmount("missing");
    registry.unmount("sheet");
    expect(registry.order()).toEqual(["dialog"]);
  });

  it("explicit host wins; otherwise the shared default stands", () => {
    expect(resolvePortalTarget({ ownerProvided: "custom-host" })).toBe(
      "custom-host",
    );
    expect(resolvePortalTarget({})).toBe("axis-portal-root");
  });
});

describe("floating rect on React Native", () => {
  it("places below the anchor and clamps into the measured viewport", () => {
    const anchor = { x: 100, y: 200, width: 120, height: 48 };
    const size = { width: 200, height: 160 };
    const viewport = { width: 390, height: 844 };
    const at = resolveFloatingRect(anchor, size, { viewport });
    // Below the anchor, horizontally inside the viewport.
    expect(at.y).toBeGreaterThanOrEqual(anchor.y + anchor.height);
    expect(at.x).toBeGreaterThanOrEqual(0);
    expect(at.x + size.width).toBeLessThanOrEqual(viewport.width);
    expect(at.y + size.height).toBeLessThanOrEqual(viewport.height);
  });

  it("without a measured viewport the preferred origin stands", () => {
    const at = resolveFloatingRect(
      { x: 100, y: 200, width: 120, height: 48 },
      { width: 200, height: 160 },
    );
    expect(at.y).toBeGreaterThanOrEqual(248);
  });
});
