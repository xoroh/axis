import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
} from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";

/**
 * ProgressRoot — an unstyled determinate/indeterminate progress
 * indicator with track/indicator/label/value parts.
 *
 * Structure only: an outer `View` carrying the progressbar role and
 * value. No default visuals — the track/indicator pair is caller
 * composition (`ProgressTrack` + `ProgressIndicator`, which compute
 * the data-driven fill width from root state). No colors, no
 * animation: indeterminate is announced state, motion belongs to the
 * caller.
 * `value` follows Base UI exactly: a number is the determinate value,
 * `null` is indeterminate (no value announced, busy announced).
 * Values clamp into `[min, max]`; `max <= min` disables the fill math
 * (announced without a value) rather than dividing by zero.
 */

export type ProgressRootState = {
  /** Clamped value, or `undefined` while indeterminate. */
  value: number | undefined;
  /** Whether the indicator is currently indeterminate. */
  indeterminate: boolean;
};

export type ProgressTrackState = {
  /** Clamped value, or `undefined` while indeterminate. */
  value: number | undefined;
  /** Whether the indicator is currently indeterminate. */
  indeterminate: boolean;
};

export type ProgressTrackProps = {
  testID?: string;
  /** Track container style: value or function of progress state. */
  style?: StateStyle<ProgressTrackState, StyleProp<ViewStyle>>;
  /** Track content (`ProgressIndicator` composed by the caller). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ProgressTrackState, SlotProps>;
  /** Forwarded to the track `View` host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type ProgressIndicatorState = {
  /** Clamped value, or `undefined` while indeterminate. */
  value: number | undefined;
  /** Whether the indicator is currently indeterminate. */
  indeterminate: boolean;
};

export type ProgressIndicatorProps = {
  testID?: string;
  /** Fill style: value or function of progress state (merged under the fill width). */
  style?: StateStyle<ProgressIndicatorState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ProgressIndicatorState, SlotProps>;
  /** Forwarded to the fill `View` host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type ProgressLabelProps = {
  testID?: string;
  /** Label text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Label content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): static text
   * carries no state, so the function form receives an empty state
   * object (the `DialogTitle` precedent).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type ProgressValueProps = {
  testID?: string;
  /** Value text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /**
   * Value text override. Defaults to the current clamped value;
   * renders nothing while indeterminate (no value to show).
   */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ProgressIndicatorState, SlotProps>;
};

export type ProgressRootProps = {
  /**
   * Current value (Base UI exact semantics). A number is the
   * determinate value; `null` is indeterminate — no value announced,
   * busy announced. Default `0`.
   */
  value?: number | null;
  /** Maximum value. Default `100`. */
  max?: number;
  /** Minimum value. Default `0`. */
  min?: number;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Outer container style: value or function of progress state. */
  style?: StateStyle<ProgressRootState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ProgressRootState, SlotProps>;
  /** Progress content (`ProgressTrack` composed by the caller). */
  children?: ReactNode;
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
  ref: ProgressRootProps["ref"],
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

type ProgressDisclosure = {
  value: number | undefined;
  min: number;
  max: number;
  indeterminate: boolean;
};

/**
 * Shared progress state for the parts. Internal to this module (not
 * exported): parts must render inside a `ProgressRoot` to read state;
 * outside one the stateful parts render nothing and `ProgressLabel`
 * renders its static text.
 */
const ProgressDisclosureContext = createContext<ProgressDisclosure | null>(
  null,
);

function setPartRef(
  ref: Ref<ElementRef<typeof View> | null> | undefined,
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

export function ProgressRoot({
  value = 0,
  max = 100,
  min = 0,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
  children,
}: ProgressRootProps): React.ReactNode {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const indeterminate = value === null;
  const range = max - min;
  const numeric = indeterminate ? min : (value ?? min);
  const clamped = range > 0 ? Math.min(Math.max(numeric, min), max) : min;
  const state: ProgressRootState = {
    value: indeterminate ? undefined : clamped,
    indeterminate,
  };
  const disclosure: ProgressDisclosure = {
    value: indeterminate ? undefined : clamped,
    min,
    max,
    indeterminate,
  };
  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "progressbar",
      accessibilityState: { busy: indeterminate || undefined },
      accessibilityValue: indeterminate
        ? undefined
        : { min, max, now: clamped },
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) {
    return (
      <ProgressDisclosureContext.Provider value={disclosure}>
        {substituted}
      </ProgressDisclosureContext.Provider>
    );
  }

  return (
    <ProgressDisclosureContext.Provider value={disclosure}>
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
        style={resolveStyle(style, state)}
      >
        {children}
      </View>
    </ProgressDisclosureContext.Provider>
  );
}

export function ProgressTrack({
  testID,
  style,
  children,
  render,
  ref,
}: ProgressTrackProps): React.ReactNode {
  const disclosure = useContext(ProgressDisclosureContext);
  const setTrackRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      setPartRef(ref, node);
    },
    [ref],
  );
  if (!disclosure) return null;
  const state: ProgressTrackState = {
    value: disclosure.value,
    indeterminate: disclosure.indeterminate,
  };

  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setTrackRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setTrackRef} testID={testID} style={resolveStyle(style, state)}>
      {children}
    </View>
  );
}

export function ProgressIndicator({
  testID,
  style,
  render,
  ref,
}: ProgressIndicatorProps): React.ReactNode {
  const disclosure = useContext(ProgressDisclosureContext);
  const setFillRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      setPartRef(ref, node);
    },
    [ref],
  );
  if (!disclosure) return null;
  const { value, min, max, indeterminate } = disclosure;
  const range = max - min;
  const numeric = indeterminate ? min : (value ?? min);
  const clamped = range > 0 ? Math.min(Math.max(numeric, min), max) : min;
  const percent =
    !indeterminate && range > 0 ? ((clamped - min) / range) * 100 : 0;
  const state: ProgressIndicatorState = { value, indeterminate };

  const substituted = resolveRender(
    render,
    {
      testID,
      style: [{ width: `${percent}%` }, resolveStyle(style, state)],
      ref: setFillRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  // The width carries the fill; the caller style merges over it and
  // wins on conflict (the root's own bar precedent).
  return (
    <View
      ref={setFillRef}
      testID={testID}
      style={[{ width: `${percent}%` }, resolveStyle(style, state)]}
    />
  );
}

export function ProgressLabel({
  testID,
  style,
  children,
  render,
}: ProgressLabelProps): React.ReactNode {
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

export function ProgressValue({
  testID,
  style,
  children,
  render,
}: ProgressValueProps): React.ReactNode {
  const disclosure = useContext(ProgressDisclosureContext);
  if (!disclosure) return null;
  const text =
    children ?? (disclosure.indeterminate ? null : String(disclosure.value));
  if (text === null) return null;
  const state: ProgressIndicatorState = {
    value: disclosure.value,
    indeterminate: disclosure.indeterminate,
  };
  const substituted = resolveRender(
    render,
    { testID, style, children: text } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return (
    <Text testID={testID} style={style}>
      {text}
    </Text>
  );
}
