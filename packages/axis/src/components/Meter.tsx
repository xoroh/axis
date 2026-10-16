import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Meter — an unstyled gauge readout.
 *
 * Like `Progress` but for rated capacity rather than task progress:
 * a container carrying the meter role and value, with a data-driven
 * fill. No colors, no ticks, no scale chrome — measurement display
 * only.
 */

export type MeterProps = {
  /** Current value. Default `0`. */
  value?: number;
  /** Minimum value. Default `0`. */
  min?: number;
  /** Maximum value. Default `100`. */
  max?: number;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Fill style, caller-provided (merged under the fill width). */
  fillStyle?: StyleProp<ViewStyle>;
};

export function Meter({
  value = 0,
  min = 0,
  max = 100,
  accessibilityLabel,
  testID,
  style,
  fillStyle,
}: MeterProps): React.JSX.Element {
  const range = max - min;
  const clamped = range > 0 ? Math.min(Math.max(value, min), max) : min;
  const percent = range > 0 ? ((clamped - min) / range) * 100 : 0;
  return (
    <View
      accessible
      accessibilityRole="meter"
      accessibilityValue={{ min, max, now: clamped }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      <View style={[{ width: `${percent}%` }, fillStyle]} />
    </View>
  );
}
