import { type ElementRef, type Ref, useCallback } from "react";
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
  /** Forwarded to the container `View` host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: MeterProps["ref"],
  value: ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // A frozen ref object cannot take the write — leave it alone
      // rather than failing the render over it.
    }
  }
}

export function Meter({
  value = 0,
  min = 0,
  max = 100,
  accessibilityLabel,
  testID,
  style,
  fillStyle,
  ref,
}: MeterProps): React.JSX.Element {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const range = max - min;
  const clamped = range > 0 ? Math.min(Math.max(value, min), max) : min;
  const percent = range > 0 ? ((clamped - min) / range) * 100 : 0;
  return (
    <View
      ref={setHostRef}
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
