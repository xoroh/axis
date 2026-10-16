import { type ElementRef, type Ref, useCallback } from "react";
import {
  ActivityIndicator,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Loader — an unstyled busy indicator.
 *
 * The host `ActivityIndicator` with an announced busy state and
 * nothing else. Size/color/animation are the caller's (`size`,
 * `color` passthrough) — this component owns presence + announcement.
 */

export type LoaderProps = {
  /** Indicator size. Passed straight through. */
  size?: number | "small" | "large";
  /** Indicator color. Passed straight through. */
  color?: string;
  /** Accessible name source (e.g. "Loading results"). */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Forwarded to the container `View` host element. */
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
  ref: LoaderProps["ref"],
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

export function Loader({
  size,
  color,
  accessibilityLabel,
  testID,
  style,
  ref,
}: LoaderProps): React.JSX.Element {
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
      accessible
      accessibilityState={{ busy: true }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
