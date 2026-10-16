import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Button, type ButtonProps } from "./Button";

/**
 * LoadingButton — a `Button` forced into the busy state.
 *
 * Structure only: the Axis `Button` with `loading` defaulting to `true`
 * (busy announced, `onPress` suppressed). No default visuals and no
 * spinner — the caller swaps `children` to reflect the busy state
 * (e.g. `"Saving…"`, exactly as with `Button`), nothing renders here.
 * All other props pass straight through to `Button` unchanged;
 * `disabled` stays terminal alongside `loading` (either one suppresses
 * `onPress`, per the `Button` contract).
 */

export type LoadingButtonProps = {
  /**
   * Busy: suppresses `onPress`, announced as busy. Default `true` —
   * this variant exists to be busy; pass `false` explicitly for the
   * plain-button shape (then it behaves exactly like `Button`).
   * The caller swaps `children` for the busy state — nothing renders here.
   */
  loading?: boolean;
  /** Fires on press. Suppressed while `disabled` or `loading`. */
  onPress?: () => void;
  /** Terminal: no callbacks, announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /** Native labelled-by association where the platform supports it. */
  accessibilityLabelledBy?: string;
  testID?: string;
  /** Root pressable style. */
  style?: StyleProp<ViewStyle>;
  /** Caller-provided content. Swapped by the caller for the busy state. */
  children?: ReactNode;
  /** Forwarded to the root pressable host element (via `Button`). */
  ref?: ButtonProps["ref"];
};

export function LoadingButton({
  loading = true,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityLabelledBy,
  testID,
  style,
  children,
  ref,
}: LoadingButtonProps): React.JSX.Element {
  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      accessibilityLabel={accessibilityLabel}
      accessibilityLabelledBy={accessibilityLabelledBy}
      testID={testID}
      style={style}
      ref={ref}
    >
      {children}
    </Button>
  );
}
