import { useState } from "react";
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
};

export function Avatar({
  source,
  children,
  accessibilityLabel,
  testID,
  style,
  fallbackStyle,
}: AvatarProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  if (source && !failed) {
    return (
      <Image
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
      testID={testID}
      style={fallbackStyle}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}
