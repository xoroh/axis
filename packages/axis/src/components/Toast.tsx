import { type ReactNode, useCallback, useEffect } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Toast — a transient notification with timed auto-dismiss.
 *
 * Structure only: a `View` carrying the message content with an optional
 * `Pressable` action, announced politely to screen readers. No default
 * visuals — every visual value (`style`) is caller-provided. State
 * follows the `useControllableState` pattern: `open` (+ `onOpenChange`)
 * for controlled use, `defaultOpen` for uncontrolled. No animation;
 * presence is binary (renders `null` when closed).
 *
 * Accessibility: the root carries `accessibilityLiveRegion="polite"` so
 * the message is announced on appearance. No `accessibilityRole="alert"`:
 * the installed react-native 0.87 types do list `"alert"` in
 * `AccessibilityRole`, but the role is omitted deliberately to keep the
 * surface to the specified props — the live region alone covers the
 * announcement, and callers needing a stronger semantic can wrap the
 * message themselves.
 *
 * Refs: none. The toast exposes no host handle — parents show and hide
 * it through `open`/`defaultOpen`/`onOpenChange`, and the action button
 * is an internal `Pressable`, so there is no element for a caller to
 * drive imperatively. This omission is intentional, not a gap.
 */

export type ToastProps = {
  /** Controlled visibility. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next visibility on every committed open/close. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Auto-dismiss delay in milliseconds. Default `4000`. A value of `0`
   * or less disables auto-dismiss — the toast stays open until the
   * parent closes it or the action fires.
   */
  duration?: number;
  /** Message content. */
  children?: ReactNode;
  /**
   * Action button label. The action button renders only when this is
   * provided — no label, no action button.
   */
  actionLabel?: string;
  /**
   * Fires when the action button is pressed. The toast dismisses as
   * part of the same press.
   */
  onAction?: () => void;
  /** Accessible name source for the toast surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root view style, caller-provided. */
  style?: StyleProp<ViewStyle>;
};

export function Toast({
  open,
  defaultOpen = false,
  onOpenChange,
  duration = 4000,
  children,
  actionLabel,
  onAction,
  accessibilityLabel,
  testID,
  style,
}: ToastProps): React.JSX.Element | null {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const dismiss = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Timed auto-dismiss while open. The timer is cleared on close,
  // on `duration` change, and on unmount; `duration <= 0` arms no
  // timer at all. State updates land inside `act` under test because
  // the suite awaits them through RNTL's async queries.
  useEffect(() => {
    if (!isOpen) return undefined;
    if (duration <= 0) return undefined;
    const timer = setTimeout(dismiss, duration);
    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, duration, dismiss]);

  const handleAction = useCallback(() => {
    onAction?.();
    setOpen(false);
  }, [onAction, setOpen]);

  if (!isOpen) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      <Text>{children}</Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={handleAction}
        >
          <Text>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
