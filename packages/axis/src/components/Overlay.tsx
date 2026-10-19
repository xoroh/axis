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
  findNodeHandle,
  Modal,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import {
  type DismissBranches,
  dismissBranchesFor,
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

/**
 * Overlay — the native overlay root on PortalHost (ADR 001/006/007,
 * Base UI layer parity, Kern P0-1 counterpart).
 *
 * Provides a unified foundation for dismissable, modal, layered surfaces:
 * 1. Dismissable layer: outside press (the backdrop) and Android system
 *    back (`BackHandler`), wired through the shared `dismissWiring`
 *    branch set.
 * 2. Modal: accessibility-modal surface with focus moved into it on open
 *    and restored to the trigger / `finalFocus` on close.
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
 *   by design, per `dismissWiring`) but never BOUND here: React Native has
 *   no global key listener, so only `outside-pointer` and `system-back`
 *   fire natively.
 * - Focus CONTAINMENT (traversal trapping) still needs the `focusTrap`
 *   RN adaptation (parity D5): what ships is `accessibilityViewIsModal`
 *   plus focus move/restore, not a traversal loop.
 * - Exit has no animation to wait for (parity D9), so a closing surface
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
  dismiss: () => void;
  close: () => void;
  toggle: () => void;
  isTop: boolean;
  stackIndex: number;
  present: boolean;
  presenceState: PresenceState;
  finishExit: () => void;
  useModal: boolean;
  triggerRef: { current: ElementRef<typeof View> | null };
  popupRef: { current: ElementRef<typeof View> | null };
  initialFocusRef: { current: ElementRef<typeof View> | null };
  finalFocusRef: { current: ElementRef<typeof View> | null };
  reducedMotion: boolean;
};

/** Internal contexts: consumers read them through `useOverlay` and
 * `useScrollLock` (the raw context objects are plumbing, not API —
 * exporting them would invite consumer re-providers with no owner). */
const OverlayContext = createContext<OverlayContextValue | null>(null);

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

export type OverlayRootProps = {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. Default false. */
  defaultOpen?: boolean;
  /** Callback fired when open state changes. */
  onOpenChange?: (open: boolean) => void;
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
  /** Element or ref to receive initial focus upon opening. */
  initialFocus?:
    | RefObject<ElementRef<typeof View> | null>
    | ElementRef<typeof View>
    | null;
  /** Element or ref to restore focus to upon closing. */
  finalFocus?:
    | RefObject<ElementRef<typeof View> | null>
    | ElementRef<typeof View>
    | null;
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

  // Register in overlay modality stack while open
  useOverlayRegistration(activeRegistry, id, isOpen ?? false);
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

  const dismiss = useCallback(() => {
    if (!dismissable) return;
    onDismiss?.();
    setIsOpen(false);
  }, [dismissable, onDismiss, setIsOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const toggle = useCallback(() => {
    if (!dismissable && (isOpen ?? false)) return;
    setIsOpen((prev) => !(prev ?? false));
  }, [dismissable, isOpen, setIsOpen]);

  const isTopRef = useRef(isTop);
  isTopRef.current = isTop;
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  // Android system back button dismissal (topmost only). Web has no
  // system back button: React Native Web's `BackHandler` only logs
  // "not supported on web", so the subscription is skipped there.
  // No DOM lib, no DOM import: the check reads an optional
  // `globalThis` shape, which the boundary gate and the compiler
  // both accept as plain values.
  const isWeb =
    typeof (globalThis as { document?: unknown }).document !== "undefined";
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
        dismissRef.current();
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

  // Focus trap & restoration refs
  const triggerRef = useRef<ElementRef<typeof View> | null>(null);
  const popupRef = useRef<ElementRef<typeof View> | null>(null);
  const initialFocusRef = useRef<ElementRef<typeof View> | null>(null);
  const finalFocusRef = useRef<ElementRef<typeof View> | null>(null);

  // Resolve initial focus
  useEffect(() => {
    if (initialFocus) {
      if ("current" in initialFocus) {
        initialFocusRef.current = initialFocus.current;
      } else {
        initialFocusRef.current = initialFocus;
      }
    }
  }, [initialFocus]);

  // Resolve final focus
  useEffect(() => {
    if (finalFocus) {
      if ("current" in finalFocus) {
        finalFocusRef.current = finalFocus.current;
      } else {
        finalFocusRef.current = finalFocus;
      }
    }
  }, [finalFocus]);

  // Auto-focus on open
  // Move accessibility focus into the surface. `AccessibilityInfo`
  // is the RN-honest move (no DOM tab order exists here); the
  // duck-typed `focus()` call is for hosts that expose one (a caller
  // can wire a ref to an imperative focus API).
  const focusHost = useCallback((target: unknown): void => {
    if (!target) return;
    const maybeFocusable = target as { focus?: () => void };
    if (typeof maybeFocusable.focus === "function") maybeFocusable.focus();
    const tag = findNodeHandle(target as ElementRef<typeof View>);
    if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
  }, []);

  useEffect(() => {
    if (
      (isOpen ?? false) &&
      (modal === true || modal === "trap-focus") &&
      trapFocus
    ) {
      focusHost(initialFocusRef.current || popupRef.current);
    }
  }, [isOpen, modal, trapFocus, focusHost]);

  // Focus restore on close
  const wasOpenRef = useRef(isOpen ?? false);
  useEffect(() => {
    if (wasOpenRef.current && !(isOpen ?? false) && restoreFocus) {
      focusHost(finalFocusRef.current || triggerRef.current);
    }
    wasOpenRef.current = isOpen ?? false;
  }, [isOpen, restoreFocus, focusHost]);

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
      triggerRef,
      popupRef,
      initialFocusRef,
      finalFocusRef,
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
      reducedMotion,
    ],
  );

  return (
    <OverlayContext.Provider value={contextValue}>
      <ScrollLockContext.Provider value={modal === true && (isOpen ?? false)}>
        {children}
      </ScrollLockContext.Provider>
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
  if (!overlay?.present) return null;

  if (overlay.useModal) {
    return (
      <Modal
        transparent
        visible={overlay.open}
        onRequestClose={overlay.dismiss}
        testID={testID}
      >
        {children}
      </Modal>
    );
  }

  const zIndex = 1000 + Math.max(0, overlay.stackIndex) * 10;

  // `accessibilityViewIsModal` is the RN-honest way to say "this
  // layer is modal to assistive tech" (what a focus trap announces on
  // iOS; there is no DOM tab order to borrow — parity D5). Two rules,
  // both load-bearing:
  // - It sits on the LAYER, not on the popup inside it: the flag hides
  //   everything that is not a DESCENDANT of the marked view, so
  //   marking the popup would hide its own backdrop as a sibling.
  // - Only the TOP layer claims modality. Lower layers are already
  //   hidden below (`accessibilityElementsHidden`); a stack where two
  //   siblings both claim modality would hide each other.
  const accessibilityViewIsModal = overlay.modal === true && overlay.isTop;

  return (
    <Portal hostName={hostName}>
      <OverlayContext.Provider value={overlay}>
        <View
          testID={testID}
          pointerEvents={overlay.isTop ? "auto" : "box-none"}
          accessibilityElementsHidden={!overlay.isTop}
          importantForAccessibility={
            overlay.isTop ? "yes" : "no-hide-descendants"
          }
          accessibilityViewIsModal={accessibilityViewIsModal}
          style={[FULL_FILL_STYLE, { zIndex }]}
        >
          {children}
        </View>
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
    const substituted = resolveRender(
      render,
      {
        accessibilityLabel: "Dismiss",
        testID,
        onPress: overlay.dismiss,
        style: [FULL_FILL_STYLE, resolveStyle(style, state)],
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;

    return (
      <Pressable
        accessibilityLabel="Dismiss"
        testID={testID}
        onPress={overlay.dismiss}
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
};

export function OverlayPopup({
  accessibilityLabel,
  role = "dialog",
  testID,
  style,
  children,
  render,
  ref,
}: OverlayPopupProps): React.ReactNode {
  const overlay = useContext(OverlayContext);

  // Hooks first: the popup may unmount (closed overlay), and an early
  // return above `useCallback` would break hook ordering.
  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      if (overlay) overlay.popupRef.current = node;
      assignRef(ref, node);
    },
    [overlay, ref],
  );

  if (!overlay?.present) return null;

  const state: OverlayPopupState = {
    open: overlay.open,
    isTop: overlay.isTop,
  };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      role,
      accessibilityRole: role,
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
      role={role}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
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
    overlay.toggle();
  }, [disabled, inert, overlay]);

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

