import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  BackHandler,
  Modal,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import {
  type DismissBranches,
  dismissBranchesFor,
  type OverlayOpenChangeDetails,
  type OverlayOpenChangeReason,
  shouldDismissOn,
} from "../dismissWiring";
import {
  getSharedOverlayModality,
  type OverlayId,
  type OverlayModalityRegistry,
  useOverlayModality,
  useOverlayRegistration,
} from "../overlayModality";
import { type PresenceState, usePresence } from "../presence";
import {
  type RenderProp,
  resolveRender,
  resolveStyle,
  type StateStyle,
} from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { Portal } from "./Portal";
import {
  type FocusInteraction,
  isWebEnvironment,
  type OverlayFocusValue,
  trapTabKey,
  useModalFocus,
} from "./useAccessibilityFocus";

/**
 * Overlay — the native overlay root on PortalHost (ADR 001/006/007,
 * Base UI layer parity, Kern P0-1 counterpart).
 *
 * Provides a unified foundation for dismissable, modal, layered surfaces:
 * 1. Dismissable layer: outside press (the backdrop) and Android system
 *    back (`BackHandler`), wired through the shared `dismissWiring`
 *    branch set, each reporting an `OverlayOpenChangeReason`.
 * 2. Modal: screen-reader containment — iOS
 *    `accessibilityViewIsModal` on the top popup, Android
 *    background hiding via `useModalActive` on the app root, and on
 *    web `aria-modal` plus a DOM Tab trap — with focus moved into the
 *    surface on open and restored to the trigger / `finalFocus` on
 *    close. There is no DOM tab order to borrow on native, so native
 *    containment is the modality flags plus move/restore, never a
 *    traversal loop (the retired-parity-D5 position).
 * 3. Stacking of nested layers with monotonic `zIndex` and top-layer
 *    interaction isolation (lower layers take no pointer events and hide
 *    from assistive tech).
 * 4. Scroll lock for modal presentation (`useScrollLock`).
 * 5. Presence lifecycle wired for exit animations, with reduced motion
 *    honoured.
 *
 * Presents through `PortalHost` by default, which removes the RN `Modal`
 * nesting trap (one root presents every layer) and keeps stacking,
 * dismissal and focus in one owner. `useModal` opts a surface back into an
 * RN `Modal` host where a platform guarantee genuinely needs it.
 *
 * Documented native limits (parity record, not oversights):
 * - `escape` and `focus-out` are DECLARED in the branch set (platform-free
 *   by design, per `dismissWiring`); on native the bound escape path is
 *   the iOS VoiceOver scrub (`onAccessibilityEscape`) and Android
 *   hardware back (reported as `escape-key`) — React Native has no
 *   global key listener for the Escape key itself.
 * - Exit has no animation to wait for (parity record D9), so a closing surface
 *   unmounts in the same commit; the presence machine stays wired for the
 *   first consumer that drives one.
 */

const FULL_FILL_STYLE: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export type OverlayDismissOptions = {
  /** Whether pressing outside the surface (scrim/backdrop) dismisses it. Default true. */
  outsidePointer?: boolean;
  /** Whether the system back button (Android BackHandler) dismisses it. Default true. */
  systemBack?: boolean;
  /** Whether the Escape key dismisses it. Default true. */
  escape?: boolean;
};

export type OverlayRootState = {
  /** Whether the overlay is currently open. */
  open: boolean;
  /** Whether the overlay presents modally. */
  modal: boolean | "trap-focus";
  /** Whether this overlay is currently topmost in the active stack. */
  isTop: boolean;
  /** Stack index in the overlay stack (0 = base). */
  stackIndex: number;
  /** Whether the overlay is present in the tree (mounted or exiting). */
  present: boolean;
  /** Presence animation state: "mounted" | "exiting" | "unmounted". */
  presenceState: PresenceState;
};

