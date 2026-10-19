import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PanResponder,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import {
  clampSliderValue,
  nearestSliderThumbIndex,
  normalizeSliderValues,
  resolveSliderCommit,
  type SliderOrientation,
  sliderRatioFromLocation,
  sliderValueFromRatio,
  sliderValuePercent,
} from "../slider";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { useDirection } from "./DirectionProvider";

/**
 * Slider — a range input with compound parts.
 *
 * Structure only: a `SliderRoot` owning the value domain, with
 * `SliderLabel` (accessible name text) and `SliderValue` (current
 * value text) composed around a `SliderControl` (the interactive
 * surface: drag gestures, track-press jumps, measurement)
 * containing a `SliderTrack` (the range container),
 * `SliderIndicator` (the data-driven fill from the lowest to the
 * highest value), and one `SliderThumb` per value (adjustable,
 * increment/decrement actions). No default visuals — every visual
 * value is caller-provided; only state-driven geometry (fill
 * width, thumb position) is structural. State follows the
 * `useControllableState` pattern: `value` (+ `onValueChange`) for
 * controlled use, `defaultValue` for uncontrolled (default
 * `[min]`).
 *
 * Single value or range: `value` accepts a number or an array.
 * One thumb per array entry (`index` selects); single values
 * behave as a one-entry range. Commits clamp into `[min, max]`,
 * snap to `step` when `step > 0` (continuous otherwise — the Axis
 * default `0`, a documented deviation from Base UI's `1`), and
 * enforce the `minStepsBetweenValues` gap between range entries
 * (the dragged thumb stops at the gap; no push cascade).
 * Dragging reports through `onValueChange`; release, track-press
 * settle, and accessibility actions additionally report through
 * `onValueCommitted`.
 *
 * No animation: the fill tracks state synchronously (the Dialog
 * precedent). No `loopFocus`/roving tabindex (no roving layer);
 * the thumbs are independently focusable adjustable elements.
 * `thumbAlignment` selects centering (`center`, default — the
 * thumb centers on the value point, half a thumb may overhang the
 * track ends) or edge pinning (`edge` — the thumb stays fully
 * inside the track, touching the correct edge at the bounds,
 * computed as `translate(-percent%)` with no measurement).
 */

export type SliderRootState = {
  /** Current values (clamped + snapped). */
  values: number[];
  /** Whether the slider is currently disabled. */
  disabled: boolean;
  /** Whether a drag is currently in flight. */
  dragging: boolean;
  /** Index of the active thumb. */
  activeThumbIndex: number;
  /** Reading direction of the track. Default `"horizontal"`. */
  orientation: SliderOrientation;
  /** Text direction from the nearest `DirectionProvider` (native locale fallback). */
  dir: "ltr" | "rtl";
  /** Range lower bound. */
  min: number;
  /** Range upper bound. */
  max: number;
  /** Snap increment (`<= 0` means continuous). */
  step: number;
  /** Large-step increment. Consumed by keyboard handling on web (Shift + arrows, PageUp/PageDown). */
  largeStep: number;
  /** Minimum gap between range values, in `step` units (raw units when `step <= 0`). */
  minStepsBetweenValues: number;
};

export type SliderLabelState = Record<string, never>;

export type SliderValueState = {
  /** Current values (clamped + snapped). */
  values: number[];
};

export type SliderControlState = {
  /** Whether the slider is currently disabled. */
  disabled: boolean;
  /** Whether a drag is currently in flight. */
  dragging: boolean;
  /** Reading direction of the track. */
  orientation: SliderOrientation;
};

export type SliderTrackState = Record<string, never>;

export type SliderIndicatorState = {
  /** Fill start as a track percentage. */
  from: number;
  /** Fill length as a track percentage. */
  length: number;
};

export type SliderThumbState = {
  /** This thumb's current value. */
  value: number;
  /** This thumb's position as a track percentage. */
  percent: number;
  /** This thumb's index. */
  index: number;
  /** Whether the slider is currently disabled. */
  disabled: boolean;
  /** Whether a drag is currently in flight. */
  dragging: boolean;
};

