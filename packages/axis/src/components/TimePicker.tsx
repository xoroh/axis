import { type ElementRef, type Ref, useCallback } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import {
  formatTimeValue,
  minutesForStep,
  normalizeTimeValue,
  type TimePickerValue,
} from "../time";
import { useControllableState } from "../useControllableState";
import { Button } from "./Button";
import { Input } from "./Input";

/**
 * TimePicker — hour/minute entry with steppers, composed from Axis primitives.
 *
 * Structure only: two Axis `Input`s (hours, minutes) flanked by four
 * Axis `Button` steppers — text entry and press handling are not
 * reimplemented here. The value is ALWAYS 24-hour internally (see
 * `../time`); display derives from `formatTimeValue` in 24-hour form,
 * minutes zero-padded. Every commit normalises through
 * `normalizeTimeValue` with `step` (hours clamp 0–23, minutes snap
 * down onto the step grid), so typed text like "25" commits as 23 and
 * an invalid step falls back to 1 via `minutesForStep`. State is
 * `TimePickerValue | null` via `useControllableState` (`null` renders
 * as 00:00 — a time control always shows a concrete time, never an
 * empty field). Stepper labels are fixed (`"Increment hours"` /
 * `"Decrement hours"` / `"Increment minutes"` / `"Decrement
 * minutes"`) — not overridable. `disabled` is terminal: both inputs
 * and all four steppers stop with no callbacks.
 */

export type TimePickerState = {
  /** Current time (`null` renders as 00:00). */
  value: TimePickerValue | null;
  /** Whether the whole picker is disabled. */
  disabled: boolean;
};