export type OverlayContextValue = {
  id: OverlayId;
  open: boolean;
  modal: boolean | "trap-focus";
  dismissable: boolean;
  dismissBranches: DismissBranches;
  /** Dismiss with a reason (default `"outside-press"`). No-op when not `dismissable`. */
  dismiss: (reason?: OverlayOpenChangeReason) => void;
  /** Close with a reason (default `"close-press"`). Always closes, even when not `dismissable`. */
  close: (reason?: OverlayOpenChangeReason) => void;
  /** Toggle with a reason (default `"trigger-press"`). */
  toggle: (reason?: OverlayOpenChangeReason) => void;
  isTop: boolean;
  stackIndex: number;
  present: boolean;
  presenceState: PresenceState;
  finishExit: () => void;
  useModal: boolean;
  trapFocus: boolean;
  restoreFocus: boolean;
  triggerRef: { current: ElementRef<typeof View> | null };
  popupRef: { current: ElementRef<typeof View> | null };
  initialFocus: OverlayFocusValue;
  finalFocus: OverlayFocusValue;
  reducedMotion: boolean;
};

/** Internal contexts: consumers read them through `useOverlay` and
 * `useScrollLock` (the raw context objects are plumbing, not API —
 * exporting them would invite consumer re-providers with no owner). */
const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * Stable focus-node refs, split from `OverlayContext` on purpose: the
 * full context value changes identity whenever modality settles
 * (registration, top change), which would re-render every part that
 * only needs the ref objects (DialogTrigger's bridge) — one extra
 * render per open on every trigger. This value is built once per root
 * and never changes, so bridgers subscribe for free.
 */
export type OverlayRefs = {
  id: OverlayId;
  triggerRef: { current: ElementRef<typeof View> | null };
  popupRef: { current: ElementRef<typeof View> | null };
  /** How the surface last opened (trigger press vs programmatic). Written by triggers, read by the focus hook. */
  interaction: { current: FocusInteraction };
};

const OverlayRefsContext = createContext<OverlayRefs | null>(null);

const ScrollLockContext = createContext<boolean>(false);

let activeModalCount = 0;
const scrollLockListeners = new Set<(locked: boolean) => void>();

/** Read whether modal scroll lock is currently active. */
export function useScrollLock(): boolean {
  const local = useContext(ScrollLockContext);
  const [globalLocked, setGlobalLocked] = useState(activeModalCount > 0);
  useEffect(() => {
    const listener = (locked: boolean) => setGlobalLocked(locked);
    scrollLockListeners.add(listener);
    return () => {
      scrollLockListeners.delete(listener);
    };
  }, []);
  return local || globalLocked;
}

/** Read the nearest overlay context. Throws outside OverlayRoot. */
export function useOverlay(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error("useOverlay must be used within an OverlayRoot");
  }
  return ctx;
}

/**
 * Read the nearest overlay's stable focus refs, or `null` outside
 * one. Internal (not barrel-exported): lets compound parts that must
 * stay inert without a root (DialogTrigger, DialogPopup) bridge their
 * node into the overlay's focus refs when a root IS present — with no
 * re-render when modality settles, no public API change, and no throw
 * on the inert path.
 */
export function useOverlayRefsMaybe(): OverlayRefs | null {
  return useContext(OverlayRefsContext);
}

/**
 * Read the nearest overlay context, or `null` outside one. Internal
 * (not barrel-exported): family popups that render null without a
 * root need live overlay state (topmost, dismiss) past the inert
 * guard, without the throw.
 */
export function useOverlayMaybe(): OverlayContextValue | null {
  return useContext(OverlayContext);
}

/**
 * Whether any MODAL overlay is currently open in the shared registry.
 * Android app-root wiring (focus adaptation, item 1): while this is
 * true, the app root that sits beside `PortalHost` takes
 * `importantForAccessibility="no-hide-descendants"` so TalkBack
 * stays inside the top modal. Non-modal overlays never count.
 */
export function useModalActive(): boolean {
  return useOverlayModality(getSharedOverlayModality()).isModalActive;
}

