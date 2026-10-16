import type { ReactNode } from "react";
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
};

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
}: CardProps): React.JSX.Element {
  return (
    <View accessibilityLabel={accessibilityLabel} testID={testID} style={style}>
      {header !== undefined ? <View style={headerStyle}>{header}</View> : null}
      {media !== undefined ? <View style={mediaStyle}>{media}</View> : null}
      {children}
      {actions !== undefined ? (
        <View style={actionsStyle}>{actions}</View>
      ) : null}
    </View>
  );
}
