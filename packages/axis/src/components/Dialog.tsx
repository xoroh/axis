import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { OverlayPortal, OverlayRoot } from "./Overlay";

/**
 * Dialog — a compound modal dialog (Base UI parity).
 *
 * `DialogRoot` owns open state (renders no element); `DialogTrigger`
 * toggles; `DialogPortal` presents at the app's portal host;
 * `DialogBackdrop` is the dismiss scrim; `DialogPopup` is the
 * surface; `DialogTitle`/`DialogDescription` are text;
 * `DialogClose` closes. No default visuals — every visual value is
 * caller-provided. Open state follows the `useControllableState`
 * pattern: `open` (+ `onOpenChange`) for controlled use,
 * `defaultOpen` for uncontrolled (default `false`). Scrim or
 * request-close dismissal fires `onDismiss` first, then reports
 * `false`; `disablePointerDismissal` on the root keeps the scrim
 * present but inert — no fake affordance — which is the
 * non-dismissable shape an `AlertDialog` consumer needs.
 *
 * Deferred, each for a named reason (not oversight):
 * - No animation: the surface mounts/unmounts synchronously with
 *   state (parity D9). The overlay root's `presence` machine is wired
 *   for the first consumer that drives an exit animation.
 * - No focus CONTAINMENT: the overlay root moves accessibility focus
 *   into the surface on open and restores it to the trigger on
 *   close, and declares `accessibilityViewIsModal`; traversal
 *   trapping still needs the `focusTrap` RN adaptation (parity D5,
 *   no DOM tab order to borrow).
 *
 * Accessibility notes: the popup is an accessibility element
 * (`accessible`) so the `dialog` role reaches assistive tech — a
 * role on a non-element `View` would be invisible to it.
 *
 * Test ids: the popup carries `testID`; the backdrop carries
 * `<testID>-scrim` when `testID` is given (the Accordion `-panel`
 * precedent).
 */

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: DialogPopupProps["ref"],
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

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* The parts below mirror Base UI's Dialog anatomy — Root (state       */
/* owner, renders no element), Trigger, Portal (the overlay root at   */
/* `PortalHost`),                                                     */
/* Backdrop (the scrim), Popup (the surface), Title, Description,      */
/* Close — with `render` element/function composition and              */
/* value-or-function `style` on every part. Omitted Base UI pieces     */
/* are documented deviations, not oversights: no `Viewport` (a Popup   */
/* scrolls through caller `ScrollView` content), no                    */
/* `initialFocus`/`finalFocus` or `"trap-focus"` focus containment     */
/* (needs the `focusTrap` RN adaptation), no nested-dialog             */
/* coordination beyond the overlay root's stack, no                   */
/* `createHandle` detached triggers (needs an imperative registry      */
/* owner), no `Portal` `container`/`keepMounted` (no DOM container     */
/* exists; keep-alive would ship behavior no suite can observe —        */
/* invisible modal subtrees hide from RNTL exactly like the platform    */
/* hides them), and no `data-*` attributes (RN hosts reject unknown     */
/* props; the same state objects flow through function `style`/`render` */
/* props instead).                                                      */
/* ------------------------------------------------------------------ */

export type DialogRootState = {
  open: boolean;
};

export type DialogRootProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed open or dismissal. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on backdrop (or request-close) dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * When `true`, backdrop press does not dismiss. Default `false`.
   */
  disablePointerDismissal?: boolean;
  /**
   * Kept for Base UI parity. The surface always presents modally on
   * native; `"trap-focus"` is accepted but focus containment still
   * needs the `focusTrap` RN adaptation (documented, not silent —
   * see the module note).
   */
  modal?: boolean | "trap-focus";
  /** Trigger, Portal, and shared content. Renders no element itself. */
  children?: ReactNode;
};

export type DialogTriggerState = {
  /** Whether the dialog is currently open. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export type DialogTriggerProps = {
  /** Terminal: it never opens and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of trigger state, caller-provided. */
  style?: StateStyle<DialogTriggerState, StyleProp<ViewStyle>>;
  /** Trigger content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<DialogTriggerState, SlotProps>;
};

export type DialogBackdropState = {
  /** Whether the dialog is currently open. */
  open: boolean;
};

export type DialogBackdropProps = {
  testID?: string;
  /** Value or function of backdrop state, caller-provided. */
  style?: StateStyle<DialogBackdropState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * scrim host; dismissal wiring stays on the part.
   */
  render?: RenderProp<DialogBackdropState, SlotProps>;
};

export type DialogPopupState = {
  /** Whether the dialog is currently open. */
  open: boolean;
};

export type DialogPopupProps = {
  /** Accessible name source for the surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of popup state, caller-provided. */
  style?: StateStyle<DialogPopupState, StyleProp<ViewStyle>>;
  /** Surface content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * surface host; role and label stay on the part.
   */
  render?: RenderProp<DialogPopupState, SlotProps>;
  /** Forwarded to the surface `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type DialogTitleProps = {
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Heading content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type DialogDescriptionProps = {
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Description content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type DialogCloseState = {
  /** Whether the button is currently disabled. */
  disabled: boolean;
};

export type DialogCloseProps = {
  /** Terminal: it never closes and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of close state, caller-provided. */
  style?: StateStyle<DialogCloseState, StyleProp<ViewStyle>>;
  /** Button content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<DialogCloseState, SlotProps>;
};

export type DialogPortalProps = {
  /** Portal content (Backdrop + Popup composed by the caller). */
  children?: ReactNode;
  testID?: string;
};

type DialogCompoundDisclosure = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  dismiss: () => void;
  disablePointerDismissal: boolean;
};

