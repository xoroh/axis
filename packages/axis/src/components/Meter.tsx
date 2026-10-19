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
 * Meter — a graphical display of a numeric value within a range, in
 * compound parts.
 *
 * `MeterRoot` owns the value and announces it (meter role with
 * `{ min, max, now }`); `MeterTrack` contains the range;
 * `MeterIndicator` visualizes the position with a data-driven fill;
 * `MeterLabel` names the meter; `MeterValue` displays the current
 * value (a node, or a function of the value for caller formatting).
 * No colors, no ticks, no scale chrome — measurement display only.
 * Like `Progress` but for rated capacity rather than task progress.
 *
 * The indicator fill is the clamped percentage of the range,
 * merged UNDER caller style (caller wins on conflict) — the
 * `Progress` fill precedent.
 */

export type MeterRootState = {
  /** Clamped value announced to assistive tech. */
  value: number;
};

export type MeterTrackProps = {
  testID?: string;
  /** Track container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Track content (`MeterIndicator`). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The track carries no state, so the
   * function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type MeterIndicatorProps = {
  testID?: string;
  /** Fill style, caller-provided (merged under the fill width). */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The indicator carries no state, so
   * the function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type MeterLabelProps = {
  testID?: string;
  /** Label text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Label content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The label carries no state, so the
   * function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type MeterValueProps = {
  testID?: string;
  /** Value text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /**
   * Value content: a node, or a function of the current value for
   * caller formatting (no `Intl` formatting layer — the caller
   * formats; the Base UI `getAriaValueText`/`locale`/`format` props
   * are omitted as the no-`Intl` adaptation).
   */
  children?: ReactNode | ((value: number) => ReactNode);
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The value carries no state, so the
   * function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type MeterRootProps = {
  /** Current value (required — a meter without a value is a bug). */
  value: number;
  /** Minimum value. Default `0`. */
  min?: number;
  /** Maximum value. Default `100`. */
  max?: number;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root container style: value or function of meter state, caller-provided. */
  style?: StateStyle<MeterRootState, StyleProp<ViewStyle>>;
  /** Meter content (`MeterLabel`, `MeterTrack`, `MeterValue`). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<MeterRootState, SlotProps>;
  /** Forwarded to the root container host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

type MeterDisclosure = {
  value: number;
  min: number;
  max: number;
  percent: number;
};

/**
 * Shared clamped value. Internal to this module (not exported):
 * track, indicator, and value must render inside a `MeterRoot`;
 * outside one they render nothing (a fill without a range is
 * meaningless).
 */
const MeterDisclosureContext = createContext<MeterDisclosure | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: MeterRootProps["ref"],
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

export function MeterRoot({
  value,
  min = 0,
  max = 100,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: MeterRootProps): React.ReactNode {
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const range = max - min;
  const clamped = range > 0 ? Math.min(Math.max(value, min), max) : min;
  const percent = range > 0 ? ((clamped - min) / range) * 100 : 0;
  const state: MeterRootState = { value: clamped };
  const disclosure: MeterDisclosure = { value: clamped, min, max, percent };
  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "meter",
      accessibilityValue: { min, max, now: clamped },
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessible
      accessibilityRole="meter"
      accessibilityValue={{ min, max, now: clamped }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      <MeterDisclosureContext.Provider value={disclosure}>
        {children}
      </MeterDisclosureContext.Provider>
    </View>
  );
}

export function MeterTrack({
  testID,
  style,
  children,
  render,
}: MeterTrackProps): React.ReactNode {
  const disclosure = useContext(MeterDisclosureContext);
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

export function MeterIndicator({
  testID,
  style,
  render,
}: MeterIndicatorProps): React.ReactNode {
  const disclosure = useContext(MeterDisclosureContext);
  if (!disclosure) return null;
  const substituted = resolveRender(
    render,
    {
      testID,
      style: [{ width: `${disclosure.percent}%` }, style],
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return <View testID={testID} style={[{ width: `${disclosure.percent}%` }, style]} />;
}

export function MeterLabel({
  testID,
  style,
  children,
  render,
}: MeterLabelProps): React.ReactNode {
  const disclosure = useContext(MeterDisclosureContext);
  if (!disclosure) return null;
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

export function MeterValue({
  testID,
  style,
  children,
  render,
}: MeterValueProps): React.ReactNode {
  const disclosure = useContext(MeterDisclosureContext);
  if (!disclosure) return null;
  const content =
    typeof children === "function" ? children(disclosure.value) : children;
  const substituted = resolveRender(
    render,
    { testID, style, children: content } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <Text testID={testID} style={style}>
      {content}
    </Text>
  );
}
