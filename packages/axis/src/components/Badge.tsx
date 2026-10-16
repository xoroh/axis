import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Badge — an unstyled count/dot adornment.
 *
 * Structure only: a container `View` with caller content (usually a
 * short `Text`). No pill shape, no colors, no positioning — adornment
 * layout belongs to the caller. Read as plain content; no invented
 * role.
 */

export type BadgeProps = {
  /** Adornment content (count, dot, status mark). */
  children?: ReactNode;
  /** Accessible name source (e.g. "3 unread"). */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Content text style, caller-provided. */
  textStyle?: StyleProp<TextStyle>;
  /** Forwarded to the container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: BadgeProps["ref"],
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

export function Badge({
  children,
  accessibilityLabel,
  testID,
  style,
  textStyle,
  ref,
}: BadgeProps): React.JSX.Element {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <View
      ref={setHostRef}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}
