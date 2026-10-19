import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PanResponder,
  Pressable,
  type StyleProp,
  Text,
  type TextInput,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import {
  clampNumberValue,
  formatNumberValue,
  parseNumberValue,
  stepNumberValue,
} from "../number";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { Input } from "./Input";

/**
 * NumberField — numeric entry with steppers, in Base UI compound parts.
 *
 * `NumberFieldRoot` owns the state (`value` + `onValueChange` for
 * controlled use, `defaultValue` for uncontrolled; `inputValue` is the
 * formatted text mirror); `NumberFieldGroup` lays the input with the
 * steppers; `NumberFieldInput` composes the Axis `Input` for text
 * entry; `NumberFieldIncrement`
 * and `NumberFieldDecrement` step with press-and-hold auto-repeat; and
 * `NumberFieldScrubArea` drag-scrubs the value with a finger.
 *
 * Base UI names and semantics hold except where native has no
 * counterpart (each recorded below, never silent):
 * - `smallStep` / `largeStep` (alt/shift + arrows): omitted — modifier-key
 *   stepping has no touch equivalent.
 * - `allowWheelScrub` (mouse wheel): omitted — no touch equivalent.
 * - `required` / `name` / `form` / `inputRef` / `id` (form submission):
 *   omitted — Axis has no Form yet; each part owns its own ref.
 * - `step="any"` (disable step validation on submit): omitted — there is
 *   no native submit validation; behaviorally identical to `step={1}`.
 * - `ScrubAreaCursor` / `teleportDistance` (Pointer Lock cursor): omitted
 *   — no pointer lock or cursor on touch.
 * - `onValueChange` / `onValueCommitted` carry the primitive value only
 *   (no `eventDetails` objects — the Axis contract keeps event objects
 *   off the boundary; the monolith precedent).
 * - No `data-*` attributes (D1); state flows through `render`/`style`
 *   functions. No animation (Dialog precedent).
 *
 * `readOnly` shares `disabled`'s terminality (no entry, no stepping,
 * no callbacks — without Form the distinction is submission, which has
 * no native counterpart) but never claims `disabled` in accessibility
 * state. `step <= 0` falls back to `1` without throwing (monolith
 * precedent). Nothing here throws on caller input.
 */

export type NumberFieldState = {
  /** Current numeric value (`null` = empty). */
  value: number | null;
  /** Formatted text shown in the input. */
  inputValue: string;
  /** Terminal: no entry, no stepping, no callbacks. */
  disabled: boolean;
  /** Terminal like `disabled`, but never announced as disabled. */
  readOnly: boolean;
  /** Whether a scrub drag is in progress. */
  scrubbing: boolean;
};

export type NumberFieldRootProps = {
  /** Controlled numeric value (`null` = empty). Wins over `defaultValue`. */
  value?: number | null;
  /** Uncontrolled initial value. Empty (`null`) when omitted. */
  defaultValue?: number | null;
  /** Fires with the next value on every committed change (typing or stepping). */
  onValueChange?: (value: number | null) => void;
  /**
   * Fires with the current value when it commits: input blur, stepper
   * release after stepping, or scrub-drag release after stepping.
   */
  onValueCommitted?: (value: number | null) => void;
  /** Minimum value; stepped results clamp here. No default. */
  min?: number;
  /** Maximum value; stepped results clamp here. No default. */
  max?: number;
  /** Step increment. Default `1`; values `<= 0` fall back to `1`. */
  step?: number;
  /** Snap stepped results to the nearest step multiple. Default `false`. */
  snapOnStep?: boolean;
  /** Terminal: disables the input and both steppers — no callbacks. Default `false`. */
  disabled?: boolean;
  /** Terminal like `disabled`, never announced as disabled. Default `false`. */
  readOnly?: boolean;
  /** BCP 47 locale for display formatting and parsing. Defaults to runtime locale. */
  locale?: string;
  /** `Intl.NumberFormat` options for display. */
  format?: Intl.NumberFormatOptions;
  /** Field content (any arrangement of the parts). */
  children?: ReactNode;
};

