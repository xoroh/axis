import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Separator — an unstyled divider between content.
 *
 * A decorative `View`: `accessible={false}` because React Native
 * defines no separator role, and an unbacked role claim is worse than
 * honest silence. Direction is the caller's styling decision (a
 * horizontal rule vs a vertical rule differ only in `style`); this
 * component carries no orientation prop it cannot honor. All visuals
 * are caller-provided.
 */

export type SeparatorProps = {
  testID?: string;
  /** Divider style, caller-provided. */
  style?: StyleProp<ViewStyle>;
};

export function Separator({
  testID,
  style,
}: SeparatorProps): React.JSX.Element {
  return <View accessible={false} testID={testID} style={style} />;
}
