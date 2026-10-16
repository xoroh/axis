import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * ButtonGroup — an honest layout container for caller buttons.
 *
 * Structure only: a `View` carrying the group role, rendering
 * caller-provided controls (`children`, typically Axis `Button`s). No
 * default visuals — every visual value (`style`) is caller-provided.
 *
 * Layout-only, deliberately: there is NO `disabled` prop and nothing
 * propagates. Each grouped button keeps its own props — its own
 * `disabled`, its own press path, its own announcement. A group-level
 * `disabled` would either steal behavior the buttons own or promise a
 * blockade it cannot enforce without reaching into caller elements;
 * both are behavior theft, so the prop does not exist. To disable a
 * set, disable each button.
 */

export type ButtonGroupProps = {
  /** Accessible name source for the group. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root group view style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Grouped controls (typically `Button`s) rendered inside the container. */
  children: ReactNode;
  /** Forwarded to the root group host element. */
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
  ref: ButtonGroupProps["ref"],
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

export function ButtonGroup({
  accessibilityLabel,
  testID,
  style,
  children,
  ref,
}: ButtonGroupProps): React.JSX.Element {
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
      // The group must be an accessibility element for its role and
      // label to reach assistive technology (and the `*ByRole` proofs):
      // a plain `View` is not one by default, unlike `Pressable`.
      accessible
      accessibilityRole="group"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      {children}
    </View>
  );
}
