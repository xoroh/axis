import { describe, expect, it } from "vitest";
import { createIdScope, resolveDir, VISUALLY_HIDDEN_STYLE } from "./a11y";

describe("VISUALLY_HIDDEN_STYLE", () => {
  it("hides visually while staying in the accessibility tree", () => {
    // Geometry only: 1px clipped box, no display:none (which would remove it
    // from the tree) and no token values (which would be a visual decision).
    expect(VISUALLY_HIDDEN_STYLE.position).toBe("absolute");
    expect(VISUALLY_HIDDEN_STYLE.width).toBe(1);
    expect(VISUALLY_HIDDEN_STYLE.height).toBe(1);
    expect(VISUALLY_HIDDEN_STYLE.overflow).toBe("hidden");
    expect(VISUALLY_HIDDEN_STYLE.clip).toBe("rect(0, 0, 0, 0)");
  });
});

describe("createIdScope", () => {
  it("issues prefixed 1-based ids", () => {
    const scope = createIdScope("kern-dialog");
    expect(scope.nextId()).toBe("kern-dialog-1");
    expect(scope.nextId()).toBe("kern-dialog-2");
  });

  it("keeps scopes independent", () => {
    const a = createIdScope("a");
    const b = createIdScope("b");
    expect(a.nextId()).toBe("a-1");
    expect(b.nextId()).toBe("b-1");
    expect(a.nextId()).toBe("a-2");
  });
});

describe("resolveDir", () => {
  it("prefers the explicit dir, then the host default, then ltr", () => {
    expect(resolveDir({ dir: "rtl" })).toBe("rtl");
    expect(resolveDir({ dir: "rtl", defaultDir: "ltr" })).toBe("rtl");
    expect(resolveDir({ defaultDir: "rtl" })).toBe("rtl");
    expect(resolveDir()).toBe("ltr");
    expect(resolveDir({})).toBe("ltr");
  });
});
