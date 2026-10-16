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
  Modal,
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

/**
 * Dialog — an unstyled modal dialog with scrim dismissal.
 *
 * Structure only: an RN `Modal` (transparent) holding a scrim layer
 * with the dialog surface inside it. No default visuals — every
 * visual value (`overlayStyle`, `surfaceStyle`, `titleStyle`) is
 * caller-provided. State follows the `useControllableState` pattern:
 * `open` (+ `onOpenChange`) for controlled use, `defaultOpen` for
 * uncontrolled (default `false`). Presence is mount/unmount: closed
 * renders `null`, open mounts the `Modal`. When `dismissable`
 * (default `true`) the scrim is a `Pressable` labelled "Dismiss" and
 * scrim press closes via `onDismiss` + `onOpenChange(false)`; when
 * `false` the scrim is a plain `View` with no label and no handler —
 * no fake affordance — which is the non-dismissable shape an
 * `AlertDialog` consumer needs (dismissal then comes only from the
 * caller's own action buttons). `Modal.onRequestClose` is always
 * wired to the same dismiss path and no-ops when not `dismissable`.
 *
 * Deferred, each for a named reason (not oversight):
 * - No animation: the surface mounts/unmounts synchronously with
 *   state. Exit transitions would need the `presence` model to keep
 *   the surface mounted until the animation finishes; until a
 *   consumer needs animated dismissal, that machinery buys zero
 *   observed behavior (the Accordion panel precedent).
 * - No `BackHandler`: hardware-back dismissal beyond what the host
 *   `Modal` already reports through `onRequestClose` on Android needs
 *   a dismissal-stack owner (`overlayModality`/`dismissWiring`); a
 *   lone dialog owning the global back button would fight the stack
 *   the moment a second overlay exists.
 * - No focus trap: containing accessibility focus needs the
 *   `focusTrap` + `overlayModality` models adapted to RN
 *   accessibility-focus traversal (no DOM tab order to borrow);
 *   until that adaptation lands, this surface only declares the
 *   dialog role and label and leaves traversal to the host.
 *
 * Accessibility notes: the surface is an accessibility element
 * (`accessible`) so the `dialog` role reaches assistive tech — a
 * role on a non-element `View` would be invisible to it. The `modal`
 * flag is deliberately omitted from `accessibilityState`: React
 * Native's `AccessibilityState` host type has no `modal` key
 * (checked against the RN 0.87 `ViewAccessibility` types), so it is
 * left out rather than smuggled past the typechecker.
 *
 * Test ids: the surface carries `testID`; the scrim carries
 * `<testID>-scrim` when `testID` is given (the Accordion `-panel`
 * precedent).
 */

export type DialogProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed dismiss. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim (or request-close) dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * When `false`, scrim press does nothing: the scrim renders as a
   * plain `View` with no dismiss label, so the dialog can only close
   * through the caller's own actions. Default `true`.
   */
  dismissable?: boolean;
  /** Dialog title, rendered in a `Text` when provided. */
  title?: ReactNode;
  /** Dialog content. */
  children?: ReactNode;
  /** Action row content, rendered in a `View` row when provided. */
  actions?: ReactNode;
  /** Accessible name source for the dialog surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Scrim layer style, caller-provided. */
  overlayStyle?: StyleProp<ViewStyle>;
  /** Dialog surface (box) style, caller-provided. */
  surfaceStyle?: StyleProp<ViewStyle>;
  /** Title text style, caller-provided. */
  titleStyle?: StyleProp<TextStyle>;
  /** Forwarded to the surface `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: DialogProps["ref"],
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

export function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  dismissable = true,
  title,
  children,
  actions,
  accessibilityLabel,
  testID,
  overlayStyle,
  surfaceStyle,
  titleStyle,
  ref,
}: DialogProps): React.JSX.Element | null {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  // Always wired to `Modal.onRequestClose`, and the scrim's press
  // handler when dismissable: closes through `onDismiss` first, then
  // reports `false`. Guards on `dismissable` so the non-dismissable
  // shape (and the platform back button) cannot close the dialog.
  const dismiss = useCallback(() => {
    if (!dismissable) return;
    onDismiss?.();
    setOpen(false);
  }, [dismissable, onDismiss, setOpen]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  // Closed presence: nothing mounted, so no scrim, no surface, and no
  // Modal host for assistive tech or tests to find.
  if (!isOpen) return null;

  const surface = (
    <View
      ref={setHostRef}
      accessible
      role="dialog"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={surfaceStyle}
    >
      {title != null ? <Text style={titleStyle}>{title}</Text> : null}
      {children}
      {actions != null ? <View>{actions}</View> : null}
    </View>
  );

  return (
    <Modal transparent onRequestClose={dismiss}>
      {dismissable ? (
        <Pressable
          accessibilityLabel="Dismiss"
          testID={testID ? `${testID}-scrim` : undefined}
          onPress={dismiss}
          style={overlayStyle}
        >
          {surface}
        </Pressable>
      ) : (
        <View
          testID={testID ? `${testID}-scrim` : undefined}
          style={overlayStyle}
        >
          {surface}
        </View>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* `<Dialog>` above is the concise single-part API. The parts below    */
/* mirror Base UI's Dialog anatomy — Root (state owner, renders no     */
/* element), Trigger, Portal (an RN `Modal`: the native portal host),  */
/* Backdrop (the scrim), Popup (the surface), Title, Description,      */
/* Close — with `render` element/function composition and              */
/* value-or-function `style` on every part. Omitted Base UI pieces     */
/* are documented deviations, not oversights: no `Viewport` (a Popup   */
/* scrolls through caller `ScrollView` content), no                    */
/* `initialFocus`/`finalFocus` or `"trap-focus"` focus containment     */
/* (needs the `focusTrap` RN adaptation), no nested-dialog             */
/* coordination (nested Modals render independently), no               */
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
   * When `true`, backdrop press does not dismiss (Base UI parity name
   * for the monolith's `dismissable={false}`). Default `false`.
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
  void modal;
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
    <DialogCompoundContext.Provider value={disclosure}>
      {children}
    </DialogCompoundContext.Provider>
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

  // The RN portal host: a transparent `Modal` presents above the app
  // (the native equivalent of appending to `body`). `container` and
  // `keepMounted` have no honest native mapping and are omitted by
  // design (documented above): RNTL and the platform both hide
  // invisible modal subtrees entirely, so a keep-alive prop would
  // ship behavior no suite can observe — the contract rejects
  // import-success-only surface.
  return (
    <Modal
      transparent
      visible={disclosure.open}
      onRequestClose={disclosure.dismiss}
      testID={testID}
    >
      {children}
    </Modal>
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
  // fake affordance (the monolith's `dismissable={false}` precedent).
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
