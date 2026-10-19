import { type ElementRef, type Ref, useCallback } from "react";
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
import { useControllableState } from "../useControllableState";
import { Button } from "./Button";
import { Input } from "./Input";

/**
 * NumberField — numeric entry with steppers, composed from Axis primitives.
 *
 * Structure only: an Axis `Input` for text entry flanked by two Axis
 * `Button` steppers — text entry and press handling are not reimplemented
 * here. State is `number | null` via `useControllableState` (`null`
 * means empty); the input shows `String(value)` or `""`. Typed text is
 * parsed with `parseFloat`, so `NaN` (empty or invalid entry) clears to
 * `null`. Steppers move from the current numeric value (`null` counts
 * as `min ?? 0`) by `step` (default `1`; a `step <= 0` falls back to
 * `1` without throwing) and clamp the result to `min`/`max`. Stepper
 * labels are fixed (`"Decrement"`/`"Increment"`) — not overridable — and
 * each stepper carries a minimal text affordance (a `Button` without
 * label content is useless; the labels stay the accessible names).
 * `disabled` is terminal: the input and both steppers stop with no
 * callbacks.
 */

export type NumberFieldState = {
  /** Current numeric value (`null` = empty). */
  value: number | null;
  /** Whether the field is currently disabled. */
  disabled: boolean;
};

export type NumberFieldProps = {
  /** Controlled numeric value (`null` = empty). Wins over `defaultValue` when defined. */
  value?: number | null;
  /** Uncontrolled initial value. Empty (`null`) when omitted. */
  defaultValue?: number | null;
  /** Fires with the next value on every committed change (typing or stepping). */
  onValueChange?: (value: number | null) => void;
  /** Minimum value; stepped results clamp here. No default. */
  min?: number;
  /** Maximum value; stepped results clamp here. No default. */
  max?: number;
  /** Step increment. Default `1`; values `<= 0` fall back to `1` (no throw). */
  step?: number;
  /** Terminal: disables the input and both steppers — no callbacks. Default `false`. */
  disabled?: boolean;
  /** Accessible name source for the field container. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style: value or function of field state. */
  style?: StateStyle<NumberFieldState, StyleProp<ViewStyle>>;
  /** Text-entry style, caller-provided. */
  inputStyle?: StyleProp<TextStyle>;
  /** Stepper button style (both steppers), caller-provided. */
  buttonStyle?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the whole field (steppers
   * plus entry).
   */
  render?: RenderProp<NumberFieldState, SlotProps>;
  /** Forwarded to the container view. */
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
  ref: NumberFieldProps["ref"],
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

function clampValue(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

export function NumberField({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  inputStyle,
  buttonStyle,
  render,
  ref,
}: NumberFieldProps): React.ReactNode {
  const [numeric, setNumeric] = useControllableState<number | null>(
    value,
    defaultValue,
    onValueChange,
  );

  const effectiveStep = step !== undefined && step > 0 ? step : 1;

  const handleChangeText = useCallback(
    (text: string) => {
      if (disabled) return;
      const parsed = parseFloat(text);
      setNumeric(Number.isNaN(parsed) ? null : parsed);
    },
    [disabled, setNumeric],
  );

  const stepBy = useCallback(
    (direction: 1 | -1) => {
      if (disabled) return;
      setNumeric((previous) => {
        const base = previous ?? min ?? 0;
        return clampValue(base + direction * effectiveStep, min, max);
      });
    },
    [disabled, effectiveStep, max, min, setNumeric],
  );

  const decrement = useCallback(() => {
    stepBy(-1);
  }, [stepBy]);

  const increment = useCallback(() => {
    stepBy(1);
  }, [stepBy]);

  const changeValue = useCallback(
    (next: number | null) => {
      if (disabled) return;
      setNumeric(next);
    },
    [disabled, setNumeric],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: NumberFieldState = { value: numeric ?? null, disabled };
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      inputStyle,
      buttonStyle,
      onValueChange: changeValue,
      onDecrement: decrement,
      onIncrement: increment,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      <Button
        accessibilityLabel="Decrement"
        disabled={disabled}
        onPress={decrement}
        style={buttonStyle}
      >
        <Text>-</Text>
      </Button>
      <Input
        value={numeric === null || numeric === undefined ? "" : String(numeric)}
        onValueChange={handleChangeText}
        editable={!disabled}
        style={inputStyle}
      />
      <Button
        accessibilityLabel="Increment"
        disabled={disabled}
        onPress={increment}
        style={buttonStyle}
      >
        <Text>+</Text>
      </Button>
    </View>
  );
}