export type SliderRootProps = {
  /** Controlled value (single or range). Wins over `defaultValue` when defined. */
  value?: number | readonly number[];
  /** Uncontrolled initial value. Default `[min]`. */
  defaultValue?: number | readonly number[];
  /**
   * Fires with the next value on every commit. Reported in the same
   * shape: a number for a single value, an array for a range
   * (a one-element array stays an array).
   */
  onValueChange?: (value: number | readonly number[]) => void;
  /**
   * Fires with the committed value when a gesture ends (release /
   * terminate after a press), on track-press settle, and on every
   * accessibility action. Same shape as `onValueChange`.
   */
  onValueCommitted?: (value: number | readonly number[]) => void;
  /** Range lower bound. Default `0`. */
  min?: number;
  /** Range upper bound. Default `100`. `min > max` collapses the range to the single point `min` (no throw). */
  max?: number;
  /**
   * Snap increment. Default `0` (continuous; values `<= 0` are
   * continuous). Documented deviation from Base UI's default `1`:
   * Axis preserves continuous-by-default.
   */
  step?: number;
  /**
   * Large-step increment. Default `10` (Base UI parity). Consumed
   * by keyboard handling on web: Shift + arrows and PageUp/PageDown
   * move by `largeStep` (increment/decrement actions use `step`).
   */
  largeStep?: number;
  /**
   * Minimum gap between range values, in `step` units (raw value
   * units when `step <= 0`). Default `0`. The dragged thumb stops
   * at the gap instead of crossing or pushing its neighbour.
   */
  minStepsBetweenValues?: number;
  /**
   * Reading direction of the track. Default `"horizontal"`.
   * Vertical drags map track-bottom to `min` and track-top to `max`.
   */
  orientation?: SliderOrientation;
  /**
   * Thumb alignment against the control edge. Default `"center"`
   * (the thumb centers on the value point). `"edge"` pins the
   * thumb fully inside the track, touching the correct edge at
   * the bounds.
   */
  thumbAlignment?: "center" | "edge";
  /** Terminal: no gesture commits, no action commits, no callbacks, announced as disabled. */
  disabled?: boolean;
  testID?: string;
  /** Root container style: value or function of slider state. */
  style?: StateStyle<SliderRootState, StyleProp<ViewStyle>>;
  /** Slider content (`SliderLabel`, `SliderValue`, `SliderControl`). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<SliderRootState, SlotProps>;
  /** Forwarded to the root container host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SliderLabelProps = {
  testID?: string;
  /** Label text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Label content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). The label
   * carries no state, so the function form receives an empty state
   * object.
   */
  render?: RenderProp<SliderLabelState, SlotProps>;
};

export type SliderValueProps = {
  testID?: string;
  /** Value text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /**
   * Value content: a node, or a function of the current values for
   * caller formatting (no `Intl` layer — the Base UI
   * `getAriaValueText`/`locale`/`format` props are omitted as the
   * no-`Intl` adaptation).
   */
  children?: ReactNode | ((values: number[]) => ReactNode);
  /**
   * Element or function substitution (Base UI parity). The value
   * carries no interaction state; values travel in the props.
   */
  render?: RenderProp<SliderValueState, SlotProps>;
};

export type SliderControlProps = {
  testID?: string;
  /** Control container style: value or function of control state. */
  style?: StateStyle<SliderControlState, StyleProp<ViewStyle>>;
  /** Control content (`SliderTrack`). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Measurement and gesture wiring travel
   * in the props.
   */
  render?: RenderProp<SliderControlState, SlotProps>;
  /** Forwarded to the control host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SliderTrackProps = {
  testID?: string;
  /** Track container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Track content (`SliderIndicator`, `SliderThumb`s). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). The track
   * carries no state, so the function form receives an empty state
   * object.
   */
  render?: RenderProp<SliderTrackState, SlotProps>;
};

export type SliderIndicatorProps = {
  testID?: string;
  /** Fill style, caller-provided (merged under the fill geometry). */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity). The fill
   * geometry travels in the `style` prop; the function form
   * receives the indicator state.
   */
  render?: RenderProp<SliderIndicatorState, SlotProps>;
};

