import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";

/**
 * Kbd — an unstyled key-hint display.
 *
 * A `Text` carrying caller key names ("⌘K", "Esc"). Inline semantics
 * only: no keyboard handling, no shortcuts engine — those belong to
 * the control being documented, never here.
 */

export type KbdProps = {
  /** Key names to display. */
  children?: ReactNode;
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Forwarded to the `Text` host element. */
  ref?: Ref<ElementRef<typeof Text>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: KbdProps["ref"],
  value: ElementRef<typeof Text> | null,
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

export function Kbd({
  children,
  testID,
  style,
  ref,
}: KbdProps): React.JSX.Element {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Text> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <Text ref={setHostRef} testID={testID} style={style}>
      {children}
    </Text>
  );
}
