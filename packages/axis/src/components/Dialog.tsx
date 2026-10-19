import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  OverlayPortal,
  OverlayRoot,
  useOverlayMaybe,
  useOverlayRefsMaybe,
} from "./Overlay";
import {
  createFocusScope,
  type FocusScope,
  FocusScopeProvider,
  isWebEnvironment,
  type OverlayFocusValue,
  trapTabKey,
  useFocusScopeMaybe,
  useModalFocus,
  useScopeStop,
  useScopeTitle,
  webTabIndexProps,
} from "./useAccessibilityFocus";
import type {
  OverlayOpenChangeDetails,
  OverlayOpenChangeReason,
} from "../dismissWiring";

/**
 * Dialog — an unstyled modal dialog with scrim dismissal.
 *
 * Structure only: the `Overlay` root painting at the app's
 * `PortalHost`, holding a scrim layer with the dialog surface inside
 * it. No default visuals — every visual value (`overlayStyle`,
 * `surfaceStyle`, `titleStyle`) is caller-provided. State follows the
 * `useControllableState` pattern: `open` (+ `onOpenChange`) for
 * controlled use, `defaultOpen` for uncontrolled (default `false`).
 * Presence is mount/unmount: closed renders `null`, open paints the
 * surface at the host. When `dismissable` (default `true`) the scrim
 * is a `Pressable` labelled "Dismiss" and scrim press closes via
 * `onDismiss` + `onOpenChange(false)`; when `false` the scrim is a
 * plain `View` with no label and no handler — no fake affordance —
 * which is the non-dismissable shape an `AlertDialog` consumer needs
 * (dismissal then comes only from the caller's own action buttons).
 * Android system back is wired to the same dismiss path and no-ops
 * when not `dismissable` (the `Overlay` root owns it, topmost
 * surface only).
 *
 * Deferred, each for a named reason (not oversight):
 * - No animation: the surface mounts/unmounts synchronously with
 *   state (parity D9). The overlay root's `presence` machine is wired
 *   for the first consumer that drives an exit animation.
 * - Focus containment: on iOS the surface claims
 *   `accessibilityViewIsModal`; on Android the app root takes
 *   `importantForAccessibility="no-hide-descendants"` while the modal
 *   is open (see `useModalActive`); on web the surface carries
 *   `aria-modal` and traps Tab. SR focus moves into the surface on
 *   open; there is no trigger to restore to, so close leaves focus
 *   where dismissal left it.
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
  /** Fires with the next open state on every committed dismiss, with the reason. */
  onOpenChange?: (open: boolean, details?: OverlayOpenChangeDetails) => void;
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

  // The surface node: the focus executor below moves SR focus here
  // on open (the monolith builds its surface inline, not through
  // `OverlayPopup`, so it executes its own focus — exactly one
  // executor per surface).
  const surfaceFocusRef = useRef<ElementRef<typeof View> | null>(null);

  // The single focus executor for this surface: move in on open (the
  // surface itself is the default target — the monolith has no Title
  // part to prefer). No trigger exists, so restore falls back to an
  // explicit `finalFocus`... which the monolith does not take: close
  // leaves focus where dismissal left it.
  useModalFocus({
    open: isOpen ?? false,
    popupRef: surfaceFocusRef,
    restoreRef: { current: null },
  });

  // Always wired to the overlay root's system-back branch, and the scrim's press
  // handler when dismissable: closes through `onDismiss` first, then
  // reports `false`. Guards on `dismissable` so the non-dismissable
  // shape (and the platform back button) cannot close the dialog.
  const dismiss = useCallback(
    (reason: OverlayOpenChangeReason = "outside-press") => {
      if (!dismissable) return;
      onDismiss?.();
      setOpen(false, { reason });
    },
    [dismissable, onDismiss, setOpen],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      surfaceFocusRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  // Closed presence: nothing mounted, so no scrim, no surface, and no
  // portal host for assistive tech or tests to find.
  if (!isOpen) return null;

  // The monolith is always modal: the surface claims iOS modality
  // itself (no overlay context exists above the monolith to gate on
  // topmost — monoliths do not nest). On web the same modality is
  // `aria-modal` plus the Tab trap.
  const web = isWebEnvironment();
  const handleSurfaceKeyDown = web
    ? (event: { key?: unknown; shiftKey?: unknown; preventDefault?: unknown }) =>
        trapTabKey(surfaceFocusRef.current, event)
    : undefined;

  const surface = (
    <View
      ref={setHostRef}
      accessible
      role="dialog"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onAccessibilityEscape={() => dismiss("escape-key")}
      accessibilityViewIsModal
      {...(web ? { "aria-modal": true } : null)}
      onKeyDown={handleSurfaceKeyDown}
      {...webTabIndexProps(web)}
      style={surfaceStyle}
    >
      {title != null ? <Text style={titleStyle}>{title}</Text> : null}
      {children}
      {actions != null ? <View>{actions}</View> : null}
    </View>
  );

  return (
    <OverlayRoot
      open={isOpen}
      onOpenChange={setOpen}
      onDismiss={dismiss}
      modal
      dismissable={dismissable}
      dismiss={{
        outsidePointer: dismissable,
        systemBack: dismissable,
        escape: dismissable,
      }}
    >
      <OverlayPortal>
        {dismissable ? (
          <Pressable
            accessibilityLabel="Dismiss"
            testID={testID ? `${testID}-scrim` : undefined}
            onPress={() => dismiss("outside-press")}
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
      </OverlayPortal>
    </OverlayRoot>
  );
}

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* `<Dialog>` above is the concise single-part API. The parts below    */
/* mirror Base UI's Dialog anatomy — Root (state owner, renders no     */
/* element), Trigger, Portal (the overlay root at `PortalHost`),      */
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
  /** Fires with the next open state on every committed open or dismissal, with the reason. */
  onOpenChange?: (open: boolean, details?: OverlayOpenChangeDetails) => void;
  /** Fires on backdrop (or request-close) dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * When `true`, backdrop press does not dismiss (Base UI parity name
   * for the monolith's `dismissable={false}`). Default `false`.
   */
  disablePointerDismissal?: boolean;
  /**
   * Kept for Base UI parity. The surface always presents modally on
   * native; `"trap-focus"` behaves as modal. Default `true`.
   */
  modal?: boolean | "trap-focus";
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
  /**
   * Surface role. Default `"dialog"`; `AlertDialog` passes
   * `"alertdialog"` (the upstream AlertDialog precedent — a blocking
   * dialog announces as an alert dialog, not a plain dialog).
   */
  role?: "dialog" | "alertdialog";
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
  /**
   * Explicit initial focus target (wins over the root's). Element, ref,
   * function of the open interaction, or `false` to keep focus where
   * it is. Default: first focusable element in the popup (marked
   * initial, else first stop, else Title), else the popup itself —
   * on native from the part registry, on web from the DOM.
   */
  initialFocus?: OverlayFocusValue;
  /**
   * Explicit restore target (wins over the trigger). See
   * `OverlayRootProps.finalFocus` for the value shape.
   */
  finalFocus?: OverlayFocusValue;
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
  /**
   * Mark this Close as the default initial focus target (how AlertDialog
   * marks Cancel — Axis cannot infer destructiveness). The marked Close
   * wins over first-stop/title defaults. Default `false`.
   */
  initialFocus?: boolean;
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
  /** Dismiss with a reason (default `"outside-press"`). */
  dismiss: (reason?: OverlayOpenChangeReason) => void;
  disablePointerDismissal: boolean;
  modal: boolean | "trap-focus";
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
  initialFocus,
  finalFocus,
  children,
}: DialogRootProps): React.JSX.Element {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const toggle = useCallback(() => {
    setOpen((previous) => !(previous ?? false), {
      reason: "trigger-press",
    });
  }, [setOpen]);

  const close = useCallback(() => {
    setOpen(false, { reason: "close-press" });
  }, [setOpen]);

  // Backdrop/request-close path: `onDismiss` first, then report
  // `false` — guarded on `disablePointerDismissal` so a
  // non-dismissable dialog (and the platform back button) cannot
  // close it.
  const dismiss = useCallback(
    (reason: OverlayOpenChangeReason = "outside-press") => {
      if (disablePointerDismissal) return;
      onDismiss?.();
      setOpen(false, { reason });
    },
    [disablePointerDismissal, onDismiss, setOpen],
  );

  const disclosure = useMemo<DialogCompoundDisclosure>(
    () => ({
      open: isOpen ?? false,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
    }),
    [isOpen, toggle, close, dismiss, disablePointerDismissal, modal],
  );

  // The root owns state, never layout: no host element (Base UI parity).
  return (
    <OverlayRoot
      open={isOpen}
      onOpenChange={setOpen}
      onDismiss={onDismiss}
      modal={modal}
      dismissable={!disablePointerDismissal}
      initialFocus={initialFocus}
      finalFocus={finalFocus}
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
  // Bridge the trigger node into the overlay: `OverlayRoot` restores
  // SR focus here on close. Outside a root there is no overlay — the
  // bridge is a no-op and the trigger stays inert (see below).
  const overlayRefs = useOverlayRefsMaybe();

  const toggleTrigger = useCallback(() => {
    if (disabled) return;
    // The trigger press is the open interaction for function-form
    // focus targets (read by the popup's focus hook on open).
    if (overlayRefs) overlayRefs.interaction.current = "trigger-press";
    disclosure?.toggle();
  }, [disabled, disclosure, overlayRefs]);

  const setTriggerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      if (overlayRefs) overlayRefs.triggerRef.current = node;
    },
    [overlayRefs],
  );

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
      ref: setTriggerRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setTriggerRef}
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
  // NOTE: no `open` gate here — the portal stays mounted through the
  // exit commit so the popup's focus hook observes the close
  // transition and restores focus; `OverlayPortal` (presence-gated)
  // and the parts below still paint nothing while closed.
  if (!disclosure) return null;

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
    // Reason is explicit: the backdrop press is the outside-press
    // dismiss path (never the raw press event).
    const handlePress = () => disclosure.dismiss("outside-press");
    const substituted = resolveRender(
      render,
      {
        accessibilityLabel: "Dismiss",
        testID,
        onPress: handlePress,
        style: resolveStyle(style, state),
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        accessibilityLabel="Dismiss"
        testID={testID}
        onPress={handlePress}
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
  role = "dialog",
  testID,
  style,
  children,
  render,
  ref,
  initialFocus,
  finalFocus,
}: DialogPopupProps): React.ReactNode {
  const disclosure = useContext(DialogCompoundContext);
  // Bridge into the overlay's focus refs: the compound popup is the
  // surface the focus hook moves SR focus into on open, and the trigger
  // (bridged in `DialogTrigger`) is where it restores on close.
  // Outside a root there is no overlay — the bridge is a no-op.
  const overlayRefs = useOverlayRefsMaybe();
  const overlay = useOverlayMaybe();

  // Hooks before guards: the focus node ref and scope must exist on
  // every render, and the focus wiring below no-ops while closed.
  const popupNodeRef = useRef<ElementRef<typeof View> | null>(null);
  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      popupNodeRef.current = node;
      if (overlayRefs) overlayRefs.popupRef.current = node;
      assignRef(ref, node);
    },
    [overlayRefs, ref],
  );

  // One focus scope per popup: Title/Close parts register here so the
  // default initial target resolves without a DOM query on native.
  const focusScope = useMemo<FocusScope>(() => createFocusScope(), []);

  const open = disclosure?.open ?? false;
  const modal = disclosure?.modal ?? true;
  // The single focus executor for this surface. Default target: first
  // focusable element (marked initial, else first stop, else Title),
  // else the popup itself. Explicit popup props win over the root's.
  useModalFocus({
    open,
    initialFocus: initialFocus ?? overlay?.initialFocus,
    finalFocus: finalFocus ?? overlay?.finalFocus,
    scope: focusScope,
    interactionRef: overlayRefs?.interaction,
    sharedState: overlayRefs?.focus,
    popupRef: popupNodeRef,
    restoreRef: overlayRefs?.triggerRef ?? { current: null },
  });

  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: DialogPopupState = { open: disclosure.open };

  // iOS VoiceOver scrub dismisses — the bound form of the `escape`
  // branch, reported as `escape-key`. Guarded on
  // `disablePointerDismissal` so a blocking `AlertDialog` keeps
  // ignoring it (deliberate, recorded).
  const handleAccessibilityEscape = !disclosure.disablePointerDismissal
    ? () => disclosure.dismiss("escape-key")
    : undefined;

  // iOS modal claim on the popup (top layer only — stacked layers
  // never hide each other). Non-modal popups claim nothing. On web the
  // same modality is `aria-modal` plus the Tab trap below.
  const top = overlay?.isTop ?? true;
  const modalActive = modal && top;
  const web = isWebEnvironment();
  const handleKeyDown =
    web && modalActive
      ? (event: { key?: unknown; shiftKey?: unknown; preventDefault?: unknown }) =>
          trapTabKey(popupNodeRef.current, event)
      : undefined;

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      role,
      accessibilityRole: role,
      accessibilityLabel,
      testID,
      onAccessibilityEscape: handleAccessibilityEscape,
      accessibilityViewIsModal: modalActive,
      ...(web && modalActive ? { "aria-modal": true } : null),
      onKeyDown: handleKeyDown,
      ...webTabIndexProps(web),
      style: resolveStyle(style, state),
      children,
      ref: setPopupRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null)
    return (
      <FocusScopeProvider scope={focusScope}>{substituted}</FocusScopeProvider>
    );

  return (
    <FocusScopeProvider scope={focusScope}>
      <View
        ref={setPopupRef}
        accessible
        role={role}
        accessibilityRole={role}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        onAccessibilityEscape={handleAccessibilityEscape}
        accessibilityViewIsModal={modalActive}
        {...(web && modalActive ? { "aria-modal": true } : null)}
        onKeyDown={handleKeyDown}
        {...webTabIndexProps(web)}
        style={resolveStyle(style, state)}
      >
        {children}
      </View>
    </FocusScopeProvider>
  );
}

export function DialogTitle({
  testID,
  style,
  children,
  render,
}: DialogTitleProps): React.ReactNode {
  const scope = useFocusScopeMaybe();
  const setTitleNode = useScopeTitle(scope);
  const web = isWebEnvironment();

  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      children,
      ref: setTitleNode,
      ...webTabIndexProps(web),
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text
      ref={setTitleNode}
      accessibilityRole="header"
      testID={testID}
      style={style}
      {...webTabIndexProps(web)}
    >
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
  initialFocus = false,
}: DialogCloseProps): React.ReactNode {
  const disclosure = useContext(DialogCompoundContext);
  const state: DialogCloseState = { disabled };
  // Register as a focus stop — or as the marked initial target when
  // the caller flags it (how AlertDialog marks Cancel).
  const scope = useFocusScopeMaybe();
  const setCloseNode = useScopeStop(scope, initialFocus);

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
      ref: setCloseNode,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setCloseNode}
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
