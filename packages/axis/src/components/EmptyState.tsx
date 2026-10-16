import type { ReactNode } from "react";
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
};

export function EmptyState({
  title,
  description,
  action,
  accessibilityLabel,
  testID,
  style,
  titleStyle,
  descriptionStyle,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View accessibilityLabel={accessibilityLabel} testID={testID} style={style}>
      {title !== undefined ? <Text style={titleStyle}>{title}</Text> : null}
      {description !== undefined ? (
        <Text style={descriptionStyle}>{description}</Text>
      ) : null}
      {action}
    </View>
  );
}
