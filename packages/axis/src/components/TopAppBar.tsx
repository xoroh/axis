import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * TopAppBar — an unstyled top application header.
 *
 * A `header`-role container with a leading slot (navigation icon),
 * a title, and a trailing actions slot. App chrome, not app content:
 * the bar carries no navigation behavior itself (screens and
 * selection live in `NavigationMenu`/`NavigationBar` consumers), no
 * scroll elevation, no menu handling — those are design-system and
 * shell decisions. Leading and actions slots render caller nodes
 * as-is (caller-owned pressables stay independently operable).
 * The title is required: a header without one is a `Toolbar`.
 */

export type TopAppBarProps = {
  /** Bar title (required — a header without one is a `Toolbar`). */
  title: string;
  /** Leading slot (navigation icon). Caller-owned. */
  leading?: ReactNode;
  /** Trailing actions slot. Caller-owned. */
  actions?: ReactNode;
  /** Accessible name source. Without one the title is read. */
  accessibilityLabel?: string;
  testID?: string;
  /** Bar container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Title text style, caller-provided. */
  titleStyle?: StyleProp<TextStyle>;
  /** Forwarded to the bar container `View`. */
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
  ref: TopAppBarProps["ref"],
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

export function TopAppBar({
  title,
  leading,
  actions,
  accessibilityLabel,
  testID,
  style,
  titleStyle,
  ref,
}: TopAppBarProps): React.JSX.Element {
  // Stable identity so the host element is not detached and re-attached
  // on every render.
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
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      style={style}
    >
      {leading}
      <Text style={titleStyle}>{title}</Text>
      {actions}
    </View>
  );
}
