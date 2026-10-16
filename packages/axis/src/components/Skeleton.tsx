import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Skeleton — an unstyled loading placeholder.
 *
 * A silent container reserving layout space while content loads. No
 * shimmer, no pulse, no timing — placeholder motion is caller-owned
 * animation, not structure. Hidden from assistive tech
 * (`accessible={false}`): a placeholder announces nothing.
 */

export type SkeletonProps = {
  testID?: string;
  /** Placeholder style (dimensions live here), caller-provided. */
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ testID, style }: SkeletonProps): React.JSX.Element {
  return <View accessible={false} testID={testID} style={style} />;
}
