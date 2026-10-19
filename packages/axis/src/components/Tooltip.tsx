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
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { Align, Placement } from "../positioning";
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
  type FocusTransitionState,
  isWebEnvironment,
  useModalFocus,
  webTabIndexProps,
} from "./useAccessibilityFocus";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Tooltip — a compound anchored hint (Base UI parity).
 *
 * `TooltipProvider` groups show/hide timing; `TooltipRoot` owns
 * visibility state (renders no element); `TooltipTrigger` toggles on
 * long-press and registers the anchor; `TooltipPortal` is the in-box
 * host (a non-modal hint never takes a `Modal` host);
 * `TooltipPositioner` measures and places the tip;
 * `TooltipPopup` is the tip; `TooltipArrow` is a caller-positioned
 * marker. No default visuals — every visual value is
 * caller-provided. State follows `useControllableState`: `open` (+
 * `onOpenChange`) for controlled use, `defaultOpen` for uncontrolled.
 *
 * No hover model (no pointer on touch devices): long-press toggles,
 * dismissal is a second long-press or the controlled prop.
 */

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* The parts below mirror Base UI's Tooltip anatomy — Root (state    */
/* owner, renders no element), Trigger                                 */
/* (long-press toggle + anchor registration), Portal (in-box host),     */
/* Positioner (measured placement against the trigger anchor), Popup    */
/* (the tip), Arrow (caller-positioned marker) — with `render`          */
/* element/function composition and value-or-function `style` on       */
/* every part. `TooltipProvider` groups tips under one show/hide     */
/* timing (delays run from the long-press commit — hover has no touch  */
/* equivalent). Omitted Base UI pieces are documented deviations, not  */
/* oversights: no `Modal` portal host (a non-modal hint must never     */
/* trap touches; the tip paints in-box — the shared                      */
/* overlay root has landed for modal surfaces, and Tooltip deliberately */
/* stays off it; positioning stays separable from the host either way), */
/* no hover or keyboard                                                */
/* traversal (D8), no animation states (D9), and no `data-*`           */
/* attributes (D1). Dismissal is a second long-press or the            */
/* so there is no Backdrop part.                                        */
/* ------------------------------------------------------------------ */

export type TooltipRootState = {
  /** Whether the tip is currently showing. */
  open: boolean;
  /** Whether the root is terminally disabled. */
  disabled: boolean;
};

export type TooltipRootProps = {
  /** Controlled visibility. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default `false`. */
  defaultOpen?: boolean;
  /** Fires on every visibility change. */
  onOpenChange?: (open: boolean) => void;
  /** Terminal: the tip never shows, no callbacks. Default `false`. */
  disabled?: boolean;
  /** Trigger, Portal, and shared content. Renders no element itself. */
  children?: ReactNode;
  /** Forwarded nowhere (the root renders no element); accepted so ref-spreading callers typecheck. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type TooltipProviderProps = {
  /**
   * Delay in milliseconds before a tip shows after its trigger
   * fires. Default `0` (instant). Groups tips under one timing so
   * a screen of hints behaves as one (the Base UI `Provider`
   * delay, adapted: hover has no touch equivalent, so the delay
   * runs from the long-press commit, not from hover).
   */
  delay?: number;
  /**
   * Delay in milliseconds before a tip hides after its dismiss
   * fires. Default `0` (instant).
   */
  closeDelay?: number;
  /** Tooltip roots sharing this timing. */
  children?: ReactNode;
};

export type TooltipTriggerState = {
  /** Whether the tip is currently showing. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export type TooltipTriggerProps = {
  testID?: string;
  /** Value or function of trigger state, caller-provided. */
  style?: StateStyle<TooltipTriggerState, StyleProp<ViewStyle>>;
  /** Anchor content the tip describes. */
  children?: ReactNode;
  /** Terminal: long-press never toggles and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source for the anchor. */
  accessibilityLabel?: string;
  /**
   * Long-press duration in milliseconds before the toggle fires,
   * forwarded to the host `Pressable` (`delayLongPress`). Absent
   * means the platform default — Axis never invents timing.
   */
  delayLongPress?: number;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<TooltipTriggerState, SlotProps>;
};

export type TooltipPortalProps = {
  /** Portal content (Positioner composed by the caller). */
  children?: ReactNode;
  testID?: string;
};

export type TooltipPositionerState = {
  /** Whether the tip is currently showing. */
  open: boolean;
  /** Effective placement side (after viewport flip/clamping). */
  side: Placement;
};

export type TooltipPositionerProps = {
  /** Preferred side for the tip. Default `"top"`. */
  side?: Placement;
  /** Cross-axis alignment. Default `"center"`. */
  align?: Align;
  /** Gap between anchor and tip edges. Default `0`. */
  sideOffset?: number;
  /** Shift along the cross axis after alignment. Default `0`. */
  alignOffset?: number;
  testID?: string;
  /** Value or function of positioner state, caller-provided. */
  style?: StateStyle<TooltipPositionerState, StyleProp<ViewStyle>>;
  /** Popup (and optional Arrow content) composed by the caller. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * positioned wrapper; measurement stays on the part.
   */
  render?: RenderProp<TooltipPositionerState, SlotProps>;
};

