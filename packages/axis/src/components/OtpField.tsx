import {
  type ElementRef,
  type Ref,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  type StyleProp,
  Text,
  TextInput,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * OTPFieldRoot — segmented one-time-code entry with auto-advance.
 *
 * Structure only: a container `View` of `length` cells plus ONE hidden
 * host `TextInput` that captures entry, so auto-advance is implicit —
 * every keystroke lands in the single input and fans out to the cells.
 * No per-cell inputs, no focus choreography, no masking beyond
 * `secureTextEntry`. State follows the `useControllableState` pattern:
 * `value` (+ `onValueChange`) for controlled use, `defaultValue` for
 * uncontrolled. With `autoSubmit`, `onComplete` fires exactly once per
 * completion (guarded by the last-completed value: a rerender at full
 * length never refires, and only a change away and back resubmits).
 *
 * ADR-112 aria-only: the container accepts `aria-label` and `aria-labelledby`.
 * Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 */

export type OTPFieldRootState = {
  /** Current code (sliced to `length`). */
  value: string;
  /** Whether the field is currently disabled. */
  disabled: boolean;
};

export type OTPFieldRootProps = {
  /** Controlled code. Wins over `defaultValue` when defined. */
  value?: string;
  /** Uncontrolled initial code. Default `""`. */
  defaultValue?: string;
  /** Fires with the next code on every change. */
  onValueChange?: (value: string) => void;
  /** Cell count. Default `6`. Values below `1` clamp to `1`. */
  length?: number;
  /** Terminal: no entry, no callbacks. Default `false`. */
  disabled?: boolean;
  /** Obscured entry. Default `false`. */
  secureTextEntry?: boolean;
  /** When `true`, calls `onComplete` once the code reaches full length. Default `false`. */
  autoSubmit?: boolean;
  /** Fires once per completion while `autoSubmit` is set. */
  onComplete?: (value: string) => void;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  /** Native labelled-by association where the platform supports it (ADR-112). */
  "aria-labelledby"?: string;
  testID?: string;
  /** Container style: value or function of field state. */
  style?: StateStyle<OTPFieldRootState, StyleProp<ViewStyle>>;
  /** Per-cell container style, caller-provided. */
  cellStyle?: StyleProp<ViewStyle>;
  /** Per-cell text style, caller-provided. */
  textStyle?: StyleProp<TextStyle>;
  /**
   * Capture-input style, caller-provided and merged over the hidden
   * base (`absolute`, invisible, 1×1 — behavior-hidden but
   * focusable). The caller wins on conflict.
   */
  inputStyle?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the whole field (cells plus
   * hidden entry).
   */
  render?: RenderProp<OTPFieldRootState, SlotProps>;
  /** Forwarded to the container view. */
  ref?: Ref<ElementRef<typeof View>>;
};

function assignRef(
  ref: OTPFieldRootProps["ref"],
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
      // A frozen ref object cannot take the write
    }
  }
}

const HIDDEN_INPUT_STYLE: TextStyle = {
  position: "absolute",
  opacity: 0,
  width: 1,
  height: 1,
};

export function OTPFieldRoot({
  value,
  defaultValue = "",
  onValueChange,
  length = 6,
  disabled = false,
  secureTextEntry = false,
  autoSubmit = false,
  onComplete,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  cellStyle,
  textStyle,
  inputStyle,
  render,
  ref,
}: OTPFieldRootProps): React.ReactNode {
  const safeLength = Number.isFinite(length)
    ? Math.max(1, Math.floor(length))
    : 6;
  const [stored, setStored] = useControllableState<string>(
    value,
    defaultValue,
    onValueChange,
  );
  const current = (stored ?? "").slice(0, safeLength);

  const lastCompleted = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSubmit) return;
    if (current.length === safeLength) {
      if (lastCompleted.current !== current) {
        lastCompleted.current = current;
        onComplete?.(current);
      }
    } else {
      lastCompleted.current = null;
    }
  }, [autoSubmit, current, safeLength, onComplete]);

  const handleChangeText = useCallback(
    (next: string) => {
      setStored(next.slice(0, safeLength));
    },
    [safeLength, setStored],
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: OTPFieldRootState = { value: current, disabled };
  const hostProps = {
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined
      ? { "aria-labelledby": ariaLabelledBy }
      : {}),
    testID,
    style: resolveStyle(style, state),
    cellStyle,
    textStyle,
    inputStyle: [HIDDEN_INPUT_STYLE, inputStyle],
    value: current,
    onValueChange: disabled ? undefined : handleChangeText,
    ref: setHostRef,
  } satisfies SlotProps;

  const substituted = resolveRender(render, hostProps, state);
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      {Array.from({ length: safeLength }, (_, index) => {
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: positional fixed-length cells.
          <View key={index} style={cellStyle}>
            <Text
              testID={testID ? `${testID}-cell-${index}` : undefined}
              style={textStyle}
            >
              {current[index] ?? ""}
            </Text>
          </View>
        );
      })}
      <TextInput
        testID={testID ? `${testID}-input` : undefined}
        value={current}
        onChangeText={disabled ? undefined : handleChangeText}
        maxLength={safeLength}
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        keyboardType="number-pad"
        style={[HIDDEN_INPUT_STYLE, inputStyle]}
      />
    </View>
  );
}

export { OTPFieldRoot as OtpField };
