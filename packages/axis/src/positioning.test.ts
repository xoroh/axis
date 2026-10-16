import { describe, expect, it } from "vitest";
import {
  clampRectToViewport,
  resolveFloatingOrigin,
  resolveFloatingRect,
} from "./positioning";

const ANCHOR = { x: 100, y: 100, width: 80, height: 40 };
const SIZE = { width: 120, height: 60 };

describe("resolveFloatingOrigin", () => {
  it("places below the anchor by default, centered on the cross axis", () => {
    expect(resolveFloatingOrigin(ANCHOR, SIZE)).toEqual({
      // 100 + (80 - 120) / 2 = 80; 100 + 40 = 140
      x: 80,
      y: 140,
    });
  });

  it("honours placement and offset on every side", () => {
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, { placement: "top", offset: 8 }),
    ).toEqual({
      x: 80,
      y: 100 - 60 - 8,
    });
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, { placement: "left", offset: 8 }),
    ).toEqual({
      x: 100 - 120 - 8,
      // 100 + (40 - 60) / 2 = 90
      y: 90,
    });
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, { placement: "right", offset: 8 }),
    ).toEqual({
      x: 100 + 80 + 8,
      y: 90,
    });
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, { placement: "bottom", offset: 8 }),
    ).toEqual({
      x: 80,
      y: 148,
    });
  });
});

describe("clampRectToViewport", () => {
  const VIEWPORT = { width: 400, height: 400 };

  it("leaves a fitting origin alone", () => {
    expect(clampRectToViewport({ x: 80, y: 140 }, SIZE, VIEWPORT)).toEqual({
      x: 80,
      y: 140,
    });
  });

  it("pulls an overflowing origin back inside", () => {
    expect(clampRectToViewport({ x: 350, y: 380 }, SIZE, VIEWPORT)).toEqual({
      x: 400 - 120,
      y: 400 - 60,
    });
    expect(clampRectToViewport({ x: -50, y: -20 }, SIZE, VIEWPORT)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("keeps padding clear and pins oversized surfaces to the padded origin", () => {
    expect(clampRectToViewport({ x: 5, y: 5 }, SIZE, VIEWPORT, 16)).toEqual({
      x: 16,
      y: 16,
    });
    const oversized = { width: 500, height: 500 };
    expect(
      clampRectToViewport({ x: 0, y: 0 }, oversized, VIEWPORT, 16),
    ).toEqual({
      x: 16,
      y: 16,
    });
  });
});

describe("resolveFloatingRect", () => {
  it("returns the preferred origin when no viewport is measured yet", () => {
    expect(resolveFloatingRect(ANCHOR, SIZE)).toEqual({ x: 80, y: 140 });
  });

  it("clamps into a measured viewport", () => {
    const nearEdge = { x: 350, y: 350, width: 40, height: 40 };
    expect(
      resolveFloatingRect(nearEdge, SIZE, {
        viewport: { width: 400, height: 400 },
      }),
    ).toEqual({ x: 280, y: 340 });
  });
});
