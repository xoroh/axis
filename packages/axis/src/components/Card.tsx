import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Card — an unstyled content container.
 *
 * Structure only: header, media, body, and actions slots in document
 * order. No elevation, no shape, no padding — container chrome is the
 * caller's design system. Slots render only when provided.
 */

export type CardProps = {
  /** Header content. */
  header?: ReactNode;
  /** Media content. */
  media?: ReactNode;
  /** Body content. */
  children?: ReactNode;
  /** Actions content. */
  actions?: ReactNode;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Header container style, caller-provided. */
  headerStyle?: StyleProp<ViewStyle>;
  /** Media container style, caller-provided. */
  mediaStyle?: StyleProp<ViewStyle>;
  /** Actions container style, caller-provided. */
  actionsStyle?: StyleProp<ViewStyle>;
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
  ref: CardProps["ref"],
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

export function Card({
  header,
  media,
  children,
  actions,
  accessibilityLabel,
  testID,
  style,
  headerStyle,
  mediaStyle,
  actionsStyle,
  ref,
}: CardProps): React.JSX.Element {
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
      {header !== undefined ? <View style={headerStyle}>{header}</View> : null}
      {media !== undefined ? <View style={mediaStyle}>{media}</View> : null}
      {children}
      {actions !== undefined ? (
        <View style={actionsStyle}>{actions}</View>
      ) : null}
    </View>
  );
}
