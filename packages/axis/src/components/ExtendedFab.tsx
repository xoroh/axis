import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { Pressable, type StyleProp, Text, type ViewStyle } from "react-native";

/**
 * ExtendedFab — an unstyled extended floating action button.
 *
 * Structure only: a `Pressable` carrying the button role and state,
 * rendering an optional leading `icon` node beside caller text
 * content (`children`). Same scoping as `Fab`: shape, size system,
 * elevation, and color are caller decisions in `style`; the component
 * owns press/label/disabled/busy semantics. Unlike the icon-only
 * `Fab`, the visible text names the control, so `accessibilityLabel`
 * is optional — provide one only when the visible text is not the
 * name (e.g. an icon + truncated label where the full action needs
 * stating).
 */

export type ExtendedFabProps = {
  /** Fires on press. Suppressed while `disabled` or `loading`. */
  onPress?: () => void;
  /** Terminal: no callbacks, announced as disabled. */
  disabled?: boolean;
  /**
   * Busy: suppresses `onPress`, announced as busy. The caller swaps
   * content to reflect the busy state — nothing renders here.
   */
  loading?: boolean;
  /** Leading icon node. Caller-provided. */
  icon?: ReactNode;
  /**
   * Accessible name source. Optional: the visible text content names
   * the control unless stated otherwise here.
   */
  accessibilityLabel?: string;
  testID?: string;
  /** Root pressable style. */
  style?: StyleProp<ViewStyle>;
  /** Visible label content. An extended fab without text is a `Fab`. */
  children?: ReactNode;
  /** Forwarded to the root pressable host element. */
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
  ref: ExtendedFabProps["ref"],
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

export function ExtendedFab({
  onPress,
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  testID,
  style,
  children,
  ref,
}: ExtendedFabProps): React.JSX.Element {
  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    onPress?.();
  }, [disabled, loading, onPress]);

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
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={handlePress}
      style={style}
    >
      {icon}
      {typeof children === "string" || typeof children === "number" ? (
        <Text>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
