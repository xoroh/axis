import { type ElementRef, type Ref, useCallback, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Avatar — an unstyled identity image with fallback.
 *
 * Shows the `Image` when `source` is provided and loads; otherwise —
 * or after a load error — shows caller `children` (initials, icon)
 * in a fallback `View`. Identity state, not decoration: the image
 * carries the image role and label, the fallback is plain content.
 * Sizing, shape, and placeholder art are the caller's.
 */

export type AvatarProps = {
  /** Image source. Absence (or load failure) shows the fallback. */
  source?: ImageSourcePropType;
  /** Fallback content (initials, icon) shown without a loaded image. */
  children?: React.ReactNode;
  /** Accessible name source (e.g. the person's name). */
  accessibilityLabel?: string;
  testID?: string;
  /** Image style, caller-provided. */
  style?: StyleProp<ImageStyle>;
  /** Fallback container style, caller-provided. */
  fallbackStyle?: StyleProp<ViewStyle>;
  /**
   * Forwarded to whichever host renders (the `Image`, or the
   * fallback `View`). Both branches resolve it.
   */
  ref?: Ref<ElementRef<typeof Image> | ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: AvatarProps["ref"],
  value: ElementRef<typeof Image> | ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    (ref as (value: unknown) => void)(value);
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

export function Avatar({
  source,
  children,
  accessibilityLabel,
  testID,
  style,
  fallbackStyle,
  ref,
}: AvatarProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  // Stable identity so the host element is not detached and re-attached
  // on every render.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Image> | ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  if (source && !failed) {
    return (
      <Image
        ref={setHostRef}
        source={source}
        // Explicit: a labelled image must be an accessibility element
        // or its role and name never reach assistive tech.
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={style}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View
      ref={setHostRef}
      testID={testID}
      style={fallbackStyle}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}