export type TimePickerProps = {
  /** Controlled time. Wins over `defaultValue` when defined. */
  value?: TimePickerValue | null;
  /** Uncontrolled initial time. Renders as 00:00 when omitted. */
  defaultValue?: TimePickerValue | null;
  /** Fires with the next time on every committed change (typing or stepping). */
  onValueChange?: (value: TimePickerValue) => void;
  /** Minute granularity. Default `1`; values that do not divide 60 fall back to `1` (no throw). */
  step?: number;
  /** Terminal: disables both inputs and all four steppers — no callbacks. Default `false`. */
  disabled?: boolean;
  /** Accessible name source for the picker container. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style: value or function of picker state. */
  style?: StateStyle<TimePickerState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the whole picker (steppers
   * plus entries); typing and stepping wiring travel in the props.
   */
  render?: RenderProp<TimePickerState, SlotProps>;
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
  ref: TimePickerProps["ref"],
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

export function TimePicker({
  value,
  defaultValue = null,
  onValueChange,
  step = 1,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: TimePickerProps): React.ReactNode {
  const handleChange = useCallback(
    (next: TimePickerValue | null) => {
      // `setCurrent` below only ever commits non-null times, so this
      // guard is a type-level adapter, not a runtime branch: the
      // public callback contract stays non-null per the spec.
      if (next !== null) onValueChange?.(next);
    },
    [onValueChange],
  );
  const [current, setCurrent] = useControllableState<TimePickerValue | null>(
    value,
    defaultValue,
    handleChange,
  );

  const options = minutesForStep(step);

  const normalised = normalizeTimeValue(current ?? undefined, step);
  const display = formatTimeValue(normalised, "24h");
  const hoursText = String(display.hours);
  const minutesText = String(normalised.minutes).padStart(2, "0");

  // Commit helper: skips the update when the next time equals the
  // normalised current one, so stepping into a clamp (e.g. increment
  // at 23:59) is a silent no-op rather than a same-value callback —
  // the clamping precedent the NumberField steppers set.
  const commitTime = useCallback(
    (next: TimePickerValue) => {
      setCurrent((previous) => {
        const base = normalizeTimeValue(previous ?? undefined, step);
        if (next.hours === base.hours && next.minutes === base.minutes) {
          return previous ?? next;
        }
        return next;
      });
    },
    [setCurrent, step],
  );

  const handleHoursText = useCallback(
    (text: string) => {
      if (disabled) return;
      const parsed = parseInt(text, 10);
      const base = normalizeTimeValue(current ?? undefined, step);
      commitTime(
        normalizeTimeValue(
          {
            hours: Number.isNaN(parsed) ? 0 : parsed,
            minutes: base.minutes,
          },
          step,
        ),
      );
    },
    [commitTime, current, disabled, step],
  );

  const handleMinutesText = useCallback(
    (text: string) => {
      if (disabled) return;
      const parsed = parseInt(text, 10);
      const base = normalizeTimeValue(current ?? undefined, step);
      commitTime(
        normalizeTimeValue(
          {
            hours: base.hours,
            minutes: Number.isNaN(parsed) ? 0 : parsed,
          },
          step,
        ),
      );
    },
    [commitTime, current, disabled, step],
  );

  const stepHours = useCallback(
    (delta: 1 | -1) => {
      if (disabled) return;
      const base = normalizeTimeValue(current ?? undefined, step);
      const hours = Math.min(Math.max(base.hours + delta, 0), 23);
      commitTime({ hours, minutes: base.minutes });
    },
    [commitTime, current, disabled, step],
  );

  const stepMinutes = useCallback(
    (delta: 1 | -1) => {
      if (disabled) return;
      const base = normalizeTimeValue(current ?? undefined, step);
      // Walk the step grid itself (`base` is always on it — the
      // normaliser snaps down), clamping at the grid ends. Stepping
      // by raw minutes and clamping at 59 could land off-grid (e.g.
      // 55 + 15 -> 59 with a 15-minute step), a value no control could
      // have produced and one the display would snap away anyway.
      const index = options.indexOf(base.minutes);
      const at = index === -1 ? 0 : index;
      const nextIndex = Math.min(Math.max(at + delta, 0), options.length - 1);
      commitTime({
        hours: base.hours,
        minutes: options[nextIndex] ?? base.minutes,
      });
    },
    [commitTime, current, disabled, options, step],
  );

  const decrementHours = useCallback(() => {
    stepHours(-1);
  }, [stepHours]);

  const incrementHours = useCallback(() => {
    stepHours(1);
  }, [stepHours]);

  const decrementMinutes = useCallback(() => {
    stepMinutes(-1);
  }, [stepMinutes]);

  const incrementMinutes = useCallback(() => {
    stepMinutes(1);
  }, [stepMinutes]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: TimePickerState = { value: current ?? null, disabled };
  const changeTime = useCallback(
    (next: TimePickerValue) => {
      if (disabled) return;
      commitTime(next);
    },
    [commitTime, disabled],
  );
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      value: current ?? null,
      onValueChange: changeTime,
      step,
      onDecrementHours: decrementHours,
      onIncrementHours: incrementHours,
      onDecrementMinutes: decrementMinutes,
      onIncrementMinutes: incrementMinutes,
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
        accessibilityLabel="Decrement hours"
        disabled={disabled}
        onPress={decrementHours}
      >
        <Text>-</Text>
      </Button>
      <Input
        value={hoursText}
        onValueChange={handleHoursText}
        editable={!disabled}
        accessibilityLabel="Hours"
        testID={testID ? `${testID}-hours` : undefined}
      />
      <Button
        accessibilityLabel="Increment hours"
        disabled={disabled}
        onPress={incrementHours}
      >
        <Text>+</Text>
      </Button>
      <Button
        accessibilityLabel="Decrement minutes"
        disabled={disabled}
        onPress={decrementMinutes}
      >
        <Text>-</Text>
      </Button>
      <Input
        value={minutesText}
        onValueChange={handleMinutesText}
        editable={!disabled}
        accessibilityLabel="Minutes"
        testID={testID ? `${testID}-minutes` : undefined}
      />
      <Button
        accessibilityLabel="Increment minutes"
        disabled={disabled}
        onPress={incrementMinutes}
      >
        <Text>+</Text>
      </Button>
    </View>
  );
}
