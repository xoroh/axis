import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

/**
 * Trigger — an unstyled semantics-free press container.
 *
 * A `Pressable` carrying caller content with the disabled-terminal
 * guard, stable ref composition, and test hooks — and deliberately
 * NO `accessibilityRole`, no label requirement, no busy semantics.
 * It exists for building custom controls whose role and state the
 * CALLER asserts (a tab-strip trigger owned by `Tabs`, a row with a
 * custom role, a pressable wrapper inside a composite): using
 * `Button` there would assert a `button` role the control does not
 * own, and using raw RN `Pressable` would drop the terminal-disabled
 * guard and the ref/testID conventions every Axis host carries.
 *
 * Reach for `Button` when the control IS a labelled action (with
 * busy state) or `Switch` when it IS binary state with checked
 * announcements — each asserts semantics this component must not
 * repeat. Reach for `Trigger` when the control owns its own
 * semantics and needs only a press container. A `Trigger` with a
 * `button` role and a label is
 * a `Button` written the long way — review rejects it.
 */

export type TriggerProps = {
  /** Fires on press. Suppressed while `disabled`. */
  onPress?: () => void;
  /** Terminal: no callbacks. Announced only if the caller asserts a role. */
  disabled?: boolean;
  /** Accessible name source. No default — the caller owns naming. */
  accessibilityLabel?: string;
  testID?: string;
  /** Pressable style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Content. */
  children?: ReactNode;
  /** Forwarded to the host pressable element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: TriggerProps["ref"],
  value: ElementRef<typeof Pressable> | null,
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

export function Trigger({
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  ref,
}: TriggerProps): React.JSX.Element {
  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
  }, [disabled, onPress]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <Pressable
      ref={setHostRef}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={handlePress}
      style={style}
    >
      {children}
    </Pressable>
  );
}
