import { type ElementRef, type Ref, useCallback } from "react";
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
  ref: ProgressProps["ref"],
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

export function Progress({
  value = 0,
  max = 100,
  min = 0,
  indeterminate = false,
  accessibilityLabel,
  testID,
  style,
  barStyle,
  ref,
}: ProgressProps): React.JSX.Element {
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
