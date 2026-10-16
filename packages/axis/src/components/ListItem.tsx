import type { ReactNode } from "react";
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
};

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
}: ListItemProps): React.JSX.Element {
  if (onPress === undefined) {
    return (
      <View
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
