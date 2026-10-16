import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Progress — an unstyled determinate/indeterminate progress indicator.
 *
 * Structure only: an outer `View` carrying the progressbar role and
 * value, with an inner bar whose width is the data-driven fill
 * percentage merged under caller `barStyle`. No colors, no animation:
 * indeterminate is announced state, motion belongs to the caller.
 * Values clamp into `[min, max]`; `max <= min` disables the fill math
 * (announced without a value) rather than dividing by zero.
 */

export type ProgressProps = {
  /** Current value. Default `0`. */
  value?: number;
  /** Maximum value. Default `100`. */
  max?: number;
  /** Minimum value. Default `0`. */
  min?: number;
  /** When true, no value is announced — activity without measure. */
  indeterminate?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Outer container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Fill bar style, caller-provided (merged under the fill width). */
  barStyle?: StyleProp<ViewStyle>;
};

export function Progress({
  value = 0,
  max = 100,
  min = 0,
  indeterminate = false,
  accessibilityLabel,
  testID,
  style,
  barStyle,
}: ProgressProps): React.JSX.Element {
  const range = max - min;
  const clamped = range > 0 ? Math.min(Math.max(value, min), max) : min;
  const percent = range > 0 ? ((clamped - min) / range) * 100 : 0;
  return (
    <View
      // An unannounced progressbar is broken: a plain View is not an
      // accessibility element, so the role and value below would never
      // reach assistive tech (or the role queries that prove it).
      accessible
      accessibilityRole="progressbar"
      accessibilityState={{ busy: indeterminate || undefined }}
      accessibilityValue={
        indeterminate ? undefined : { min, max, now: clamped }
      }
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      <View style={[{ width: `${percent}%` }, barStyle]} />
    </View>
  );
}
