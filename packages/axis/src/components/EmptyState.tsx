import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * EmptyState — an unstyled nothing-here placeholder.
 *
 * Structure only: optional title/body text plus a caller-provided
 * action slot. No iconography, no illustration, no suggested copy —
 * the empty state is the caller's message, this is its frame.
 */

export type EmptyStateProps = {
  /** Title content. */
  title?: ReactNode;
  /** Body content. */
  description?: ReactNode;
  /** Action content (typically a Button). */
  action?: ReactNode;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Title text style, caller-provided. */
  titleStyle?: StyleProp<TextStyle>;
  /** Body text style, caller-provided. */
  descriptionStyle?: StyleProp<TextStyle>;
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
  ref: EmptyStateProps["ref"],
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

export function EmptyState({
  title,
  description,
  action,
  accessibilityLabel,
  testID,
  style,
  titleStyle,
  descriptionStyle,
  ref,
}: EmptyStateProps): React.JSX.Element {
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
      {title !== undefined ? <Text style={titleStyle}>{title}</Text> : null}
      {description !== undefined ? (
        <Text style={descriptionStyle}>{description}</Text>
      ) : null}
      {action}
    </View>
  );
}
