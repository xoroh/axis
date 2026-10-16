import { type ElementRef, type Ref, useCallback } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Skeleton — an unstyled loading placeholder.
 *
 * A silent container reserving layout space while content loads. No
 * shimmer, no pulse, no timing — placeholder motion is caller-owned
 * animation, not structure. Hidden from assistive tech
 * (`accessible={false}`): a placeholder announces nothing.
 */

export type SkeletonProps = {
  testID?: string;
  /** Placeholder style (dimensions live here), caller-provided. */
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
  ref: SkeletonProps["ref"],
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

export function Skeleton({
  testID,
  style,
  ref,
}: SkeletonProps): React.JSX.Element {
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
    <View ref={setHostRef} accessible={false} testID={testID} style={style} />
  );
}
