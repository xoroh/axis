import type { ElementRef, ReactNode, Ref } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import {
  DialogBackdrop,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "./Dialog";

/**
 * AlertDialog — a blocking dialog that only closes through its actions.
 *
 * A thin specialization of the compound `Dialog` parts (in-`src`
 * composition): `DialogRoot` (forced non-dismissable), `DialogPortal`,
 * `DialogBackdrop` (inert — no dismiss label, no handler), and
 * `DialogPopup` carrying the title, content, and REQUIRED action row.
 * `dismissable` is not accepted at all (omitted from this type), so no
 * caller can accidentally make a blocking dialog dismissable. Closing
 * happens only through the caller's own action buttons calling back
 * (typically `onOpenChange(false)`).
 *
 * `actions` is REQUIRED: a blocking dialog without an explicit action
 * traps the user on the surface with no way out. State follows the
 * `useControllableState` pattern: `open` (+ `onOpenChange`) for
 * controlled use, `defaultOpen` for uncontrolled (default `false`).
 * Presence is mount/unmount: closed renders `null` (via `DialogPortal`).
 */

export type AlertDialogState = {
  /** Whether the dialog is currently open. */
  open: boolean;
};

export type AlertDialogProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state; actions report `false` through here. */
  onOpenChange?: (open: boolean) => void;
  /** Dialog title, rendered in a `DialogTitle` when provided. */
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
  /** Dialog surface (box) style: value or function of dialog state. */
  style?: StateStyle<AlertDialogState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity) for the dialog
   * surface: an element is cloned with the popup props merged under
   * its own; a function receives `(props, state)`. Blocking
   * (non-dismissable) semantics stay on the part.
   */
  render?: RenderProp<AlertDialogState, SlotProps>;
  /** Forwarded to the dialog surface `View` (via `DialogPopup`). */
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
  render,
  ref,
}: AlertDialogProps): React.ReactNode {
  // Single state owner: `DialogRoot` below runs controlled off this
  // value, so open state has one source and the function-form `style`
  // reads the same value the portal presents.
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );
  const state: AlertDialogState = { open: isOpen ?? false };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={setOpen}
      // Forced, never caller-provided: a blocking dialog must not
      // dismiss from the scrim (or the request-close path).
      disablePointerDismissal
    >
      <DialogPortal>
        <DialogBackdrop testID={testID ? `${testID}-scrim` : undefined} />
        <DialogPopup
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          style={resolveStyle(style, state)}
          render={render}
          ref={ref}
        >
          {title != null ? <DialogTitle>{title}</DialogTitle> : null}
          {children}
          <View>{actions}</View>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