export type NumberFieldGroupProps = {
  /** Group content (input flanked by steppers). */
  children?: ReactNode;
  testID?: string;
  /** Group style: value or function of field state, caller-provided. */
  style?: StateStyle<NumberFieldState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The adjustable role, actions, and drag
   * wiring stay on the part.
   */
  render?: RenderProp<NumberFieldState, SlotProps>;
  /** Forwarded to the group host. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type NumberFieldInputProps = {
  /** Placeholder text. Visual only, caller-provided. */
  placeholder?: string;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Input style: value or function of field state, caller-provided. */
  style?: StateStyle<NumberFieldState, StyleProp<TextStyle>>;
  /**
   * Element or function substitution (Base UI parity) for the entry
   * host. The numeric state plumbing stays on the part.
   */
  render?: RenderProp<NumberFieldState, SlotProps>;
  /** Forwarded to the host text input. */
  ref?: Ref<ElementRef<typeof TextInput>>;
};

export type NumberFieldDecrementProps = {
  /** Stepper content (icon). Announced via `accessibilityLabel`. */
  children?: ReactNode;
  /** Accessible name source. Default `"Decrement"`. */
  accessibilityLabel?: string;
  testID?: string;
  /** Stepper style: value or function of field state, caller-provided. */
  style?: StateStyle<NumberFieldState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). Press-and-hold
   * auto-repeat and terminality stay on the part.
   */
  render?: RenderProp<NumberFieldState, SlotProps>;
  /** Forwarded to the stepper host. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type NumberFieldIncrementProps = {
  /** Stepper content (icon). Announced via `accessibilityLabel`. */
  children?: ReactNode;
  /** Accessible name source. Default `"Increment"`. */
  accessibilityLabel?: string;
  testID?: string;
  /** Stepper style: value or function of field state, caller-provided. */
  style?: StateStyle<NumberFieldState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). Press-and-hold
   * auto-repeat and terminality stay on the part.
   */
  render?: RenderProp<NumberFieldState, SlotProps>;
  /** Forwarded to the stepper host. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type NumberFieldScrubDirection = "horizontal" | "vertical";

export type NumberFieldScrubAreaProps = {
  /** Scrub content. */
  children?: ReactNode;
  /** Drag axis for value changes. Default `"horizontal"`. */
  direction?: NumberFieldScrubDirection;
  /**
   * Pixels of drag per step increment. Default `2` (Base UI exact).
   * Values `<= 0` fall back to `2` without throwing.
   */
  pixelSensitivity?: number;
  testID?: string;
  /** Scrub style: value or function of field state, caller-provided. */
  style?: StateStyle<NumberFieldState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). The drag
   * wiring stays on the part.
   */
  render?: RenderProp<NumberFieldState, SlotProps>;
  /** Forwarded to the scrub host. */
  ref?: Ref<ElementRef<typeof View>>;
};

/** Press-and-hold timing: initial delay, then repeat interval. */
const HOLD_INITIAL_DELAY_MS = 400;
const HOLD_REPEAT_INTERVAL_MS = 100;

type NumberFieldContextValue = {
  state: NumberFieldState;
  formatSpec: { locale?: string; format?: Intl.NumberFormatOptions };
  stepBy: (direction: 1 | -1) => number | null;
  commitStep: (next?: number | null) => void;
  handleText: (text: string) => void;
  handleBlur: () => void;
  setScrubbing: (scrubbing: boolean) => void;
  scrubByPixels: (pixels: number) => void;
};

const NumberFieldContext = createContext<NumberFieldContextValue | null>(null);

function useNumberField(message: string): NumberFieldContextValue {
  const context = useContext(NumberFieldContext);
  if (!context) {
    throw new Error(`${message} must be used under a NumberFieldRoot.`);
  }
  return context;
}

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
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

