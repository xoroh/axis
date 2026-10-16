import type { ReactNode } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";

/**
 * Label — an unstyled text label for associating with a control.
 *
 * Structure only: a `Text` host carrying caller content. Association
 * with a control is by `nativeID`: set the same id on the label and
 * the control's `accessibilityLabelledBy`. Focus behavior belongs to
 * the control, never here. No role is declared — a label is read as
 * text; inventing a role the platform does not define would be a lie
 * a screen reader cannot cash.
 */

export type LabelProps = {
  /** Content of the label. */
  children?: ReactNode;
  /** Association id, mirrored on the control's `accessibilityLabelledBy`. */
  nativeID?: string;
  testID?: string;
  /** Label text style, caller-provided. */
  style?: StyleProp<TextStyle>;
};

export function Label({
  children,
  nativeID,
  testID,
  style,
}: LabelProps): React.JSX.Element {
  return (
    <Text nativeID={nativeID} testID={testID} style={style}>
      {children}
    </Text>
  );
}