export type TooltipPopupState = {
  /** Whether the tip is currently showing. */
  open: boolean;
};

export type TooltipPopupProps = {
  testID?: string;
  /** Value or function of popup state, caller-provided. */
  style?: StateStyle<TooltipPopupState, StyleProp<ViewStyle>>;
  /** Tip content. */
  children?: ReactNode;
  /** Accessible name source for the tip. */
  accessibilityLabel?: string;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * tip host; the tooltip role stays on the part.
   */
  render?: RenderProp<TooltipPopupState, SlotProps>;
  /** Forwarded to the tip `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type TooltipArrowProps = {
  testID?: string;
  /** Arrow marker style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Arrow marker content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

type TooltipRootDisclosure = {
  open: boolean;
  toggle: () => void;
  groupDisabled: boolean;
  anchorHostRef: { current: ElementRef<typeof View> | null };
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
  /**
   * Open-transition bookkeeping for the focus hook. Stable for the
   * root's lifetime so a portal remount never loses the transition
   * the restore path needs (see `FocusTransitionState`).
   */
  focusState: FocusTransitionState;
};

type TooltipDelay = {
  delay: number;
  closeDelay: number;
};

/**
 * Group timing for tips. Internal default (not exported): roots
 * outside a provider show and hide instantly.
 */
const TooltipDelayContext = createContext<TooltipDelay | null>(null);

/**
 * Shared visibility state for the tip's parts. Internal to this
 * module (not exported): parts must render inside a `TooltipRoot`
 * to participate; outside one the trigger renders inert and the
 * portal never mounts.
 */
const TooltipRootContext = createContext<TooltipRootDisclosure | null>(null);

export function TooltipProvider({
  delay = 0,
  closeDelay = 0,
  children,
}: TooltipProviderProps): React.JSX.Element {
  // Clamped at zero: a negative delay would fire immediately with a
  // confusing value in the tree — instant is the honest floor.
  const timing = useMemo<TooltipDelay>(
    () => ({
      delay: Math.max(0, delay),
      closeDelay: Math.max(0, closeDelay),
    }),
    [delay, closeDelay],
  );
  // The provider owns timing, never layout: no host element.
  return (
    <TooltipDelayContext.Provider value={timing}>
      {children}
    </TooltipDelayContext.Provider>
  );
}

export function TooltipRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  children,
  ref,
}: TooltipRootProps): React.JSX.Element {
  // Accepted for ref-spreading callers; the root renders no element
  // to attach it to (the `MenuRoot` precedent).
  void ref;
  const [visible, setVisible] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );
  const delay = useContext(TooltipDelayContext);

  // Pending show/hide timers: a toggle in the other direction
  // cancels the pending one (a tip dismissed mid-delay never
  // appears), and unmount clears both (no set-state after unmount).
  const timers = useRef<{
    show?: ReturnType<typeof setTimeout>;
    hide?: ReturnType<typeof setTimeout>;
  }>({});
  useEffect(() => {
    const pending = timers.current;
    return () => {
      if (pending.show !== undefined) clearTimeout(pending.show);
      if (pending.hide !== undefined) clearTimeout(pending.hide);
    };
  }, []);

  const commit = useCallback(
    (next: boolean) => {
      if (timers.current.show !== undefined) {
        clearTimeout(timers.current.show);
        timers.current.show = undefined;
      }
      if (timers.current.hide !== undefined) {
        clearTimeout(timers.current.hide);
        timers.current.hide = undefined;
      }
      const wait = next ? (delay?.delay ?? 0) : (delay?.closeDelay ?? 0);
      if (wait <= 0) {
        setVisible(next);
        return;
      }
      timers.current[next ? "show" : "hide"] = setTimeout(
        () => setVisible(next),
        wait,
      );
    },
    [delay, setVisible],
  );

  const shown = visible ?? false;
  const toggle = useCallback(() => {
    if (disabled) return;
    commit(!shown);
  }, [disabled, shown, commit]);

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  // Stable transition bookkeeping for the focus hook (see
  // `FocusTransitionState`): survives portal remounts.
  const focusStateRef = useRef<FocusTransitionState>({
    wasOpen: false,
    moved: false,
    ancestor: null,
  });

  // Terminal: a disabled root reads hidden under any open state.
  const effectiveOpen = disabled ? false : (visible ?? false);

  const disclosure = useMemo<TooltipRootDisclosure>(
    () => ({
      open: effectiveOpen,
      toggle,
      groupDisabled: disabled,
      anchorHostRef,
      setAnchorRef,
      focusState: focusStateRef.current,
    }),
    [effectiveOpen, toggle, disabled, setAnchorRef],
  );

  // The root owns state, never layout: no host element (Base UI parity).
  return (
    <TooltipRootContext.Provider value={disclosure}>
      {children}
    </TooltipRootContext.Provider>
  );
}

