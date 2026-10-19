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
 * element, whose rect is already in viewport coordinates. Pairing
 * those coordinates with `absolute` misplaces the popup twice over —
 * once by the anchor offset, once by every relative ancestor — so the
 * web path positions the popup `fixed` instead. Native keeps the
 * `measure` + `absolute` path byte-for-byte. No web imports, no
 * globals, no new host bindings: the element shape is detected by
 * duck-typing the ref node itself.
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
     * native host refs never carry it, so its presence marks the
     * web path without any platform import.
     */
    getBoundingClientRect?: () => {
      left: number;
      top: number;
      width: number;
      height: number;
    };
  } | null;
};

/**
 * Viewport positioning for the web path. React Native Web honors
 * `fixed` (its own style types list it alongside `absolute`), but the
 * shared RN `position` union omits it — native never executes the web
 * branch, so the literal travels through `unknown` once, here, with
 * the reason attached instead of at every use site.
 */
const FIXED_POSITION = "fixed" as unknown as ViewStyle["position"];

export type ContentLayoutEvent = {
  nativeEvent: { layout: { width: number; height: number } };
};

export function useFloatingPlacement(options: {
  anchorRef: MeasurableRef;
  placement?: Placement;
  offset?: number;
  align?: Align;
  alignOffset?: number;
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
    active,
  } = options;
  const viewport = useWindowDimensions();
  const [anchor, setAnchor] = useState<MeasuredRect | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  // True once the anchor measured through the web element path below.
  // State (not a render-time ref read): the flag and the anchor commit
  // together, so the style never mixes a native rect with `fixed`.
  const [web, setWeb] = useState(false);

  useEffect(() => {
    if (!active) return;
    const node = anchorRef.current;
    if (!node) return;
    if (typeof node.getBoundingClientRect === "function") {
      // React Native Web: the ref is the element itself. Its rect is
      // already viewport-relative, matching `fixed` positioning.
      const rect = node.getBoundingClientRect();
      setWeb(true);
      setAnchor({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
      return;
    }
    if (typeof node.measure === "function") {
      setWeb(false);
      node.measure((_x, _y, width, height, pageX, pageY) => {
        setAnchor({ x: pageX, y: pageY, width, height });
      });
    }
    // A node with neither shape leaves the anchor null: the content
    // stays transparent at origin (the pre-existing unmeasured path).
  }, [active, anchorRef]);

  const onContentLayout = (event: ContentLayoutEvent) =>
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });

  if (!anchor || !size) {
    return {
      onContentLayout,
      style: web
        ? { position: FIXED_POSITION, opacity: 0, left: 0, top: 0 }
        : { position: "absolute", opacity: 0, left: 0, top: 0 },
      measured: false,
      side: placement,
    };
  }
  const effectiveSide = resolveFloatingSide(anchor, size, {
    placement,
    offset,
    align,
    alignOffset,
    viewport,
  });
  const at = resolveFloatingRect(anchor, size, {
    placement: effectiveSide,
    offset,
    align,
    alignOffset,
    viewport,
  });
  return {
    onContentLayout,
    style: web
      ? { position: FIXED_POSITION, left: at.x, top: at.y }
      : { position: "absolute", left: at.x, top: at.y },
    measured: true,
    side: effectiveSide,
  };
}
