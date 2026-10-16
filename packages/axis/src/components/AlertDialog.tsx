import type { ElementRef, ReactNode, Ref } from "react";
import type { StyleProp, View, ViewStyle } from "react-native";
import { Dialog } from "./Dialog";

/**
 * AlertDialog — a blocking dialog that only closes through its actions.
 *
 * A thin wrapper around `Dialog` (in-`src` composition): every prop
 * maps straight through, except dismissal is removed. `dismissable`
 * is forced to `false` always — the prop is not accepted at all (it
 * is omitted from this type), so no caller can accidentally make a
 * blocking dialog dismissable. The scrim renders with no dismiss
 * label and no handler; closing happens only through the caller's
 * own action buttons calling back (typically `onOpenChange(false)`).
 *
 * `actions` is REQUIRED: a blocking dialog without an explicit action
 * traps the user on the surface with no way out. State follows the
 * `useControllableState` pattern via the inner `Dialog`: `open` (+
 * `onOpenChange`) for controlled use, `defaultOpen` for uncontrolled
 * (default `false`). Presence is mount/unmount: closed renders `null`.
 */

export type AlertDialogProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state; actions report `false` through here. */
  onOpenChange?: (open: boolean) => void;
  /** Dialog title, rendered in a `Text` when provided. */
  title?: ReactNode;
  /** Dialog content. */
  children?: ReactNode;
  /**
   * Action row content. REQUIRED — a blocking dialog with no explicit
   * action leaves the user with no way to leave the surface.
   */
  actions: ReactNode;
  /** Accessible name source for the dialog surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Dialog surface (box) style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Forwarded to the dialog surface `View` (via `Dialog`). */
  ref?: Ref<ElementRef<typeof View>>;
};

export function AlertDialog({
  open,
  defaultOpen = false,
  onOpenChange,
  title,
  children,
  actions,
  accessibilityLabel,
  testID,
  style,
  ref,
}: AlertDialogProps): React.JSX.Element | null {
  return (
    <Dialog
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      // Forced, never caller-provided: a blocking dialog must not
      // dismiss from the scrim (or the request-close path).
      dismissable={false}
      title={title}
      actions={actions}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      surfaceStyle={style}
      ref={ref}
    >
      {children}
    </Dialog>
  );
}
