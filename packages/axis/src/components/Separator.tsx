import { type ElementRef, type Ref, useCallback } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Separator — an unstyled divider between content.
 *
 * A decorative `View`: `accessible={false}` because React Native
 * defines no separator role, and an unbacked role claim is worse than
 * honest silence. Direction is the caller's styling decision (a
 * horizontal rule vs a vertical rule differ only in `style`); this
 * component carries no orientation prop it cannot honor. All visuals
 * are caller-provided.
 */

export type SeparatorProps = {
  testID?: string;
  /** Divider style, caller-provided. */
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
  ref: SeparatorProps["ref"],
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

export function Separator({
  testID,
  style,
  ref,
}: SeparatorProps): React.JSX.Element {
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