export type OverlayRootProps = {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. Default false. */
  defaultOpen?: boolean;
  /** Callback fired when open state changes, with the reason. */
  onOpenChange?: (open: boolean, details?: OverlayOpenChangeDetails) => void;
  /**
   * Whether the overlay presents modally. Default true.
   * Modal overlays trap focus, prevent background interaction, and lock scroll.
   */
  modal?: boolean | "trap-focus";
  /**
   * Whether the overlay can be dismissed by user actions (outside press, back, escape).
   * Default true.
   */
  dismissable?: boolean;
  /** Granular dismissal branch options. */
  dismiss?: OverlayDismissOptions;
  /** Callback fired when dismissed via outside press, back, or escape. */
  onDismiss?: () => void;
  /** Whether to trap focus inside the overlay when modal. Default true. */
  trapFocus?: boolean;
  /**
   * Element, ref, or function receiving the open interaction to receive
   * initial focus upon opening — or `false` to keep focus where it is.
   * Resolution: explicit target, else the focus-scope default (marked,
   * stops, title), else the popup itself. On native "focus" is
   * `setAccessibilityFocus`; on web it is DOM `.focus()`.
   */
  initialFocus?: OverlayFocusValue;
  /**
   * Element, ref, or function to restore focus to upon closing — or
   * `false` to leave focus where dismissal left it. Defaults to the
   * trigger. If the trigger unmounted: on web the nearest focusable
   * ancestor takes it (D11); on native nothing happens, never a throw.
   */
  finalFocus?: OverlayFocusValue;
  /** Whether to restore focus to trigger/finalFocus on close. Default true. */
  restoreFocus?: boolean;
  /** Whether to lock background scroll while open and modal. Default true. */
  preventScroll?: boolean;
  /** Custom overlay modality registry. Defaults to the shared registry. */
  registry?: OverlayModalityRegistry;
  /** Whether to use an RN Modal host instead of PortalHost. Default false. */
  useModal?: boolean;
  children?: ReactNode;
};

/**
 * Assign one value to every ref in the list.
 */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // Frozen ref: leave it alone
    }
  }
}

