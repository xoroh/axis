import { type ElementRef, type Ref, useCallback } from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
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
  /** Root pressable style. */
  style?: StyleProp<ViewStyle>;
  /** Box container style. */
  boxStyle?: StyleProp<ViewStyle>;
  /** Check indicator style (rendered only when checked). */
  checkmarkStyle?: StyleProp<ViewStyle>;
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
  ref,
}: CheckboxProps): React.JSX.Element {
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
      style={style}
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
