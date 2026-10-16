/**
 * Anchor positioning math — where a floating surface goes relative to its trigger.
 *
 * ## Why this is a primitive
 *
 * Popover, menu, select, tooltip, combobox and preview-card all place a surface
 * next to an anchor with a gap, then clamp it into the viewport. Both renderers
 * do that arithmetic today with independent implementations, so a clamping fix
 * on one side silently does not reach the other.
 *
 * ## What is genuinely shared, and what is not
 *
 * The MATH is shared and belongs here: given an anchor rect, a floating size,
 * a placement and a gap, which origin the surface takes, and how it clamps into
 * a viewport. The MEASUREMENT is not — reading DOM rects or RN `measure` is
 * platform code. So the renderer measures, this computes.
 *
 * All values are plain numbers in the same unit space the caller measured in
 * (CSS px on web, dp on native). Nothing here names a token: the gap is a
 * caller-supplied number, not a spacing value.
 */

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Placement = "top" | "bottom" | "left" | "right";

/** Cross-axis alignment of the surface against the anchor (Base UI parity). */
export type Align = "start" | "center" | "end";

export type PositioningOptions = {
  /** Which side of the anchor the surface prefers. Defaults to `"bottom"`. */
  placement?: Placement;
  /** Gap between anchor and surface edges. Defaults to `0`. */
  offset?: number;
  /**
   * Cross-axis alignment. Defaults to `"center"` (the historical
   * behavior — every existing caller centers). `"start"`/`"end"`
   * pin the surface's leading/trailing edge to the anchor's.
   */
  align?: Align;
  /** Shift along the cross axis after alignment. Defaults to `0`. */
  alignOffset?: number;
};

/**
 * The surface origin for `anchor` + `size` at `placement`, before clamping.
 * Centered on the anchor's cross axis unless `align` says otherwise:
 * a bottom surface centers horizontally, a right surface vertically.
 */
export function resolveFloatingOrigin(
  anchor: Rect,
  size: { width: number; height: number },
  options?: PositioningOptions,
): { x: number; y: number } {
  const placement = options?.placement ?? "bottom";
  const offset = options?.offset ?? 0;
  const align = options?.align ?? "center";
  const alignOffset = options?.alignOffset ?? 0;
  // Cross-axis origin: center splits the spare space; start pins to
  // the anchor's leading edge; end pins the surface's trailing edge
  // to the anchor's. `alignOffset` shifts after alignment.
  const cross = (
    anchorStart: number,
    anchorSpan: number,
    surfaceSpan: number,
  ): number => {
    if (align === "start") return anchorStart + alignOffset;
    if (align === "end")
      return anchorStart + anchorSpan - surfaceSpan + alignOffset;
    return anchorStart + (anchorSpan - surfaceSpan) / 2 + alignOffset;
  };
  switch (placement) {
    case "top":
      return {
        x: cross(anchor.x, anchor.width, size.width),
        y: anchor.y - size.height - offset,
      };
    case "left":
      return {
        x: anchor.x - size.width - offset,
        y: cross(anchor.y, anchor.height, size.height),
      };
    case "right":
      return {
        x: anchor.x + anchor.width + offset,
        y: cross(anchor.y, anchor.height, size.height),
      };
    case "bottom":
      return {
        x: cross(anchor.x, anchor.width, size.width),
        y: anchor.y + anchor.height + offset,
      };
  }
}

/**
 * Clamp a placed surface into `viewport`, keeping `padding` clear on every
 * side. A surface larger than the padded viewport pins to the padded origin —
 * it cannot fit, so it starts at the start rather than overflowing both sides.
 */
export function clampRectToViewport(
  origin: { x: number; y: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  padding?: number,
): { x: number; y: number } {
  const pad = padding ?? 0;
  const maxX = Math.max(pad, viewport.width - size.width - pad);
  const maxY = Math.max(pad, viewport.height - size.height - pad);
  return {
    x: Math.min(Math.max(origin.x, pad), maxX),
    y: Math.min(Math.max(origin.y, pad), maxY),
  };
}

/**
 * One call for the common path: preferred origin, then clamped. `viewport`
 * defaults to unbounded when the renderer has not measured one yet — the
 * preferred origin stands rather than clamping against a zero rect.
 */
export function resolveFloatingRect(
  anchor: Rect,
  size: { width: number; height: number },
  options?: PositioningOptions & {
    viewport?: { width: number; height: number };
    viewportPadding?: number;
  },
): { x: number; y: number } {
  const origin = resolveFloatingOrigin(anchor, size, options);
  if (!options?.viewport) return origin;
  return clampRectToViewport(
    origin,
    size,
    options.viewport,
    options.viewportPadding,
  );
}