export type SliderThumbProps = {
  /**
   * Thumb index into the values array. Default `0`. Out-of-range
   * indexes read the nearest value (single values behave as a
   * one-entry range).
   */
  index?: number;
  /** Accessible name source (e.g. "Minimum price" on a range thumb). */
  accessibilityLabel?: string;
  testID?: string;
  /** Thumb style, caller-provided (merged over the state-driven position). */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Role, value, actions, and the commit
   * wiring travel in the props.
   */
  render?: RenderProp<SliderThumbState, SlotProps>;
  /** Forwarded to the thumb host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

type SliderDisclosure = {
  values: number[];
  disabled: boolean;
  dragging: boolean;
  activeThumbIndex: number;
  orientation: SliderOrientation;
  dir: "ltr" | "rtl";
  min: number;
  max: number;
  step: number;
  largeStep: number;
  minStepsBetweenValues: number;
  thumbAlignment: "center" | "edge";
  commit: (index: number, next: number, isCommit: boolean) => void;
  finishCommit: () => void;
  setDragging: (dragging: boolean) => void;
  setActiveThumbIndex: (index: number) => void;
};

/**
 * Shared slider domain. Internal to this module (not exported):
 * parts must render inside a `SliderRoot` to participate; outside
 * one, track, indicator, and thumbs render nothing (a fill without
 * a range is meaningless).
 */
const SliderDisclosureContext = createContext<SliderDisclosure | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignViewRef(
  ref: Ref<ElementRef<typeof View>> | undefined,
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

function toShape(
  values: number[],
  wasArray: boolean,
): number | readonly number[] {
  if (!wasArray && values.length === 1) return values[0] as number;
  return values;
}

export function SliderRoot({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 0,
  largeStep = 10,
  minStepsBetweenValues = 0,
  orientation = "horizontal",
  thumbAlignment = "center",
  disabled = false,
  testID,
  onValueChange,
  onValueCommitted,
  style,
  children,
  render,
  ref,
}: SliderRootProps): React.ReactNode {
  const normalizedDefault = useMemo(
    () =>
      defaultValue === undefined
        ? [min]
        : normalizeSliderValues(defaultValue, min, max),
    [defaultValue, min, max],
  );
  const wasArray = Array.isArray(value ?? defaultValue);
  const [rawValues, setRawValues] = useControllableState<number[]>(
    value === undefined ? undefined : normalizeSliderValues(value, min, max),
    normalizedDefault,
    (next) => onValueChange?.(toShape(next, wasArray)),
  );
  const values = rawValues ?? [min];

  const [dragging, setDragging] = useState(false);
  const [activeThumbIndex, setActiveThumbIndex] = useState(0);
  // Base UI API: direction comes from the nearest
  // `DirectionProvider`, falling back to the native locale
  // (`I18nManager.isRTL`) with no provider — never a per-part prop.
  const dir = useDirection();

  const commit = useCallback(
    (index: number, next: number, isCommit: boolean) => {
      if (disabled) return;
      const updated = resolveSliderCommit(values, index, next, {
        min,
        max,
        step,
        minStepsBetweenValues,
      });
      const changed =
        updated.length !== values.length ||
        updated.some((v, i) => v !== values[i]);
      if (changed) {
        setRawValues(updated);
      }
      if (isCommit) {
        onValueCommitted?.(toShape(changed ? updated : values, wasArray));
      }
    },
    [
      disabled,
      max,
      min,
      minStepsBetweenValues,
      onValueCommitted,
      setRawValues,
      step,
      values,
      wasArray,
    ],
  );

  const finishCommit = useCallback(() => {
    if (disabled) return;
    onValueCommitted?.(toShape(values, wasArray));
  }, [disabled, onValueCommitted, values, wasArray]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignViewRef(ref, node);
    },
    [ref],
  );

  const state: SliderRootState = {
    values,
    disabled,
    dragging,
    activeThumbIndex,
    orientation,
    dir,
    min,
    max,
    step,
    largeStep,
    minStepsBetweenValues,
  };
  const disclosure = useMemo<SliderDisclosure>(
    () => ({
      values,
      disabled,
      dragging,
      activeThumbIndex,
      orientation,
      dir,
      min,
      max,
      step,
      largeStep,
      minStepsBetweenValues,
      thumbAlignment,
      commit,
      finishCommit,
      setDragging,
      setActiveThumbIndex,
    }),
    [
      values,
      disabled,
      dragging,
      activeThumbIndex,
      orientation,
      dir,
      min,
      max,
      step,
      largeStep,
      minStepsBetweenValues,
      thumbAlignment,
      commit,
      finishCommit,
    ],
  );

  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setHostRef} testID={testID} style={resolveStyle(style, state)}>
      <SliderDisclosureContext.Provider value={disclosure}>
        {children}
      </SliderDisclosureContext.Provider>
    </View>
  );
}

