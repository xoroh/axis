import type { ElementRef, ReactNode, Ref } from "react";
import type { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import type { OverlayOpenChangeDetails } from "../dismissWiring";
import type { RenderProp, StateStyle } from "../render";
import type { SlotProps } from "../slot";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";
import type { OverlayFocusValue } from "./useAccessibilityFocus";

/**
 * AlertDialog — a blocking dialog that only closes through its actions.
 *
 * Compound anatomy per Base UI (Root, Trigger, Portal, Backdrop,
 * Popup, Title, Description, Close), sharing the `Dialog` compound
 * implementation with the blocking contract forced: the root always
 * sets `disablePointerDismissal`, the backdrop is inert (no dismiss
 * label, no handler), and the popup carries `role="alertdialog"`.
 * Blocking means blocking: scrim press, Android hardware back, and
 * iOS VoiceOver scrub all no-op — closing happens only through the
 * caller's own action buttons calling back (typically
 * `onOpenChange(false)`).
 *
 * Focus: SR focus moves into the popup on open; the default initial
 * target is the element the caller marks least destructive via
 * `initialFocus` on `AlertDialogClose` (typically Cancel — Axis cannot
 * infer destructiveness), else the first stop/title default, else the
 * popup. Restore goes to the trigger or `finalFocus`.
 *
 * Test ids: the popup carries `testID`; the backdrop carries
 * `<testID>-scrim` when `testID` is given (the Dialog precedent).
 */

export type AlertDialogRootProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state; actions report `false` through here, with the reason. */
  onOpenChange?: (open: boolean, details?: OverlayOpenChangeDetails) => void;
  /**
   * Explicit initial focus target (wins over the popup's). See
   * `OverlayRootProps.initialFocus` for the value shape.
   */
  initialFocus?: OverlayFocusValue;
  /**
   * Explicit restore target (wins over the trigger). See
   * `OverlayRootProps.finalFocus` for the value shape.
   */
  finalFocus?: OverlayFocusValue;
  /** Trigger, Portal, and shared content. Renders no element itself. */
  children?: ReactNode;
};

export type AlertDialogRootState = {
  /** Whether the dialog is currently open. */
  open: boolean;
};

export function AlertDialogRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  initialFocus,
  finalFocus,
  children,
}: AlertDialogRootProps): React.JSX.Element {
  return (
    <DialogRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      // Forced, never caller-provided: a blocking dialog must not
      // dismiss from the scrim (or the request-close path).
      disablePointerDismissal
      modal
      initialFocus={initialFocus}
      finalFocus={finalFocus}
    >
      {children}
    </DialogRoot>
  );
}

export type AlertDialogTriggerProps = {
  /** Terminal: it never opens and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Value or function of trigger state, caller-provided. */
  style?: StateStyle<AlertDialogTriggerState, StyleProp<ViewStyle>>;
  /** Trigger content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<AlertDialogTriggerState, SlotProps>;
};

export type AlertDialogTriggerState = {
  /** Whether the dialog is currently open. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export function AlertDialogTrigger(
  props: AlertDialogTriggerProps,
): React.ReactNode {
  return <DialogTrigger {...props} />;
}

export type AlertDialogPortalProps = {
  /** Portal content (Backdrop + Popup composed by the caller). */
  children?: ReactNode;
  testID?: string;
};

export function AlertDialogPortal(
  props: AlertDialogPortalProps,
): React.JSX.Element | null {
  return <DialogPortal {...props} />;
}

export type AlertDialogBackdropProps = {
  testID?: string;
  /** Value or function of backdrop state, caller-provided. */
  style?: StateStyle<AlertDialogBackdropState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * scrim host; dismissal wiring stays on the part.
   */
  render?: RenderProp<AlertDialogBackdropState, SlotProps>;
};

export type AlertDialogBackdropState = {
  /** Whether the dialog is currently open. */
  open: boolean;
};

export function AlertDialogBackdrop(
  props: AlertDialogBackdropProps,
): React.ReactNode {
  // Inert by construction: the root forces `disablePointerDismissal`,
  // so the Dialog backdrop renders its plain host here.
  return <DialogBackdrop {...props} />;
}

export type AlertDialogPopupState = {
  /** Whether the dialog is currently open. */
  open: boolean;
};

export type AlertDialogPopupProps = {
  /** Accessible name source for the dialog surface (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Value or function of popup state, caller-provided. */
  style?: StateStyle<AlertDialogPopupState, StyleProp<ViewStyle>>;
  /** Surface content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * surface host; the alertdialog role stays on the part.
   */
  render?: RenderProp<AlertDialogPopupState, SlotProps>;
  /** Forwarded to the surface `View`. */
  ref?: Ref<ElementRef<typeof View>>;
  /**
   * Explicit initial focus target (wins over the root's). Element, ref,
   * function of the open interaction, or `false` to keep focus where
   * it is. Default: the marked `AlertDialogClose`, else first
   * stop/title default, else the popup itself.
   */
  initialFocus?: OverlayFocusValue;
  /**
   * Explicit restore target (wins over the trigger). See
   * `OverlayRootProps.finalFocus` for the value shape.
   */
  finalFocus?: OverlayFocusValue;
};

export function AlertDialogPopup({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
  initialFocus,
  finalFocus,
}: AlertDialogPopupProps): React.ReactNode {
  return (
    <DialogPopup
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      role="alertdialog"
      testID={testID}
      style={style}
      render={render}
      ref={ref}
      initialFocus={initialFocus}
      finalFocus={finalFocus}
    >
      {children}
    </DialogPopup>
  );
}

export type AlertDialogTitleProps = {
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Heading content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function AlertDialogTitle(
  props: AlertDialogTitleProps,
): React.ReactNode {
  return <DialogTitle {...props} />;
}

export type AlertDialogDescriptionProps = {
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Description content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function AlertDialogDescription(
  props: AlertDialogDescriptionProps,
): React.ReactNode {
  return <DialogDescription {...props} />;
}

export type AlertDialogCloseState = {
  /** Whether the button is currently disabled. */
  disabled: boolean;
};

export type AlertDialogCloseProps = {
  /** Terminal: it never closes and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Value or function of close state, caller-provided. */
  style?: StateStyle<AlertDialogCloseState, StyleProp<ViewStyle>>;
  /** Button content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<AlertDialogCloseState, SlotProps>;
  /**
   * Mark this Close as the default initial focus target (how
   * AlertDialog marks Cancel — Axis cannot infer destructiveness).
   * Default `false`.
   */
  initialFocus?: boolean;
};

export function AlertDialogClose(
  props: AlertDialogCloseProps,
): React.ReactNode {
  // The `initialFocus` marker prop marks this Close as the default
  // initial target (Cancel) — see `DialogClose`.
  return <DialogClose {...props} />;
}
