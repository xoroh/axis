import {
  ActivityIndicator,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Loader — an unstyled busy indicator.
 *
 * The host `ActivityIndicator` with an announced busy state and
 * nothing else. Size/color/animation are the caller's (`size`,
 * `color` passthrough) — this component owns presence + announcement.
 */

export type LoaderProps = {
  /** Indicator size. Passed straight through. */
  size?: number | "small" | "large";
  /** Indicator color. Passed straight through. */
  color?: string;
  /** Accessible name source (e.g. "Loading results"). */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
};

export function Loader({
  size,
  color,
  accessibilityLabel,
  testID,
  style,
}: LoaderProps): React.JSX.Element {
  return (
    <View
      accessible
      accessibilityState={{ busy: true }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