export function SliderLabel({
  testID,
  style,
  children,
  render,
}: SliderLabelProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <Text testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function SliderValue({
  testID,
  style,
  children,
  render,
}: SliderValueProps): React.ReactNode {
  const disclosure = useContext(SliderDisclosureContext);
  if (!disclosure) return null;
  const content =
    typeof children === "function" ? children(disclosure.values) : children;
  const state: SliderValueState = { values: disclosure.values };
  const substituted = resolveRender(
    render,
    { testID, style, children: content } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Text testID={testID} style={style}>
      {content}
    </Text>
  );
}

export function SliderControl({
  testID,
  style,
  children,
  render,
  ref,
}: SliderControlProps): React.ReactNode {
  const disclosure = useContext(SliderDisclosureContext);
  const anchorRef = useRef<readonly number[] | null>(null);
  const [extent, setExtent] = useState({ width: 0, height: 0 });

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignViewRef(ref, node);
    },
    [ref],
  );

  const onLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) setExtent({ width, height });
    },
    [],
  );

  const orientation = disclosure?.orientation ?? "horizontal";
  const state: SliderControlState = {
    disabled: disclosure?.disabled ?? false,
    dragging: disclosure?.dragging ?? false,
    orientation,
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !(disclosure?.disabled ?? true),
        onMoveShouldSetPanResponder: () => !(disclosure?.disabled ?? true),
        onPanResponderGrant: (event, _gestureState) => {
          const d = disclosure;
          if (!d || d.disabled) return;
          const horizontal = d.orientation === "horizontal";
          const size = horizontal ? extent.width : extent.height;
          // Track-press jump (Base UI parity): the nearest thumb
          // moves to the touch point. `locationX/Y` ride on the
          // touch event; without a measured track there is nothing
          // to map onto, so the gesture only arms the anchor (and
          // drags stay relative to the touch-down value).
          const location = horizontal
            ? event?.nativeEvent?.locationX
            : event?.nativeEvent?.locationY;
          anchorRef.current = [...d.values];
          d.setDragging(true);
          if (typeof location === "number" && size > 0 && d.values.length > 0) {
            const ratio = sliderRatioFromLocation(
              location,
              size,
              d.orientation,
            );
            const target = clampSliderValue(
              sliderValueFromRatio(ratio, d.min, d.max),
              d.min,
              d.max,
            );
            const index = nearestSliderThumbIndex(d.values, target);
            d.setActiveThumbIndex(index);
            anchorRef.current = [...d.values];
            d.commit(index, target, false);
            anchorRef.current = [...d.values];
          }
        },
        onPanResponderMove: (_event, gestureState) => {
          const d = disclosure;
          if (!d || d.disabled) return;
          const horizontal = d.orientation === "horizontal";
          const size = horizontal ? extent.width : extent.height;
          const anchor = anchorRef.current;
          if (!(size > 0) || !anchor || d.values.length === 0) return;
          const range = d.max - d.min;
          const index = Math.min(d.activeThumbIndex, anchor.length - 1);
          const delta = horizontal ? gestureState.dx : -gestureState.dy;
          d.commit(
            index,
            (anchor[index] ?? d.min) + (delta / size) * (range > 0 ? range : 0),
            false,
          );
        },
        onPanResponderRelease: () => {
          const d = disclosure;
          if (!d || d.disabled) return;
          anchorRef.current = null;
          d.setDragging(false);
          d.finishCommit();
        },
        onPanResponderTerminate: () => {
          const d = disclosure;
          if (!d || d.disabled) return;
          anchorRef.current = null;
          d.setDragging(false);
          d.finishCommit();
        },
      }),
    // The responder reads live disclosure through closure capture per
    // render; identity churn is harmless (the host re-attaches).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disclosure, extent],
  );

  if (!disclosure) return null;
  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      children,
      onLayout,
      ref: setHostRef,
      ...pan.panHandlers,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      testID={testID}
      style={resolveStyle(style, state)}
      onLayout={onLayout}
      {...pan.panHandlers}
    >
      {children}
    </View>
  );
}

