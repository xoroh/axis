import type { ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { Button, type ButtonProps } from "./Button";

/**
 * LinkButton — a navigation action with the link role.
 *
 * Structure only: an accessible `View` carrying `accessibilityRole="link"`
 * wrapping the Axis `Button` (which carries the button role and all press
 * behavior). No default visuals — every visual value (`style`, and the
 * rendered `children` themselves) is caller-provided.
 *
 * RN link support verified: the installed React Native 0.87
 * `ViewAccessibility` `AccessibilityRole` union explicitly includes
 * `"link"`, so `accessibilityRole="link"` typechecks on the outer `View`.
 *
 * Composition trade-off (documented, not oversight): `Button` hardcodes
 * `accessibilityRole="button"` with no role override, so a thin wrapper
 * that renders `Button` cannot move the pressable itself to the link
 * role without reimplementing press handling (forbidden — press
 * suppression stays inside `Button`). The link role therefore lives on
 * the outer accessible container while the inner `Button` retains the
 * button role and owns `onPress`/`disabled` behavior. Role queries see
 * both: `link` (outer, purpose) and `button` (inner, activation).
 * When `Button` gains a role override, this wrapper should pass the
 * link role straight through and drop the container.
 *
 * Thin wrapper: every prop maps to the inner `Button` unchanged
 * (`testID`/`style`/`ref` address the pressable, where presses and
 * style queries belong); the outer container carries only the link
 * role. No `loading` and no `accessibilityLabelledBy` — this is the
 * minimal link subset. `disabled` is terminal via `Button`: no
 * callbacks, announced as disabled on the inner pressable.
 */

export type LinkButtonProps = {
  /** Fires on press. Suppressed while `disabled` (via inner `Button`). */
  onPress?: () => void;
  /** Terminal: no callbacks, announced as disabled on the inner pressable. */
  disabled?: boolean;
  /** Accessible name source for the inner pressable. */
  accessibilityLabel?: string;
  /** Inner pressable testID (presses target the button, not the container). */
  testID?: string;
  /** Inner pressable style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Caller-provided content rendered inside the inner pressable. */
  children?: ReactNode;
  /** Forwarded to the inner pressable host element (via `Button`). */
  ref?: ButtonProps["ref"];
};

export function LinkButton({
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  ref,
}: LinkButtonProps): React.JSX.Element {
  return (
    <View accessible accessibilityRole="link">
      <Button
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={style}
        ref={ref}
      >
        {children}
      </Button>
    </View>
  );
}
