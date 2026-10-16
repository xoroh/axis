import { useEffect, useState } from "react";
import { useWindowDimensions, type ViewStyle } from "react-native";
import {
  type Align,
  type Placement,
  type Rect,
  resolveFloatingRect,
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
 */

export type MeasuredRect = Pick<Rect, "x" | "y" | "width" | "height">;

export type MeasurableRef = {
  current: {
    measure: (
      callback: (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number,
      ) => void,
    ) => void;
  } | null;
};

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
} {
  const { anchorRef, placement, offset, align, alignOffset, active } = options;
  const viewport = useWindowDimensions();
  const [anchor, setAnchor] = useState<MeasuredRect | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    if (!active) return;
    anchorRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setAnchor({ x: pageX, y: pageY, width, height });
    });
  }, [active, anchorRef]);

  const onContentLayout = (event: ContentLayoutEvent) =>
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });

  if (!anchor || !size) {
    return {
      onContentLayout,
      style: { position: "absolute", opacity: 0, left: 0, top: 0 },
      measured: false,
    };
  }
  const at = resolveFloatingRect(anchor, size, {
    placement,
    offset,
    align,
    alignOffset,
    viewport,
  });
  return {
    onContentLayout,
    style: { position: "absolute", left: at.x, top: at.y },
    measured: true,
  };
}