export function TooltipTrigger({
  testID,
  style,
  children,
  disabled = false,
  accessibilityLabel,
  delayLongPress,
  render,
}: TooltipTriggerProps): React.ReactNode {
  const root = useContext(TooltipRootContext);
  const open = root?.open ?? false;
  const effectiveDisabled = disabled || (root?.groupDisabled ?? false);
  const state: TooltipTriggerState = { open, disabled: effectiveDisabled };

  const toggleTip = useCallback(() => {
    if (effectiveDisabled) return;
    root?.toggle();
  }, [effectiveDisabled, root]);

  // Register the host for `TooltipPositioner` measurement; outside
  // a root there is nothing to anchor to and registration is a no-op.
  const setTriggerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      root?.setAnchorRef(node);
    },
    [root],
  );

  // Outside a root there is nothing to toggle: render inert rather
  // than dropping the node silently.
  const inert = root === null;
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled || inert,
      delayLongPress,
      onLongPress: toggleTip,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setTriggerRef}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled || inert}
      delayLongPress={delayLongPress}
      onLongPress={toggleTip}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function TooltipPortal({
  children,
  testID,
}: TooltipPortalProps): React.JSX.Element | null {
  const root = useContext(TooltipRootContext);
  // Outside a root there is no visibility to present: render nothing.
  // NOTE: no `open` gate — the portal stays mounted through the exit
  // commit so the popup's focus hook observes the close transition;
  // the parts below still paint nothing while hidden.
  if (!root) return null;

  // Plain portal host, never a `Modal`: a non-modal hint must not trap
  // touches (documented above). The part exists so callers compose
  // the Base UI shape — and so the tip paints above sibling content
  // at the app host instead of under it.
  //
  // The root disclosure is re-provided inside the portal: portaled
  // content renders at the host, outside this root's subtree, so
  // without an explicit provider the parts below would read a null
  // root.
  return (
    <Portal>
      <TooltipRootContext.Provider value={root}>
        <View testID={testID}>{children}</View>
      </TooltipRootContext.Provider>
    </Portal>
  );
}

export function TooltipPositioner({
  side,
  align,
  sideOffset,
  alignOffset,
  testID,
  style,
  children,
  render,
}: TooltipPositionerProps): React.ReactNode {
  const root = useContext(TooltipRootContext);
  // Hooks before guards: measurement runs (harmlessly) even while
  // hidden so activation never reorders hook calls.
  const floating = useFloatingPlacement({
    anchorRef: root?.anchorHostRef ?? { current: null },
    placement: side ?? "top",
    offset: sideOffset,
    align,
    alignOffset,
    active: root?.open ?? false,
  });
  if (!root) return null;
  if (!root.open) return null;
  const state: TooltipPositionerState = {
    open: root.open,
    side: floating.side,
  };

  const substituted = resolveRender(
    render,
    {
      testID,
      onLayout: floating.onContentLayout,
      style: [floating.style, resolveStyle(style, state)],
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      testID={testID}
      onLayout={floating.onContentLayout}
      style={[floating.style, resolveStyle(style, state)]}
    >
      {children}
    </View>
  );
}

/**
 * Assign one value to every ref in the list, for the tip host.
 * Inline here (not imported) deliberately — the contract rule, see
 * every other part in this package.
 */
function assignTipRef(
  ref: TooltipPopupProps["ref"],
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

export function TooltipPopup({
  testID,
  style,
  children,
  accessibilityLabel,
  render,
  ref,
}: TooltipPopupProps): React.ReactNode {
  const root = useContext(TooltipRootContext);

  // Hooks before guards: the focus node ref must exist on every
  // render, and the move/restore wiring below no-ops while hidden.
  const tipNodeRef = useRef<ElementRef<typeof View> | null>(null);
  const setTipRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      tipNodeRef.current = node;
      assignTipRef(ref, node);
    },
    [ref],
  );

  const open = root?.open ?? false;
  // Labelled tips move SR focus into the tip on open and restore it
  // to the trigger anchor on close (the upstream `Content`/`Trigger`
  // pair); unlabelled tips stay silent. No containment (tooltips are
  // never modal). iOS VoiceOver scrub dismisses the open tip.
  const web = isWebEnvironment();
  useModalFocus({
    open,
    enabled: accessibilityLabel !== undefined && root !== null,
    popupRef: tipNodeRef,
    restoreRef: root?.anchorHostRef ?? { current: null },
    sharedState: root?.focusState,
  });

  if (!root) return null;
  if (!root.open) return null;
  const state: TooltipPopupState = { open: root.open };
  const handleAccessibilityEscape = () => root.toggle();

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "tooltip",
      accessibilityLabel,
      testID,
      onAccessibilityEscape: handleAccessibilityEscape,
      ...webTabIndexProps(web),
      style: resolveStyle(style, state),
      children,
      ref: setTipRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setTipRef}
      accessible
      accessibilityRole="tooltip"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onAccessibilityEscape={handleAccessibilityEscape}
      {...webTabIndexProps(web)}
      style={resolveStyle(style, state)}
    >
      {children}
    </View>
  );
}

export function TooltipArrow({
  testID,
  style,
  children,
  render,
}: TooltipArrowProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View accessible={false} testID={testID} style={style}>
      {children}
    </View>
  );
}