export function NumberFieldRoot({
  value,
  defaultValue = null,
  onValueChange,
  onValueCommitted,
  min,
  max,
  step,
  snapOnStep = false,
  disabled = false,
  readOnly = false,
  locale,
  format,
  children,
}: NumberFieldRootProps): React.ReactNode {
  const terminal = disabled || readOnly;
  const effectiveStep =
    step !== undefined && step > 0 && Number.isFinite(step) ? step : 1;
  const formatSpec = useMemo(() => ({ locale, format }), [locale, format]);

  const [numeric, setNumeric] = useControllableState<number | null>(
    value,
    defaultValue,
    onValueChange,
  );
  const [inputValue, setInputValue] = useState<string>(() =>
    formatNumberValue(numeric ?? null, formatSpec),
  );
  const [scrubbing, setScrubbingState] = useState(false);
  const steppedSinceCommit = useRef(false);

  const commitStep = useCallback(
    (explicit?: number | null) => {
      if (steppedSinceCommit.current) {
        steppedSinceCommit.current = false;
        onValueCommitted?.(explicit ?? numeric ?? null);
      }
    },
    [numeric, onValueCommitted],
  );

  const stepBy = useCallback(
    (direction: 1 | -1): number | null => {
      if (terminal) return null;
      // Functional update: the controllable hook runs updaters
      // synchronously against its ref mirror, so chained steps settle
      // here even when renders batch (press-and-hold repeats).
      let next: number | null = null;
      setNumeric((previous) => {
        const base = previous ?? min ?? 0;
        next = stepNumberValue(base, direction, {
          step: effectiveStep,
          snapOnStep,
          min,
          max,
        });
        return next;
      });
      if (next !== null) {
        steppedSinceCommit.current = true;
        setInputValue(formatNumberValue(next, formatSpec));
      }
      return next;
    },
    [effectiveStep, formatSpec, max, min, setNumeric, snapOnStep, terminal],
  );

  const handleText = useCallback(
    (text: string) => {
      if (terminal) return;
      setInputValue(text);
      const parsed = parseNumberValue(text, formatSpec);
      setNumeric(parsed);
    },
    [formatSpec, setNumeric, terminal],
  );

  const handleBlur = useCallback(() => {
    if (terminal) return;
    // Reformat (and clamp) on blur, then commit — Base UI exact order.
    const current = numeric ?? null;
    const clamped =
      current === null ? null : clampNumberValue(current, min, max);
    if (clamped !== numeric) setNumeric(clamped);
    setInputValue(formatNumberValue(clamped, formatSpec));
    onValueCommitted?.(clamped);
  }, [formatSpec, max, min, numeric, onValueCommitted, setNumeric, terminal]);

  // Keep the text mirror honest when the controlled value moves under us.
  const formattedControlled = formatNumberValue(numeric ?? null, formatSpec);
  const [lastFormatted, setLastFormatted] = useState(formattedControlled);
  if (formattedControlled !== lastFormatted) {
    setLastFormatted(formattedControlled);
    setInputValue(formattedControlled);
  }

  const setScrubbing = useCallback((next: boolean) => {
    setScrubbingState(next);
  }, []);

  const scrubByPixels = useCallback(
    (pixels: number) => {
      if (terminal) return;
      let next: number | null = null;
      setNumeric((previous) => {
        const base = previous ?? min ?? 0;
        let computed = base + pixels * effectiveStep;
        if (snapOnStep && effectiveStep > 0) {
          computed = Number(
            (Math.round(computed / effectiveStep) * effectiveStep).toPrecision(
              12,
            ),
          );
        }
        next = clampNumberValue(computed, min, max);
        return next;
      });
      if (next !== null) setInputValue(formatNumberValue(next, formatSpec));
      steppedSinceCommit.current = true;
    },
    [effectiveStep, formatSpec, max, min, setNumeric, snapOnStep, terminal],
  );

  const state: NumberFieldState = useMemo(
    () => ({
      value: numeric ?? null,
      inputValue,
      disabled,
      readOnly,
      scrubbing,
    }),
    [disabled, inputValue, numeric, readOnly, scrubbing],
  );

  const context = useMemo<NumberFieldContextValue>(
    () => ({
      state,
      formatSpec,
      stepBy,
      commitStep,
      handleText,
      handleBlur,
      setScrubbing,
      scrubByPixels,
    }),
    [
      commitStep,
      formatSpec,
      handleBlur,
      handleText,
      scrubByPixels,
      setScrubbing,
      state,
      stepBy,
    ],
  );

  return (
    <NumberFieldContext.Provider value={context}>
      {children}
    </NumberFieldContext.Provider>
  );
}