export function OverlayRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  dismissable = true,
  dismiss: customDismiss,
  onDismiss,
  trapFocus = true,
  initialFocus,
  finalFocus,
  restoreFocus = true,
  preventScroll = true,
  registry,
  useModal = false,
  children,
}: OverlayRootProps): React.JSX.Element {
  const id = useId();
  const [isOpen, setIsOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const activeRegistry = useMemo(
    () => registry ?? getSharedOverlayModality(),
    [registry],
  );

  // Register in overlay modality stack while open. Modality travels
  // with the registration so the shared registry can answer "is any
  // modal open" (the Android app-root hook); non-modal surfaces
  // register without it and never count.
  useOverlayRegistration(
    activeRegistry,
    id,
    isOpen ?? false,
    modal === true || modal === "trap-focus",
  );
  const modalityState = useOverlayModality(activeRegistry);
  const isTop = modalityState.isTop(id);
  const stackIndex = modalityState.stack.indexOf(id);

  // Presence lifecycle for exit animations
  const presence = usePresence(isOpen ?? false);

  // Track reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReducedMotion(enabled);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      (enabled: boolean) => {
        if (mounted) setReducedMotion(enabled);
      },
    );
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  // Exit completion. Axis ships no exit animation (parity record D9),
  // so a closing surface has nothing to wait for and leaves the tree
  // in the same commit it was asked to close — reduced motion takes
  // the identical path. Without this the presence machine would sit in
  // `exiting` forever and `present` would never fall to `false`, i.e.
  // a closed overlay would stay painted. A consumer that later drives
  // an exit animation calls `finishExit` instead; the state machine is
  // already wired for it.
  useEffect(() => {
    if (presence.state === "exiting") presence.finishExit();
  }, [presence.state, presence.finishExit]);

  // Dismiss wiring
  const dismissBranches = useMemo<DismissBranches>(() => {
    const base = dismissBranchesFor({
      modal: modal === true,
      dismissible: dismissable,
      hasVisibleClose: true,
    });
    if (customDismiss) {
      if (customDismiss.outsidePointer !== undefined) {
        base["outside-pointer"] = customDismiss.outsidePointer && dismissable;
      }
      if (customDismiss.systemBack !== undefined) {
        base["system-back"] = customDismiss.systemBack && dismissable;
      }
      if (customDismiss.escape !== undefined) {
        base.escape = customDismiss.escape && dismissable;
      }
    }
    return base;
  }, [modal, dismissable, customDismiss]);

  const dismiss = useCallback(
    (reason: OverlayOpenChangeReason = "outside-press") => {
      if (!dismissable) return;
      onDismiss?.();
      setIsOpen(false, { reason });
    },
    [dismissable, onDismiss, setIsOpen],
  );

  const close = useCallback(
    (reason: OverlayOpenChangeReason = "close-press") => {
      setIsOpen(false, { reason });
    },
    [setIsOpen],
  );

  const toggle = useCallback(
    (reason: OverlayOpenChangeReason = "trigger-press") => {
      if (!dismissable && (isOpen ?? false)) return;
      setIsOpen(
        (prev) => !(prev ?? false),
        { reason },
      );
    },
    [dismissable, isOpen, setIsOpen],
  );

  const isTopRef = useRef(isTop);
  isTopRef.current = isTop;
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  // Android system back button dismissal (topmost only) — the native
  // escape equivalent, reported as `escape-key`. Web has no system
  // back button: React Native Web's `BackHandler` only logs "not
  // supported on web", so the subscription is skipped there.
  // No DOM lib, no DOM import: the check reads an optional
  // `globalThis` shape, which the boundary gate and the compiler
  // both accept as plain values.
  const isWeb = isWebEnvironment();
  useEffect(() => {
    if (
      isWeb ||
      !(isOpen ?? false) ||
      !shouldDismissOn("system-back", true, dismissBranches)
    ) {
      return;
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isTopRef.current) {
        dismissRef.current("escape-key");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isOpen, dismissBranches, isWeb]);

  // Scroll lock when modal and open
  useEffect(() => {
    if (!(isOpen ?? false) || modal !== true || !preventScroll) return;
    activeModalCount++;
    for (const listener of scrollLockListeners) listener(activeModalCount > 0);

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      for (const listener of scrollLockListeners)
        listener(activeModalCount > 0);
    };
  }, [isOpen, modal, preventScroll]);

  // Focus trap & restoration refs. Focus itself is executed by the
  // popup that paints the surface (`useModalFocus` in `OverlayPopup`
  // and the family popups) — never here — so a surface has exactly
  // one focus executor and a root without popups moves nothing.
  const triggerRef = useRef<ElementRef<typeof View> | null>(null);
  const popupRef = useRef<ElementRef<typeof View> | null>(null);

  // Stable identity: every object above is a `useRef` (never
  // re-created) and `id` never changes, so bridgers through
  // `useOverlayRefsMaybe` never re-render when modality settles.
  // `interaction` tracks how the surface last opened (trigger press vs
  // programmatic) for function-form focus targets.
  const interactionRef = useRef<FocusInteraction>("programmatic");
  const refsValue = useMemo<OverlayRefs>(
    () => ({ id, triggerRef, popupRef, interaction: interactionRef }),
    [id, triggerRef, popupRef],
  );

  const contextValue = useMemo<OverlayContextValue>(
    () => ({
      id,
      open: isOpen ?? false,
      modal,
      dismissable,
      dismissBranches,
      dismiss,
      close,
      toggle,
      isTop,
      stackIndex,
      present: presence.present,
      presenceState: presence.state,
      finishExit: presence.finishExit,
      useModal,
      trapFocus,
      restoreFocus,
      triggerRef,
      popupRef,
      initialFocus,
      finalFocus,
      reducedMotion,
    }),
    [
      id,
      isOpen,
      modal,
      dismissable,
      dismissBranches,
      dismiss,
      close,
      toggle,
      isTop,
      stackIndex,
      presence.present,
      presence.state,
      presence.finishExit,
      useModal,
      trapFocus,
      restoreFocus,
      initialFocus,
      finalFocus,
      reducedMotion,
    ],
  );

  return (
    <OverlayContext.Provider value={contextValue}>
      <OverlayRefsContext.Provider value={refsValue}>
        <ScrollLockContext.Provider value={modal === true && (isOpen ?? false)}>
          {children}
        </ScrollLockContext.Provider>
      </OverlayRefsContext.Provider>
    </OverlayContext.Provider>
  );
}

export type OverlayPortalProps = {
  /** Target portal host name. Omitted targets the default host. */
  hostName?: string;
  testID?: string;
  children?: ReactNode;
};

