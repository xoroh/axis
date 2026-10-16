import type { ReactNode } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Badge — an unstyled count/dot adornment.
 *
 * Structure only: a container `View` with caller content (usually a
 * short `Text`). No pill shape, no colors, no positioning — adornment
 * layout belongs to the caller. Read as plain content; no invented
 * role.
 */

export type BadgeProps = {
  /** Adornment content (count, dot, status mark). */
  children?: ReactNode;
  /** Accessible name source (e.g. "3 unread"). */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Content text style, caller-provided. */
  textStyle?: StyleProp<TextStyle>;
};

export function Badge({
  children,
  accessibilityLabel,
  testID,
  style,
  textStyle,
}: BadgeProps): React.JSX.Element {
  return (
    <View accessibilityLabel={accessibilityLabel} testID={testID} style={style}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
}
