import {
  type ElementRef,
  type Ref,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PanResponder,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Slider — an unstyled drag value control.
 *
 * Structure only: a track `View` carrying the slider role and value,
 * with a fill `View` (data-driven width percentage) and a thumb
 * `View` the caller styles. No default visuals — every visual value
 * (`style`, `trackStyle`, `fillStyle`, `thumbStyle`) is
 * caller-provided. State follows the `useControllableState` pattern:
 * `value` (+ `onValueChange`) for controlled use, `defaultValue` for
 * uncontrolled. Dragging is handled with `PanResponder` (no
 * Reanimated/Gesture Handler dependency); equivalent keyboard and
 * screen-reader control is exposed through the `increment` /
 * `decrement` accessibility actions.
 */

export type SliderProps = {
  /** Controlled value. Wins over `defaultValue` when defined. */
  value?: number;
  /** Uncontrolled initial value. Default `min`. */
  defaultValue?: number;
  /** Fires with the next snapped + clamped value on every commit. */
  onValueChange?: (value: number) => void;
  /** Range lower bound. Default `0`. */
  min?: number;
  /** Range upper bound. Default `100`. `min > max` collapses the range to the single point `min` (no throw). */
  max?: number;
  /** Snap increment. Default `0` (continuous). Values `<= 0` are continuous. */
  step?: number;
  /** Terminal: no gesture commits, no action commits, no callbacks, announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Track container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Track container style, caller-provided (merged over `style`). */
  trackStyle?: StyleProp<ViewStyle>;
  /** Fill bar style, caller-provided (merged over the data-driven width). */
  fillStyle?: StyleProp<ViewStyle>;
  /** Thumb indicator style, caller-provided. */
  thumbStyle?: StyleProp<ViewStyle>;
  /** Forwarded to the track container host element. */
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
  ref: SliderProps["ref"],
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

export function Slider({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 0,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  trackStyle,
  fillStyle,
  thumbStyle,
  ref,
}: SliderProps): React.JSX.Element {
  // A degenerate `min > max` range collapses to the single point `min`
  // — announced and rendered as such, never thrown over.
  const lo = min;
  const hi = max > min ? max : min;
  const range = hi - lo;

  const [rawValue, setValue] = useControllableState<number>(
    value,
    defaultValue ?? lo,
    onValueChange,
  );

  // Every commit clamps into `[lo, hi]` and, when `step > 0`, snaps to
  // the nearest `lo + k * step` (re-clamped so the snap cannot escape
  // the bounds when the range is not a multiple of the step).
  const commit = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, lo), hi);
      const snapped =
        step > 0 ? lo + Math.round((clamped - lo) / step) * step : clamped;
      setValue(Math.min(Math.max(snapped, lo), hi));
    },
    [hi, lo, setValue, step],
  );

  const clamped = Math.min(Math.max(rawValue ?? lo, lo), hi);

  // The live value mirrored for the gesture callbacks (which outlive
  // any single render), plus the drag anchor captured on grant so a
  // move maps cumulative `dx` from the touch-down value.
  const valueRef = useRef(clamped);
  valueRef.current = clamped;
  const anchorRef = useRef(clamped);

  // Measured track width in dp; the gesture maps `dx` pixels onto
  // this width, so no commit happens before the first layout.
  const [trackWidth, setTrackWidth] = useState(0);
  const onLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      setTrackWidth(event.nativeEvent.layout.width);
    },
    [],
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => {
          if (disabled) return;
          anchorRef.current = valueRef.current;
        },
        onPanResponderMove: (_event: unknown, gestureState: { dx: number }) => {
          if (disabled || trackWidth <= 0 || range <= 0) return;
          commit(anchorRef.current + (gestureState.dx / trackWidth) * range);
        },
        onPanResponderRelease: (
          _event: unknown,
          gestureState: { dx: number },
        ) => {
          if (disabled || trackWidth <= 0 || range <= 0) return;
          commit(anchorRef.current + (gestureState.dx / trackWidth) * range);
        },
        onPanResponderTerminate: (
          _event: unknown,
          gestureState: { dx: number },
        ) => {
          if (disabled || trackWidth <= 0 || range <= 0) return;
          commit(anchorRef.current + (gestureState.dx / trackWidth) * range);
        },
      }),
    [commit, disabled, range, trackWidth],
  );

  // Keyboard / screen-reader stepping: `step` when snapped, otherwise
  // one twentieth of the range (a no-op on a collapsed range).
  const stepAmount = step > 0 ? step : range / 20;
  const onAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (disabled) return;
      const { actionName } = event.nativeEvent;
      if (actionName === "increment") {
        commit(clamped + stepAmount);
      } else if (actionName === "decrement") {
        commit(clamped - stepAmount);
      }
    },
    [clamped, commit, disabled, stepAmount],
  );

  const percent = range > 0 ? ((clamped - lo) / range) * 100 : 0;

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <View
      ref={setHostRef}
      // A plain View is not an accessibility element, so without this
      // the role and value below would never reach assistive tech (or
      // the role queries that prove it).
      accessible
      accessibilityRole="slider"
      accessibilityState={{ disabled }}
      accessibilityValue={{ min: lo, max: hi, now: clamped }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={onAccessibilityAction}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onLayout={onLayout}
      style={[style, trackStyle]}
      {...pan.panHandlers}
    >
      <View style={[{ width: `${percent}%` }, fillStyle]} />
      <View style={thumbStyle} />
    </View>
  );
}
