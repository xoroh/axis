import type { ReactNode } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Field — an unstyled label/control/error row.
 *
 * Structure only: an optional label `Text`, the caller-provided
 * control (`children`), and an optional error `Text` announced
 * politely when present. No validation logic lives here — validity
 * is the caller's state, expressed by passing `error`. Control-id
 * wiring beyond plain composition is deferred until a consumer
 * demonstrates the need.
 */

export type FieldProps = {
  /** Label content rendered above the control. */
  label?: ReactNode;
  /** The control element. */
  children?: ReactNode;
  /** Error content; rendered only when provided. */
  error?: ReactNode;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Label text style, caller-provided. */
  labelStyle?: StyleProp<TextStyle>;
  /** Error text style, caller-provided. */
  errorStyle?: StyleProp<TextStyle>;
};

export function Field({
  label,
  children,
  error,
  testID,
  style,
  labelStyle,
  errorStyle,
}: FieldProps): React.JSX.Element {
  return (
    <View testID={testID} style={style}>
      {label !== undefined ? <Text style={labelStyle}>{label}</Text> : null}
      {children}
      {error !== undefined ? (
        <Text accessibilityLiveRegion="polite" style={errorStyle}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