export function NumberFieldGroup({
  children,
  testID,
  style,
  render,
  ref,
}: NumberFieldGroupProps): React.ReactNode {
  const { state, stepBy, commitStep } = useNumberField("NumberFieldGroup");

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const onAccessibilityAction = (event: {
    nativeEvent: { actionName: string };
  }) => {
    if (event.nativeEvent.actionName === "increment") {
      const next = stepBy(1);
      if (next !== null) commitStep(next);
    } else if (event.nativeEvent.actionName === "decrement") {
      const next = stepBy(-1);
      if (next !== null) commitStep(next);
    }
  };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "adjustable",
      accessibilityState: {
        disabled: state.disabled || undefined,
      },
      accessibilityActions: [
        { name: "increment", label: "Increment value" },
        { name: "decrement", label: "Decrement value" },
      ],
      onAccessibilityAction,
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
      accessibilityRole="adjustable"
      accessibilityState={{ disabled: state.disabled || undefined }}
      accessibilityActions={[
        { name: "increment", label: "Increment value" },
        { name: "decrement", label: "Decrement value" },
      ]}
      onAccessibilityAction={onAccessibilityAction}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      {children}
    </View>
  );
}

export function NumberFieldInput({
  placeholder,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: NumberFieldInputProps): React.ReactNode {
  const { state, handleText, handleBlur } = useNumberField("NumberFieldInput");

  const setHostRef = useCallback(
    (node: ElementRef<typeof TextInput> | null) => {
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      if (ref && typeof ref === "object" && "current" in ref) {
        try {
          (ref as { current: unknown }).current = node;
        } catch {
          // A frozen ref object cannot take the write — leave it alone.
        }
      }
    },
    [ref],
  );

  const resolvedStyle = resolveStyle(style, state);
  const substituted = resolveRender(
    render,
    {
      value: state.inputValue,
      onChangeText: state.disabled || state.readOnly ? undefined : handleText,
      onBlur: state.disabled || state.readOnly ? undefined : handleBlur,
      placeholder,
      editable: !state.disabled && !state.readOnly,
      accessibilityLabel,
      testID,
      style: resolvedStyle,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Input
      value={state.inputValue}
      onValueChange={state.disabled || state.readOnly ? undefined : handleText}
      onBlur={state.disabled || state.readOnly ? undefined : handleBlur}
      placeholder={placeholder}
      editable={!state.disabled && !state.readOnly}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolvedStyle}
      ref={setHostRef}
    />
  );
}

function useHoldRepeat(options: {
  active: boolean;
  onTap: () => void;
  onTick: () => void;
}): {
  onPressIn: () => void;
  onPress: () => void;
  onPressOut: () => void;
} {
  const { active, onTap, onTick } = options;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A release after auto-repeat must not step once more via onPress:
  // the flag suppresses the release press once repeats have fired.
  const repeated = useRef(false);
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const onPressIn = useCallback(() => {
    if (!active) return;
    repeated.current = false;
    const repeat = () => {
      repeated.current = true;
      tickRef.current();
      timer.current = setTimeout(repeat, HOLD_REPEAT_INTERVAL_MS);
    };
    timer.current = setTimeout(repeat, HOLD_INITIAL_DELAY_MS);
  }, [active]);

  const onPress = useCallback(() => {
    if (!active) return;
    if (!repeated.current) tapRef.current();
    repeated.current = false;
  }, [active]);

  const onPressOut = useCallback(() => {
    clear();
  }, [clear]);

  return useMemo(
    () => ({ onPressIn, onPress, onPressOut }),
    [onPressIn, onPress, onPressOut],
  );
}

function StepperButton({
  direction,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
  state,
  children,
}: {
  direction: 1 | -1;
  accessibilityLabel: string;
  testID?: string;
  style?: StateStyle<NumberFieldState, StyleProp<ViewStyle>>;
  render?: RenderProp<NumberFieldState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
  state: NumberFieldState;
  children?: ReactNode;
}): React.ReactNode {
  const { stepBy, commitStep } = useNumberField("NumberField stepper");
  const terminal = state.disabled || state.readOnly;
  const tap = useCallback(() => {
    const next = stepBy(direction);
    if (next !== null) commitStep(next);
  }, [commitStep, direction, stepBy]);
  const tick = useCallback(() => {
    stepBy(direction);
  }, [direction, stepBy]);
  const { onPressIn, onPress, onPressOut } = useHoldRepeat({
    active: !terminal,
    onTap: tap,
    onTick: tick,
  });

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const pressOut = useCallback(() => {
    onPressOut();
    commitStep();
  }, [commitStep, onPressOut]);

  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityLabel,
      accessibilityState: { disabled: terminal || undefined },
      testID,
      disabled: terminal,
      onPress: terminal ? undefined : onPress,
      onPressIn: terminal ? undefined : onPressIn,
      onPressOut: pressOut,
      style: resolveStyle(style, state),
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setHostRef}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: terminal || undefined }}
      testID={testID}
      disabled={terminal}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={pressOut}
      style={resolveStyle(style, state)}
    >
      {children ?? <Text>{direction === 1 ? "+" : "-"}</Text>}
    </Pressable>
  );
}