export function SliderTrack({
  testID,
  style,
  children,
  render,
}: SliderTrackProps): React.ReactNode {
  const disclosure = useContext(SliderDisclosureContext);
  if (!disclosure) return null;
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}

export function SliderIndicator({
  testID,
  style,
  render,
}: SliderIndicatorProps): React.ReactNode {
  const disclosure = useContext(SliderDisclosureContext);
  if (!disclosure) return null;
  const lo =
    disclosure.values.length > 1
      ? Math.min(...disclosure.values)
      : disclosure.min;
  const from = disclosure.values.length
    ? sliderValuePercent(lo, disclosure.min, disclosure.max)
    : 0;
  const to = disclosure.values.length
    ? sliderValuePercent(
        Math.max(...disclosure.values),
        disclosure.min,
        disclosure.max,
      )
    : 0;
  const length = Math.max(0, to - from);
  const state: SliderIndicatorState = { from, length };
  // Structural fill geometry: the caller style merges over it and
  // owns every visual value (color, radius, track height).
  // Structural fill geometry: absolute overlay inside the track
  // (the track is relatively positioned by default), merged under
  // caller style. The caller owns every visual value (color, radius,
  // track height); without an explicit height the track would show
  // no fill, which is a caller styling decision, not a silent default.
  const geometry: StyleProp<ViewStyle> =
    disclosure.orientation === "horizontal"
      ? {
          position: "absolute",
          left: `${from}%`,
          width: `${length}%`,
          top: 0,
          bottom: 0,
        }
      : {
          position: "absolute",
          bottom: `${from}%`,
          height: `${length}%`,
          left: 0,
          right: 0,
        };
  const substituted = resolveRender(
    render,
    {
      testID,
      style: [geometry, style],
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return <View testID={testID} style={[geometry, style]} />;
}

export function SliderThumb({
  index = 0,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: SliderThumbProps): React.ReactNode {
  const disclosure = useContext(SliderDisclosureContext);
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignViewRef(ref, node);
    },
    [ref],
  );
  if (!disclosure) return null;

  const at = Math.min(Math.max(index, 0), disclosure.values.length - 1);
  const thumbValue = disclosure.values[at] ?? disclosure.min;
  // Degenerate `min > max` collapses to the single point `min` —
  // announced as such (the pre-parity contract), never thrown.
  const hi = disclosure.max > disclosure.min ? disclosure.max : disclosure.min;
  const percent = sliderValuePercent(
    thumbValue,
    disclosure.min,
    disclosure.max,
  );
  const state: SliderThumbState = {
    value: thumbValue,
    percent,
    index: at,
    disabled: disclosure.disabled,
    dragging: disclosure.dragging,
  };

  const stepAmount =
    disclosure.step > 0
      ? disclosure.step
      : (disclosure.max - disclosure.min) / 20 || 0;

  const onAccessibilityAction = ({
    nativeEvent,
  }: {
    nativeEvent: { actionName: string };
  }) => {
    if (disclosure.disabled) return;
    const { actionName } = nativeEvent;
    if (actionName === "increment") {
      disclosure.setActiveThumbIndex(at);
      disclosure.commit(at, thumbValue + stepAmount, true);
    } else if (actionName === "decrement") {
      disclosure.setActiveThumbIndex(at);
      disclosure.commit(at, thumbValue - stepAmount, true);
    }
  };

  // Keyboard (web): RN passes `onKeyDown` through to the DOM host and
  // native ignores the unknown prop. Matches Base UI: arrows move by
  // `step`, Shift + arrows and PageUp/PageDown move by `largeStep`,
  // Home jumps to `min` and End to `max`. Arrows flip for RTL
  // horizontals (vertical is unaffected). Every key commit reports
  // through `onValueCommitted`, like Base UI's commit event.
  const onKeyDown = (event: {
    key?: string;
    shiftKey?: boolean;
    preventDefault?: () => void;
    nativeEvent?: { key?: string };
  }) => {
    if (disclosure.disabled) return;
    const key = event.key ?? event.nativeEvent?.key;
    if (typeof key !== "string") return;
    const horizontal = disclosure.orientation === "horizontal";
    const rtl = disclosure.dir === "rtl" && horizontal;
    const large = disclosure.largeStep;
    const forward = rtl ? -1 : 1;
    let delta: number | null = null;
    if (key === "ArrowRight") delta = forward * stepAmount;
    else if (key === "ArrowLeft") delta = -forward * stepAmount;
    else if (key === "ArrowUp") delta = stepAmount;
    else if (key === "ArrowDown") delta = -stepAmount;
    else if (key === "PageUp") delta = large;
    else if (key === "PageDown") delta = -large;
    else if (key === "Home" || key === "End") {
      disclosure.setActiveThumbIndex(at);
      disclosure.commit(
        at,
        key === "Home" ? disclosure.min : disclosure.max,
        true,
      );
      event.preventDefault?.();
      return;
    } else {
      return;
    }
    if (
      event.shiftKey &&
      (key === "ArrowRight" ||
        key === "ArrowLeft" ||
        key === "ArrowUp" ||
        key === "ArrowDown")
    ) {
      delta = (delta === null || delta === 0 ? 1 : Math.sign(delta)) * large;
    }
    if (delta === null || delta === 0) return;
    disclosure.setActiveThumbIndex(at);
    disclosure.commit(at, thumbValue + (delta ?? 0), true);
    event.preventDefault?.();
  };

  // Structural thumb geometry: the caller style merges over it and
  // owns every visual value (size, color, shape). Percent translates
  // are valid RN (`translateX: `${number}%``); the cross-axis 50%
  // centers the thumb on the track without measuring either box.
  const centerX = "-50%" as const;
  const centerY = "-50%" as const;
  const edgeX = `-${percent}%` as const;
  // Vertical fills bottom-up: the thumb's distance from the top is
  // the complement, so edge alignment mirrors it too.
  const edgeY = `-${100 - percent}%` as const;
  const position: StyleProp<ViewStyle> =
    disclosure.orientation === "horizontal"
      ? {
          left: `${percent}%`,
          top: "50%",
          transform: [
            {
              translateX:
                disclosure.thumbAlignment === "edge" ? edgeX : centerX,
            },
            { translateY: centerY },
          ],
        }
      : {
          // Vertical fills bottom-up, so the thumb's distance from the top
          // is the complement of its percentage.
          top: `${100 - percent}%`,
          left: "50%",
          transform: [
            {
              translateY:
                disclosure.thumbAlignment === "edge" ? edgeY : centerY,
            },
            { translateX: centerX },
          ],
        };

  const hostProps = {
    accessible: true,
    accessibilityRole: "adjustable" as const,
    accessibilityValue: {
      min: disclosure.min,
      max: hi,
      now: thumbValue,
    },
    // RN has no typed `aria-orientation` key: the host passes unknown
    // `aria-*` props through on web (verified against the installed
    // RN `ViewAccessibility` union, which stops at `aria-valuetext`),
    // and native ignores the unknown prop. Thumb orientation is
    // horizontal/vertical, matching the track.
    ...{ "aria-orientation": disclosure.orientation },
    accessibilityState: { disabled: disclosure.disabled },
    accessibilityActions: [{ name: "increment" }, { name: "decrement" }],
    onAccessibilityAction,
    onKeyDown,
    accessibilityLabel,
    testID,
    disabled: disclosure.disabled,
    style: [
      { position: "absolute" as const },
      position,
      resolveStyle(style, state),
    ],
    ref: setHostRef,
  } satisfies SlotProps;

  const substituted = resolveRender(render, hostProps, state);
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessible
      accessibilityRole="adjustable"
      accessibilityValue={{
        min: disclosure.min,
        max: hi,
        now: thumbValue,
      }}
      {...{ "aria-orientation": disclosure.orientation }}
      accessibilityState={{ disabled: disclosure.disabled }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={onAccessibilityAction}
      // RN passes onKeyDown through on web; native ignores the unknown prop.
      onKeyDown={onKeyDown}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        { position: "absolute" as const },
        position,
        resolveStyle(style, state),
      ]}
    />
  );
}
