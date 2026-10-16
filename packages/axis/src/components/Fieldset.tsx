import type { ReactNode } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Fieldset — an unstyled group of related fields with a legend.
 *
 * Structure only: an optional legend `Text` plus caller children. No
 * invented group role (React Native defines none for this) — the
 * legend is read as text. Validation and disabled-group semantics
 * belong to the caller, never here.
 */

export type FieldsetProps = {
  /** Legend content rendered above the group. */
  legend?: ReactNode;
  /** The grouped fields. */
  children?: ReactNode;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Legend text style, caller-provided. */
  legendStyle?: StyleProp<TextStyle>;
};

export function Fieldset({
  legend,
  children,
  testID,
  style,
  legendStyle,
}: FieldsetProps): React.JSX.Element {
  return (
    <View testID={testID} style={style}>
      {legend !== undefined ? <Text style={legendStyle}>{legend}</Text> : null}
      {children}
    </View>
  );
}
