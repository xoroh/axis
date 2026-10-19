import { useEffect, useState } from "react";
import { useWindowDimensions, type ViewStyle } from "react-native";
import {
  type Align,
  type Placement,
  type Rect,
  resolveFloatingRect,
  resolveFloatingSide,
} from "../positioning";

/**
 * Shared measured-placement plumbing for positioned overlays
 * (Tooltip first; Menu/Popover/Select/Combobox follow the same
 * shape). Internal module, not barrel-exported: it is RN-specific
 * measurement wiring, not a public behavior model, and stays private
 * until a direct consumer justifies promotion.
 *
 * The caller measures the anchor through a host ref (`measure` gives
 * window coordinates — `onLayout` alone cannot, it is parent-local);
 * content size arrives through `onContentLayout`; the viewport comes
 * from `useWindowDimensions`. Until both measurements exist the
 * content stays transparent at origin instead of flashing somewhere
 * wrong. All inputs and outputs are plain numbers.
 *
 * Web (React Native Web): the host ref resolves to the underlying
 * element, so the anchor reads from its rect instead of `measure`. A
 * rect alone is not enough — viewport coordinates paired with
 * `absolute` double-offset the popup inside nested relative boxes, so
 * every popup lands far from its trigger. The layout event carries
 * the popup's own node, whose offset parent IS the containing block
 * `absolute` positions against: subtracting its origin translates the
 * anchor into exactly the right space, whether the popup sits in the
 * anchor wrapper (monoliths) or in a portal layer (compounds). No web
 * imports, no globals, no new host bindings: both shapes are
 * detected by duck-typing, and a node with neither shape keeps the
 * pre-existing transparent-at-origin path (previously that shape
 * crashed the effect — the optional chain guarded the ref, not the
 * method).
 */

export type MeasuredRect = Pick<Rect, "x" | "y" | "width" | "height">;

export type MeasurableRef = {
  current: {
    measure?: (
      callback: (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number,
      ) => void,
    ) => void;
    /**
     * Web host nodes expose the element rect directly. Optional:
     * native host refs never carry it, so its presence marks the web
     * path without any platform import.
     */
    getBoundingClientRect?: () => {
      left: number;
      top: number;
      width: number;
      height: number;
    };
  } | null;
};

export type ContentLayoutEvent = {
  nativeEvent: {
    layout: { width: number; height: number };
    /**
     * Web only: React Native Web tags the layout event with the DOM
     * node that laid out, which locates the popup's containing block.
     * Absent on native (and in tests that deliver plain payloads).
     */
    target?: unknown;
  };
};

/**
 * Whether `value` quacks like a DOM element rect source. Guards both
 * the anchor node and the popup's offset parent — the only DOM reads
 * in this module, and neither names a DOM global.
 */
function isRectNode(
  value: unknown,
): value is { getBoundingClientRect: () => { left: number; top: number } } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { getBoundingClientRect?: unknown })
      .getBoundingClientRect === "function"
  );
}

/**
 * Viewport origin of the box `absolute` positions the laid-out popup
 * against: its offset parent's box when the layout event carries a
 * node for it (web), else the viewport origin itself (native, where
 * `measure` already reports that space).
 */
function containingBlockOrigin(target: unknown): { x: number; y: number } {
  if (typeof target !== "object" || target === null) return { x: 0, y: 0 };
  const parent = (target as { offsetParent?: unknown }).offsetParent;
  if (!isRectNode(parent)) return { x: 0, y: 0 };
  const box = parent.getBoundingClientRect();
  return { x: box.left, y: box.top };
}

export function useFloatingPlacement(options: {
  anchorRef: MeasurableRef;
  placement?: Placement;
  offset?: number;
  align?: Align;
  alignOffset?: number;
  /**
   * Match the popup width to the anchor width (Base UI anchor-width
   * parity for list-style popups): the effective content box becomes
   * as wide as the anchor, so centering pins it to the trigger's
   * edges instead of drifting mid-anchor. Off by default —
   * content-sized popups (tips, menus, popovers) keep their size.
   */
  matchAnchorWidth?: boolean;
  /**
   * Viewport padding kept clear when clamping, in the same units as
   * the rects. Default `0` (no padding).
   */
  viewportPadding?: number;
  active: boolean;
}): {
  onContentLayout: (event: ContentLayoutEvent) => void;
  style: ViewStyle;
  measured: boolean;
  side: Placement;
} {
  const {
    anchorRef,
    placement = "bottom",
    offset,
    align,
    alignOffset,
    matchAnchorWidth = false,
    viewportPadding = 0,
    active,
  } = options;
  const viewport = useWindowDimensions();
  const [anchor, setAnchor] = useState<MeasuredRect | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  // Viewport origin of the box `absolute` positions the popup against.
  // The native viewport origin (measure space) everywhere except the
  // web path, where the containing block can sit anywhere down the
  // page — the final point is translated by this after viewport-space
  // flip/clamp, so overflow decisions stay in the space the user sees.
  const [origin, setOrigin] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!active) return;
    const node = anchorRef.current;
    // Web element nodes resolve lazily inside `onContentLayout`, where
    // the popup's containing block is known and the rect is fresh.
    if (!node || isRectNode(node)) return;
    if (typeof node.measure === "function") {
      setOrigin({ x: 0, y: 0 });
      node.measure((_x, _y, width, height, pageX, pageY) => {
        setAnchor({ x: pageX, y: pageY, width, height });
      });
    }
    // A node with neither shape leaves the anchor null: the content
    // stays transparent at origin (and no longer crashes the effect).
  }, [active, anchorRef]);

  const onContentLayout = (event: ContentLayoutEvent) => {
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
    if (!active) return;
    const node = anchorRef.current;
    if (!isRectNode(node)) return;
    // Fresh read: layout lands after mount, so this rect already
    // reflects any scroll or layout between activation and paint. The
    // anchor stays in viewport space here; only the final point below
    // is translated into the containing block.
    const rect = node.getBoundingClientRect();
    setOrigin(containingBlockOrigin(event.nativeEvent.target));
    setAnchor({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  if (!anchor || !size) {
    return {
      onContentLayout,
      style: { position: "absolute", opacity: 0, left: 0, top: 0 },
      measured: false,
      side: placement,
    };
  }
  // Anchor-matched width: clamp the anchor span into the padded
  // viewport so the box never outgrows the screen it opens on.
  const boxWidth = matchAnchorWidth
    ? Math.max(0, Math.min(anchor.width, viewport.width - viewportPadding * 2))
    : size.width;
  const boxSize = { width: boxWidth, height: size.height };
  const effectiveSide = resolveFloatingSide(anchor, boxSize, {
    placement,
    offset,
    align,
    alignOffset,
    viewport,
    viewportPadding,
  });
  const at = resolveFloatingRect(anchor, boxSize, {
    placement: effectiveSide,
    offset,
    align,
    alignOffset,
    viewport,
    viewportPadding,
  });
  return {
    onContentLayout,
    style: {
      position: "absolute",
      left: at.x - origin.x,
      top: at.y - origin.y,
      ...(matchAnchorWidth ? { width: boxWidth } : null),
    },
    measured: true,
    side: effectiveSide,
  };
}
