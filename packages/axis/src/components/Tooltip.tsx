import {
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useRef,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { Placement } from "../positioning";
import { useControllableState } from "../useControllableState";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Tooltip — an unstyled hint anchored to content.
 *
 * Long-press the anchor to toggle. The tip is measured and placed
 * with `useFloatingPlacement` (anchor `measure()` + viewport +
 * `resolveFloatingRect`); until measured it stays transparent at
 * origin rather than flashing somewhere wrong. No hover model (no
 * pointer on touch devices), no scrim — dismissal is a second
 * long-press or the controlled prop. `placement` prefers a side;
 * the rect math clamps into the viewport.
 */

export type TooltipProps = {
  /** Tooltip body content (required — an empty tip is a bug). */
  content: ReactNode;
  /** Anchor content the tip describes (required). */
  children: ReactNode;
  /** Controlled visibility. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default `false`. */
  defaultOpen?: boolean;
  /** Fires on every visibility change. */
  onOpenChange?: (open: boolean) => void;
  /** Preferred side. Default `"top"`. Clamped into the viewport. */
  placement?: Placement;
  /** Accessible name source for the tip. */
  accessibilityLabel?: string;
  testID?: string;
  /** Anchor wrapper style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Tip container style, caller-provided. */
  tipStyle?: StyleProp<ViewStyle>;
  /** Forwarded to the anchor wrapper host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

function assignRef(
  ref: TooltipProps["ref"],
  value: ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // A frozen ref object cannot take the write — leave it alone
      // rather than failing the render over it.
    }
  }
}

export function Tooltip({
  content,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  placement,
  accessibilityLabel,
  testID,
  style,
  tipStyle,
  ref,
}: TooltipProps): React.JSX.Element {
  const [visible, setVisible] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      anchorHostRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const floating = useFloatingPlacement({
    anchorRef: anchorHostRef,
    placement,
    active: visible ?? false,
  });

  const toggle = useCallback(() => {
    setVisible((previous) => !(previous ?? false));
  }, [setVisible]);

  return (
    <View ref={setAnchorRef} style={style} testID={testID}>
      <Pressable onLongPress={toggle}>{children}</Pressable>
      {visible ? (
        <View
          // Explicit like the anchor rule for progressbar/image: a tip
          // whose role never reaches assistive tech is broken.
          accessible
          accessibilityRole="tooltip"
          accessibilityLabel={accessibilityLabel}
          onLayout={floating.onContentLayout}
          style={[floating.style, tipStyle]}
        >
          {content}
        </View>
      ) : null}
    </View>
  );
}