export function NumberFieldDecrement({
  children,
  accessibilityLabel = "Decrement",
  testID,
  style,
  render,
  ref,
}: NumberFieldDecrementProps): React.ReactNode {
  const { state } = useNumberField("NumberFieldDecrement");
  return (
    <StepperButton
      direction={-1}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
      render={render}
      ref={ref}
      state={state}
    >
      {children}
    </StepperButton>
  );
}

export function NumberFieldIncrement({
  children,
  accessibilityLabel = "Increment",
  testID,
  style,
  render,
  ref,
}: NumberFieldIncrementProps): React.ReactNode {
  const { state } = useNumberField("NumberFieldIncrement");
  return (
    <StepperButton
      direction={1}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
      render={render}
      ref={ref}
      state={state}
    >
      {children}
    </StepperButton>
  );
}

export function NumberFieldScrubArea({
  children,
  direction = "horizontal",
  pixelSensitivity,
  testID,
  style,
  render,
  ref,
}: NumberFieldScrubAreaProps): React.ReactNode {
  const { state, setScrubbing, scrubByPixels, commitStep } = useNumberField(
    "NumberFieldScrubArea",
  );
  const terminal = state.disabled || state.readOnly;
  const sensitivity =
    pixelSensitivity !== undefined &&
    Number.isFinite(pixelSensitivity) &&
    pixelSensitivity > 0
      ? pixelSensitivity
      : 2;
  const accumulated = useRef(0);

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !terminal,
        onMoveShouldSetPanResponder: () => !terminal,
        onPanResponderGrant: () => {
          accumulated.current = 0;
          setScrubbing(true);
        },
        onPanResponderMove: (
          _event: unknown,
          gesture: { dx: number; dy: number },
        ) => {
          if (terminal) return;
          const delta = direction === "horizontal" ? gesture.dx : -gesture.dy;
          accumulated.current += delta;
          const whole =
            Math.trunc(accumulated.current / sensitivity) * sensitivity;
          if (whole !== 0) {
            accumulated.current -= whole;
            // Pixels per step: Base UI exact (pixelSensitivity px = one step).
            scrubByPixels(whole / sensitivity);
          }
        },
        onPanResponderRelease: () => {
          accumulated.current = 0;
          setScrubbing(false);
          commitStep();
        },
        onPanResponderTerminate: () => {
          accumulated.current = 0;
          setScrubbing(false);
        },
      }),
    [commitStep, direction, sensitivity, setScrubbing, scrubByPixels, terminal],
  );

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setHostRef,
      ...responder.panHandlers,
    } satisfies SlotProps,
    state,
  );
  const surface =
    substituted !== null ? (
      substituted
    ) : (
      <View
        ref={setHostRef}
        testID={testID}
        style={resolveStyle(style, state)}
        {...responder.panHandlers}
      >
        {children}
      </View>
    );

  return surface;
}
