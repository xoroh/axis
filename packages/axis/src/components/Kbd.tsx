import type { ReactNode } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";

/**
 * Kbd — an unstyled key-hint display.
 *
 * A `Text` carrying caller key names ("⌘K", "Esc"). Inline semantics
 * only: no keyboard handling, no shortcuts engine — those belong to
 * the control being documented, never here.
 */

export type KbdProps = {
  /** Key names to display. */
  children?: ReactNode;
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
};

export function Kbd({ children, testID, style }: KbdProps): React.JSX.Element {
  return (
    <Text testID={testID} style={style}>
      {children}
    </Text>
  );
}