/**
 * Shared open state for the compound parts. Internal (not exported):
 * parts must render inside a `DialogRoot` to participate; outside
 * one triggers render collapsed and inert, closers no-op, and
 * portal/backdrop/popup content renders nothing.
 */
const DialogCompoundContext = createContext<DialogCompoundDisclosure | null>(
  null,
);

export function DialogRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  disablePointerDismissal = false,
  modal = true,
  children,
}: DialogRootProps): React.JSX.Element {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const toggle = useCallback(() => {
    setOpen((previous) => !(previous ?? false));
  }, [setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Backdrop/request-close path: `onDismiss` first, then report
  // `false` — guarded on `disablePointerDismissal` so a
  // non-dismissable dialog (and the platform back button) cannot
  // close it.
  const dismiss = useCallback(() => {
    if (disablePointerDismissal) return;
    onDismiss?.();
    setOpen(false);
  }, [disablePointerDismissal, onDismiss, setOpen]);

  const disclosure = useMemo<DialogCompoundDisclosure>(
    () => ({
      open: isOpen ?? false,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
    }),
    [isOpen, toggle, close, dismiss, disablePointerDismissal],
  );

  // The root owns state, never layout: no host element (Base UI parity).
  return (
    <OverlayRoot
      open={isOpen}
      onOpenChange={setOpen}
      onDismiss={onDismiss}
      modal={modal}
      dismissable={!disablePointerDismissal}
      dismiss={{
        outsidePointer: !disablePointerDismissal,
        systemBack: !disablePointerDismissal,
        escape: !disablePointerDismissal,
      }}
    >
      <DialogCompoundContext.Provider value={disclosure}>
        {children}
      </DialogCompoundContext.Provider>
    </OverlayRoot>
  );
}

export function DialogTrigger({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: DialogTriggerProps): React.ReactNode {
  const disclosure = useContext(DialogCompoundContext);
  const open = disclosure?.open ?? false;
  const state: DialogTriggerState = { open, disabled };

  const toggleTrigger = useCallback(() => {
    if (disabled) return;
    disclosure?.toggle();
  }, [disabled, disclosure]);

  // Outside a root there is no dialog to open: render inert
  // (announced disabled, press is a no-op) rather than dropping the
  // node silently (the `MenuItem` precedent).
  const inert = disclosure === null;
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { expanded: open, disabled: disabled || inert },
      accessibilityLabel,
      testID,
      disabled: disabled || inert,
      onPress: toggleTrigger,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open, disabled: disabled || inert }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled || inert}
      onPress={toggleTrigger}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function DialogPortal({
  children,
  testID,
}: DialogPortalProps): React.JSX.Element | null {
  const disclosure = useContext(DialogCompoundContext);
  // Outside a root there is no open state to present: render nothing.
  if (!disclosure) return null;
  if (!disclosure.open) return null;

  // The portal host: the overlay root paints at the app's `PortalHost`
  // (the native equivalent of appending to `body`). `container` and
  // `keepMounted` have no honest native mapping and are omitted by
  // design (documented above): RNTL and the platform both hide
  // invisible modal subtrees entirely, so a keep-alive prop would
  // ship behavior no suite can observe — the contract rejects
  // import-success-only surface.
  //
  // The disclosure is re-provided inside the portal: portaled content
  // renders at the host, outside this root's subtree, so without an
  // explicit provider the parts below would read a null disclosure.
  return (
    <OverlayPortal testID={testID}>
      <DialogCompoundContext.Provider value={disclosure}>
        {children}
      </DialogCompoundContext.Provider>
    </OverlayPortal>
  );
}

export function DialogBackdrop({
  testID,
  style,
  render,
}: DialogBackdropProps): React.ReactNode {
  const disclosure = useContext(DialogCompoundContext);
  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: DialogBackdropState = { open: disclosure.open };

  if (!disclosure.disablePointerDismissal) {
    const substituted = resolveRender(
      render,
      {
        accessibilityLabel: "Dismiss",
        testID,
        onPress: disclosure.dismiss,
        style: resolveStyle(style, state),
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        accessibilityLabel="Dismiss"
        testID={testID}
        onPress={disclosure.dismiss}
        style={resolveStyle(style, state)}
      />
    );
  }

  // Non-dismissable: a plain host with no label and no handler — no
  // fake affordance.
  const substituted = resolveRender(
    render,
    { testID, style: resolveStyle(style, state) } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return <View testID={testID} style={resolveStyle(style, state)} />;
}

export function DialogPopup({
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: DialogPopupProps): React.ReactNode {
  const disclosure = useContext(DialogCompoundContext);

  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: DialogPopupState = { open: disclosure.open };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      role: "dialog",
      accessibilityRole: "dialog",
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setPopupRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setPopupRef}
      accessible
      role="dialog"
      accessibilityRole="dialog"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      {children}
    </View>
  );
}

export function DialogTitle({
  testID,
  style,
  children,
  render,
}: DialogTitleProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text accessibilityRole="header" testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function DialogDescription({
  testID,
  style,
  children,
  render,
}: DialogDescriptionProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function DialogClose({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: DialogCloseProps): React.ReactNode {
  const disclosure = useContext(DialogCompoundContext);
  const state: DialogCloseState = { disabled };

  const closeDialog = useCallback(() => {
    if (disabled) return;
    disclosure?.close();
  }, [disabled, disclosure]);

  // Outside a root there is nothing to close: render inert rather
  // than dropping the node silently.
  const inert = disclosure === null;
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { disabled: disabled || inert },
      accessibilityLabel,
      testID,
      disabled: disabled || inert,
      onPress: closeDialog,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || inert }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled || inert}
      onPress={closeDialog}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}
