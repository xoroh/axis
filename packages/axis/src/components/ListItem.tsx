import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * ListItem — an unstyled row with leading/content/trailing slots.
 *
 * Structure only: optional leading and trailing nodes around caller
 * content. The row itself is a `Pressable` only when `onPress` is
 * provided — a static row stays a plain `View` (no fake affordance).
 * Selection is caller state expressed through `selected`, announced
 * when the row is pressable.
 */

export type ListItemProps = {
  /** Leading content (icon, avatar, checkbox). */
  leading?: ReactNode;
  /** Main content. */
  children?: ReactNode;
  /** Trailing content (meta, chevron, action). */
  trailing?: ReactNode;
  /** Press action. Absence renders a static row. */
  onPress?: () => void;
  /** Selected state, announced when pressable. */
  selected?: boolean;
  /** Terminal: no press. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Content text style, caller-provided (applies when children is text). */
  contentStyle?: StyleProp<TextStyle>;
  /** Forwarded to the host element (both hosts resolve to a View). */
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
  ref: ListItemProps["ref"],
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

export function ListItem({
  leading,
  children,
  trailing,
  onPress,
  selected = false,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  contentStyle,
  ref,
}: ListItemProps): React.JSX.Element {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  if (onPress === undefined) {
    return (
      <View
        ref={setHostRef}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={style}
      >
        {leading}
        {typeof children === "string" || typeof children === "number" ? (
          <Text style={contentStyle}>{children}</Text>
        ) : (
          children
        )}
        {trailing}
      </View>
    );
  }
  return (
    <Pressable
      ref={setHostRef}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={style}
    >
      {leading}
      {children}
      {trailing}
    </Pressable>
  );
}
