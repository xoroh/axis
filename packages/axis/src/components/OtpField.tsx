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
import { useControllableState } from "../useControllableState";

/**
 * OtpField — segmented one-time-code entry with auto-advance.
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
 */

export type OtpFieldProps = {
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
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Per-cell container style, caller-provided. */
  cellStyle?: StyleProp<ViewStyle>;
  /** Per-cell text style, caller-provided. */
  textStyle?: StyleProp<TextStyle>;
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
  ref: OtpFieldProps["ref"],
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

export function OtpField({
  value,
  defaultValue = "",
  onValueChange,
  length = 6,
  disabled = false,
  secureTextEntry = false,
  autoSubmit = false,
  onComplete,
  accessibilityLabel,
  testID,
  style,
  cellStyle,
  textStyle,
  ref,
}: OtpFieldProps): React.JSX.Element {
  const safeLength = Number.isFinite(length)
    ? Math.max(1, Math.floor(length))
    : 6;
  const [stored, setStored] = useControllableState<string>(
    value,
    defaultValue,
    onValueChange,
  );
  const current = (stored ?? "").slice(0, safeLength);

  // Last value `onComplete` fired for. Cleared whenever the code drops
  // below full length, so a rerender at full length never refires while
  // a change away and back (even to the same code) resubmits.
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
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      {Array.from({ length: safeLength }, (_, index) => {
        // Cells are positional and fixed-length: the index IS the stable
        // identity (no reorder/insert/remove exists), so index keys are
        // correct here, not a shortcut.
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
        keyboardType="number-pad"
        secureTextEntry={secureTextEntry}
        editable={!disabled}
      />
    </View>
  );
}
