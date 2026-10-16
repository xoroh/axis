import { type ElementRef, type Ref, useCallback } from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Switch — an unstyled on/off control.
 *
 * Structure only: a `Pressable` row carrying the switch role and state,
 * with a track/thumb `View` pair the caller styles. No default visuals —
 * every visual value (`style`, `trackStyle`, `thumbStyle`) is
 * caller-provided. State follows the `useControllableState` pattern
 * with Base UI names: `checked` (+ `onCheckedChange`) for controlled
 * use, `defaultChecked` for uncontrolled.
 *
 * Pre-cutover aliases (`value`, `defaultValue`, `onValueChange`) still
 * work and fan out to the canonical handlers, but warn once: they are
 * deprecated and will be removed after one minor release (contract
 * §10). When both spellings are present the canonical one wins.
 */

export type SwitchProps = {
  /** Controlled state. Wins over `defaultChecked` when defined. */
  checked?: boolean;
  /** Uncontrolled initial state. Default `false`. */
  defaultChecked?: boolean;
  /** Fires with the next state on every committed toggle. */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Deprecated alias of `checked` (pre-cutover spelling). Warns once;
   * canonical wins when both are present. Removed after one minor.
   */
  value?: boolean;
  /**
   * Deprecated alias of `defaultChecked`. Warns once. Removed after
   * one minor.
   */
  defaultValue?: boolean;
  /**
   * Deprecated alias of `onCheckedChange`. Warns once; still fires
   * (both handlers run) until removal. Removed after one minor.
   */
  onValueChange?: (value: boolean) => void;
  /** Terminal: no transitions, no callbacks, announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /** Native labelled-by association where the platform supports it. */
  accessibilityLabelledBy?: string;
  testID?: string;
  /** Root pressable style. */
  style?: StyleProp<ViewStyle>;
  /** Track container style. */
  trackStyle?: StyleProp<ViewStyle>;
  /** Thumb indicator style. */
  thumbStyle?: StyleProp<ViewStyle>;
  /** Forwarded to the root pressable host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

/**
 * Deprecation notice flag (module state, warn once per session, not
 * per render — a render-path warning would spam every toggle).
 */
let warnedDeprecatedAlias = false;

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: SwitchProps["ref"],
  value: ElementRef<typeof Pressable> | null,
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

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  accessibilityLabelledBy,
  testID,
  style,
  trackStyle,
  thumbStyle,
  ref,
}: SwitchProps): React.JSX.Element {
  if (
    !warnedDeprecatedAlias &&
    (value !== undefined ||
      defaultValue !== undefined ||
      onValueChange !== undefined)
  ) {
    warnedDeprecatedAlias = true;
    console.warn(
      "Axis Switch: `value`/`defaultValue`/`onValueChange` are deprecated " +
        "aliases of `checked`/`defaultChecked`/`onCheckedChange` (Base UI " +
        "parity) and will be removed after one minor release. " +
        "When both spellings are present the canonical one wins.",
    );
  }

  const [on, setOn] = useControllableState<boolean>(
    checked ?? value,
    defaultChecked ?? defaultValue ?? false,
    (next) => {
      onCheckedChange?.(next);
      onValueChange?.(next);
    },
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setOn((previous) => !(previous ?? false));
  }, [disabled, setOn]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <Pressable
      ref={setHostRef}
      accessibilityRole="switch"
      accessibilityState={{ checked: on ?? false, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityLabelledBy={accessibilityLabelledBy}
      testID={testID}
      disabled={disabled}
      onPress={toggle}
      style={style}
    >
      <View style={trackStyle}>
        <View style={thumbStyle} />
      </View>
    </Pressable>
  );
}