export function OverlayPortal({
  hostName,
  testID,
  children,
}: OverlayPortalProps): React.JSX.Element | null {
  const overlay = useContext(OverlayContext);
  // The stable refs travel beside the full context: portaled content
  // renders at the host, outside this root's subtree, so both are
  // re-provided explicitly below.
  const overlayRefs = useOverlayRefsMaybe();
  if (!overlay?.present) return null;

  if (overlay.useModal) {
    return (
      <Modal
        transparent
        visible={overlay.open}
        onRequestClose={() => overlay.dismiss("escape-key")}
        testID={testID}
      >
        {children}
      </Modal>
    );
  }

  const zIndex = 1000 + Math.max(0, overlay.stackIndex) * 10;

  // Background isolation lives on the layer: lower layers hide from
  // assistive tech (`accessibilityElementsHidden`,
  // `importantForAccessibility="no-hide-descendants"`) and take no
  // pointer events. The iOS modal claim itself
  // (`accessibilityViewIsModal`) sits on the POPUP, not here — the
  // flag hides everything that is not a descendant of the marked
  // view. Only the TOP layer's popup claims it; a stack where two
  // siblings both claim modality would hide each other. (Focus
  // adaptation, item 1 — the layer-level claim is retired.)

  return (
    <Portal hostName={hostName}>
      <OverlayContext.Provider value={overlay}>
        <OverlayRefsContext.Provider value={overlayRefs}>
          <View
            testID={testID}
            pointerEvents={overlay.isTop ? "auto" : "box-none"}
            accessibilityElementsHidden={!overlay.isTop}
            importantForAccessibility={
              overlay.isTop ? "yes" : "no-hide-descendants"
            }
            style={[FULL_FILL_STYLE, { zIndex }]}
          >
            {children}
          </View>
        </OverlayRefsContext.Provider>
      </OverlayContext.Provider>
    </Portal>
  );
}

export type OverlayBackdropState = {
  open: boolean;
  isTop: boolean;
};

export type OverlayBackdropProps = {
  testID?: string;
  style?: StateStyle<OverlayBackdropState, StyleProp<ViewStyle>>;
  render?: RenderProp<OverlayBackdropState, SlotProps>;
};

export function OverlayBackdrop({
  testID,
  style,
  render,
}: OverlayBackdropProps): React.ReactNode {
  const overlay = useContext(OverlayContext);
  if (!overlay?.present) return null;
  // Non-modal overlays do not render a backdrop scrim
  if (overlay.modal !== true) return null;

  const state: OverlayBackdropState = {
    open: overlay.open,
    isTop: overlay.isTop,
  };

  const canDismiss =
    overlay.isTop && overlay.dismissBranches["outside-pointer"];

  if (canDismiss) {
    // Reason is explicit: the backdrop press is the outside-press
    // dismiss path (never the raw press event).
    const handlePress = () => overlay.dismiss("outside-press");
    const substituted = resolveRender(
      render,
      {
        accessibilityLabel: "Dismiss",
        testID,
        onPress: handlePress,
        style: [FULL_FILL_STYLE, resolveStyle(style, state)],
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;

    return (
      <Pressable
        accessibilityLabel="Dismiss"
        testID={testID}
        onPress={handlePress}
        style={[FULL_FILL_STYLE, resolveStyle(style, state)]}
      />
    );
  }

  const substituted = resolveRender(
    render,
    {
      testID,
      style: [FULL_FILL_STYLE, resolveStyle(style, state)],
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      testID={testID}
      style={[FULL_FILL_STYLE, resolveStyle(style, state)]}
    />
  );
}

export type OverlayPopupState = {
  open: boolean;
  isTop: boolean;
};

export type OverlayPopupProps = {
  accessibilityLabel?: string;
  role?: "dialog" | "alertdialog";
  testID?: string;
  style?: StateStyle<OverlayPopupState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<OverlayPopupState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
  /**
   * Explicit initial focus target (wins over the root's). See
   * `OverlayRootProps.initialFocus` for the value shape.
   */
  initialFocus?: OverlayFocusValue;
  /**
   * Explicit restore target (wins over the trigger). See
   * `OverlayRootProps.finalFocus` for the value shape.
   */
  finalFocus?: OverlayFocusValue;
};

export function OverlayPopup({
  accessibilityLabel,
  role = "dialog",
  testID,
  style,
  children,
  render,
  ref,
  initialFocus,
  finalFocus,
}: OverlayPopupProps): React.ReactNode {
  const overlay = useContext(OverlayContext);
  const overlayRefs = useOverlayRefsMaybe();

  // Hooks first: the popup may unmount (closed overlay), and an early
  // return above `useCallback` would break hook ordering.
  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      if (overlay) overlay.popupRef.current = node;
      assignRef(ref, node);
    },
    [overlay, ref],
  );

  const modal = overlay !== null && overlay !== undefined && overlay.modal !== false;
  // The single focus executor for this surface: move in on open,
  // restore to the trigger on close. Runs whether or not a trap is
  // armed; containment and hiding are separate props below. Disabled
  // entirely when the root opts out via `trapFocus`, restore half when
  // it opts out via `restoreFocus`.
  useModalFocus({
    open: overlay?.open ?? false,
    enabled: overlay?.trapFocus ?? true,
    restoreEnabled: overlay?.restoreFocus ?? true,
    initialFocus: initialFocus ?? overlay?.initialFocus,
    finalFocus: finalFocus ?? overlay?.finalFocus,
    interactionRef: overlayRefs?.interaction,
    popupRef: overlay?.popupRef ?? { current: null },
    restoreRef: overlay?.triggerRef ?? { current: null },
  });

  if (!overlay?.present) return null;

  const state: OverlayPopupState = {
    open: overlay.open,
    isTop: overlay.isTop,
  };

  // iOS VoiceOver scrub dismisses — the bound form of the `escape`
  // branch (RN has no global key listener for the Escape key itself).
  // Gated like the back-button path: only the top layer dismisses, and
  // only when the surface armed the branch. The prop is iOS-only and
  // a no-op elsewhere.
  const canEscape =
    overlay.isTop &&
    shouldDismissOn("escape", overlay.open, overlay.dismissBranches);
  const handleAccessibilityEscape = canEscape
    ? () => overlay.dismiss("escape-key")
    : undefined;

  // iOS modal claim on the popup: the flag hides everything that is
  // not a descendant of the marked view — top layer only, so stacked
  // layers never hide each other. Non-modal surfaces claim nothing
  // (neither trap focus nor hide anything).
  // On web the same modality is `aria-modal` plus the Tab trap below.
  const web = isWebEnvironment();
  const modalActive = modal && overlay.isTop;
  const handleKeyDown =
    web && modalActive && overlay.trapFocus
      ? (event: { key?: unknown; shiftKey?: unknown; preventDefault?: unknown }) =>
          trapTabKey(overlay.popupRef.current, event)
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
      role={role}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onAccessibilityEscape={handleAccessibilityEscape}
      accessibilityViewIsModal={modalActive}
      {...(web && modalActive ? { "aria-modal": true } : null)}
      onKeyDown={handleKeyDown}
      style={resolveStyle(style, state)}
    >
      {children}
    </View>
  );
}

