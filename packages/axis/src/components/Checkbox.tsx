import { type ElementRef, type Ref, useCallback } from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * Checkbox — an unstyled binary selection control.
 *
 * Structure only: a `Pressable` carrying the checkbox role and state,
 * with a box/checkmark `View` pair the caller styles. The checkmark
 * indicator renders only when checked (structural, not visual — its
 * appearance is entirely caller-provided). State follows the
 * `useControllableState` pattern: `checked` (+ `onCheckedChange`) for
 * controlled use, `defaultChecked` for uncontrolled.
 */

export type CheckboxState = {
  /** Whether the checkbox is currently checked. */
  checked: boolean;
  /** Whether the checkbox is currently disabled. */
  disabled: boolean;
};

export type CheckboxProps = {
  /** Controlled state. Wins over `defaultChecked` when defined. */
  checked?: boolean;
  /** Uncontrolled initial state. Default `false`. */
  defaultChecked?: boolean;
  /** Fires with the next state on every committed toggle. */
  onCheckedChange?: (checked: boolean) => void;
  /** Terminal: no transitions, no callbacks, announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /** Native labelled-by association where the platform supports it. */
  accessibilityLabelledBy?: string;
  testID?: string;
  /** Value or function of checkbox state, caller-provided. */
  style?: StateStyle<CheckboxState, StyleProp<ViewStyle>>;
  /** Box container style. */
  boxStyle?: StyleProp<ViewStyle>;
  /** Check indicator style (rendered only when checked). */
  checkmarkStyle?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<CheckboxState, SlotProps>;
  /** Forwarded to the root pressable host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

function assignRef(
  ref: CheckboxProps["ref"],
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

export function Checkbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  accessibilityLabel,
  accessibilityLabelledBy,
  testID,
  style,
  boxStyle,
  checkmarkStyle,
  render,
  ref,
}: CheckboxProps): React.ReactNode {
  const [isChecked, setChecked] = useControllableState<boolean>(
    checked,
    defaultChecked,
    onCheckedChange,
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setChecked((previous) => !(previous ?? false));
  }, [disabled, setChecked]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: CheckboxState = { checked: isChecked ?? false, disabled };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "checkbox",
      accessibilityState: { checked: isChecked ?? false, disabled },
      accessibilityLabel,
      accessibilityLabelledBy,
      testID,
      disabled,
      onPress: toggle,
      style: resolveStyle(style, state),
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setHostRef}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked ?? false, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityLabelledBy={accessibilityLabelledBy}
      testID={testID}
      disabled={disabled}
      onPress={toggle}
      style={resolveStyle(style, state)}
    >
      <View style={boxStyle}>
        {isChecked ? (
          <View
            style={checkmarkStyle}
            testID={testID ? `${testID}-checkmark` : undefined}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
