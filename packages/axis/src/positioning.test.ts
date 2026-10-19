import { describe, expect, it } from "vitest";
import {
  clampRectToViewport,
  resolveFloatingOrigin,
  resolveFloatingRect,
  resolveFloatingSide,
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

  it("pins start/end alignment to the anchor edges (center stays default)", () => {
    // ANCHOR x=100 w=80; SIZE w=120.
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, { align: "start" }),
    ).toMatchObject({ x: 100 });
    expect(resolveFloatingOrigin(ANCHOR, SIZE, { align: "end" })).toMatchObject(
      { x: 100 + 80 - 120 },
    );
    // Vertical placement aligns on y instead.
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, {
        placement: "right",
        align: "start",
      }),
    ).toMatchObject({ y: 100 });
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, {
        placement: "right",
        align: "end",
      }),
    ).toMatchObject({ y: 100 + 40 - 60 });
  });

  it("shifts the aligned origin by alignOffset", () => {
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, {
        align: "start",
        alignOffset: 8,
      }),
    ).toMatchObject({ x: 108 });
    expect(
      resolveFloatingOrigin(ANCHOR, SIZE, { alignOffset: 8 }),
    ).toMatchObject({ x: 88 });
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

describe("resolveFloatingSide", () => {
  const VIEWPORT = { width: 400, height: 400 };

  it("retains preferred side when it fits inside viewport", () => {
    expect(
      resolveFloatingSide(ANCHOR, SIZE, {
        viewport: VIEWPORT,
        placement: "bottom",
      }),
    ).toBe("bottom");
    expect(
      resolveFloatingSide({ x: 100, y: 200, width: 80, height: 40 }, SIZE, {
        viewport: VIEWPORT,
        placement: "top",
      }),
    ).toBe("top");
  });

  it("flips bottom to top when anchor is near the bottom edge", () => {
    const nearBottom = { x: 100, y: 350, width: 80, height: 40 };
    expect(
      resolveFloatingSide(nearBottom, SIZE, {
        viewport: VIEWPORT,
        placement: "bottom",
      }),
    ).toBe("top");
  });

  it("flips top to bottom when anchor is near the top edge", () => {
    const nearTop = { x: 100, y: 10, width: 80, height: 40 };
    expect(
      resolveFloatingSide(nearTop, SIZE, {
        viewport: VIEWPORT,
        placement: "top",
      }),
    ).toBe("bottom");
  });

  it("flips right to left and left to right near viewport horizontal edges", () => {
    const nearRight = { x: 350, y: 100, width: 40, height: 40 };
    expect(
      resolveFloatingSide(nearRight, SIZE, {
        viewport: VIEWPORT,
        placement: "right",
      }),
    ).toBe("left");

    const nearLeft = { x: 10, y: 100, width: 40, height: 40 };
    expect(
      resolveFloatingSide(nearLeft, SIZE, {
        viewport: VIEWPORT,
        placement: "left",
      }),
    ).toBe("right");
  });
});