export type OverlayTriggerState = {
  open: boolean;
  disabled: boolean;
};

export type OverlayTriggerProps = {
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StateStyle<OverlayTriggerState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<OverlayTriggerState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
};

export function OverlayTrigger({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: OverlayTriggerProps): React.ReactNode {
  const overlay = useContext(OverlayContext);
  const overlayRefs = useOverlayRefsMaybe();
  const open = overlay?.open ?? false;
  const inert = overlay === null;
  const state: OverlayTriggerState = { open, disabled: disabled || inert };

  const setTriggerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      if (overlay) {
        overlay.triggerRef.current = node;
      }
      assignRef(ref, node);
    },
    [overlay, ref],
  );

  const handlePress = useCallback(() => {
    if (disabled || inert) return;
    if (overlayRefs) overlayRefs.interaction.current = "trigger-press";
    overlay.toggle("trigger-press");
  }, [disabled, inert, overlay, overlayRefs]);

  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { expanded: open, disabled: disabled || inert },
      accessibilityLabel,
      testID,
      disabled: disabled || inert,
      onPress: handlePress,
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
      onPress={handlePress}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export type OverlayCloseState = {
  disabled: boolean;
};

export type OverlayCloseProps = {
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StateStyle<OverlayCloseState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<OverlayCloseState, SlotProps>;
};

export function OverlayClose({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: OverlayCloseProps): React.ReactNode {
  const overlay = useContext(OverlayContext);
  const inert = overlay === null;
  const state: OverlayCloseState = { disabled: disabled || inert };

  const handlePress = useCallback(() => {
    if (disabled || inert) return;
    overlay.close();
  }, [disabled, inert, overlay]);

  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { disabled: disabled || inert },
      accessibilityLabel,
      testID,
      disabled: disabled || inert,
      onPress: handlePress,
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
      onPress={handlePress}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

/** Compound namespace for Overlay parts. */
export const Overlay = {
  Root: OverlayRoot,
  Portal: OverlayPortal,
  Backdrop: OverlayBackdrop,
  Popup: OverlayPopup,
  Trigger: OverlayTrigger,
  Close: OverlayClose,
};
