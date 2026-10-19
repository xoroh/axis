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
  useState,
} from "react";
import {
  PanResponder,
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type {
  OverlayOpenChangeDetails,
  OverlayOpenChangeReason,
} from "../dismissWiring";
import { shouldDismissOn } from "../dismissWiring";
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
} from "./useAccessibilityFocus";

/**
 * Drawer — an unstyled edge-anchored panel with snap points and swipe dismissal.
 *
 * Compound anatomy per Base UI (Root, Trigger, Portal, Backdrop,
 * Popup, Title, Description, Close) plus `DrawerHandle` — the SR
 * gesture parity the monolith proved: a button carrying
 * `dismiss`/`expand`/`collapse` accessibility actions, caller-styled.
 * State (open, snap, drag, extent) lives in `DrawerRoot`, which
 * renders no element; measurement, scrim, surface, and actions compose
 * below it.
 *
 * `snapPoints` are preset resting positions along the dismiss axis:
 * numbers in (0, 1] are fractions of the measured container extent
 * (width for `left`/`right`, height for `top`/`bottom`); numbers
 * greater than 1 are dp; `'NNNpx'` strings are dp. Anything else
 * resolves out; an empty resolution falls back to `[1]`.
 *
 * Drag (the `Sheet` PanResponder pattern, generalized): a drag on the
 * surface along the dismiss axis follows the finger (`drag` state);
 * on release a drag past the dismiss distance (`max(64dp, 20% of the
 * dismiss-axis extent)`) or with dismiss-direction velocity dismisses
 * (reported as `none` — Base UI has no gesture-dismiss reason) when
 * `dismissable`, otherwise it snaps back; any other release settles
 * to the nearest snap point.
 *
 * Focus: SR focus moves into the popup on open; the default initial
 * target is the popup container or Title (announced with its label —
 * never a destructive action), or the caller-marked Close. Restore
 * goes to the trigger or `finalFocus`.
 *
 * Test ids: the popup carries `testID`; the portal container carries
 * `<testID>-container` and the backdrop `<testID>-scrim`.
 */

export type DrawerSide = "left" | "right" | "top" | "bottom";

/** A snap point value: fraction of the container extent, dp, or px string. */
export type DrawerSnapPoint = number | string;

export type DrawerRootState = {
  /** Whether the drawer is currently open. */
  open: boolean;
  /** Anchored edge. */
  side: DrawerSide;
  /** Active snap point value. */
  snapPoint: DrawerSnapPoint;
};

export type DrawerRootProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed open or dismissal, with the reason. */
  onOpenChange?: (open: boolean, details?: OverlayOpenChangeDetails) => void;
  /** Fires on scrim, drag, or request-close dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * When `false`, scrim press and drag-away do nothing: the drawer can
   * only close through the caller's own actions. Default `true`.
   * (A non-modal drawer keeps its scrim inert regardless.)
   */
  dismissable?: boolean;
  /**
   * Modal presentation. Default `true` — forwarded to the overlay
   * root. `false` keeps the scrim inert (see above).
   */
  modal?: boolean;
  /** Anchored edge. Default `"left"`. */
  side?: DrawerSide;
  /**
   * Preset resting positions along the dismiss axis. Default `[1]`
   * (fully open). Numbers in (0, 1] are fractions of the measured
   * container extent; numbers greater than 1 are dp; `'NNNpx'` strings
   * are dp. Sorted, deduped; garbage resolves out and an empty
   * resolution falls back to `[1]`.
   */
  snapPoints?: DrawerSnapPoint[];
  /**
   * Controlled active snap point value. Wins over `defaultSnapPoint`
   * when defined. Unknown values resolve to the nearest snap point.
   */
  snapPoint?: DrawerSnapPoint | null;
  /** Uncontrolled initial snap point value. Default: the first snap point. */
  defaultSnapPoint?: DrawerSnapPoint | null;
  /** Fires with the snap point value on every committed settle. */
  onSnapPointChange?: (snapPoint: DrawerSnapPoint) => void;
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

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: Ref<ElementRef<typeof View>> | undefined,
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

/** Numeric value of a snap point for ordering and nearness. */
function snapValueOf(point: DrawerSnapPoint): number | undefined {
  if (typeof point === "number") {
    return Number.isFinite(point) ? point : undefined;
  }
  const match = /^([0-9]+(?:\.[0-9]+)?)px$/.exec(point.trim());
  if (!match) return undefined;
  const parsed = Number.parseFloat(match[1] ?? "");
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Whether a numeric snap point is a fraction of the container extent. */
function isFraction(value: number): boolean {
  return value > 0 && value <= 1;
}

/** Downward drag that dismisses: 64dp or 20% of the dismiss-axis extent. */
function dismissDistanceFor(extent: number): number {
  return Math.max(64, extent * 0.2);
}

type DrawerDisclosure = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  dismiss: (reason?: OverlayOpenChangeReason) => void;
  modal: boolean;
  dismissable: boolean;
  side: DrawerSide;
  horizontal: boolean;
  snapPoint: DrawerSnapPoint;
  activeSnap: number;
  snapCount: number;
  translate: number;
  panHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  setExtent: (extent: number) => void;
  commitSnapValue: (value: DrawerSnapPoint) => void;
  expand: () => void;
  collapse: () => void;
};

/**
 * Shared open/snap state for the compound parts. Internal (not
 * exported): parts must render inside a `DrawerRoot` to participate.
 */
const DrawerDisclosureContext = createContext<DrawerDisclosure | null>(null);

export function DrawerRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  dismissable = true,
  modal = true,
  side = "left",
  snapPoints = [1],
  snapPoint,
  defaultSnapPoint = null,
  onSnapPointChange,
  initialFocus,
  finalFocus,
  children,
}: DrawerRootProps): React.JSX.Element {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );
  const [extent, setExtent] = useState(0);
  const [drag, setDrag] = useState(0);

  // Resolved snap points: finite numbers or px strings, ascending,
  // deduped. Never throws: garbage resolves to [1] (fully open).
  const resolved = useMemo(() => {
    const clean = snapPoints.filter((p) => {
      const value = snapValueOf(p);
      return value !== undefined && value > 0;
    });
    const sorted = [...new Set(clean)].sort(
      (a, b) => (snapValueOf(a) ?? 0) - (snapValueOf(b) ?? 0),
    );
    return sorted.length > 0 ? sorted : [1];
  }, [snapPoints]);

  // Index of the snap point nearest a raw numeric value.
  const nearestIndexFor = useCallback(
    (value: number): number => {
      let best = 0;
      for (let i = 1; i < resolved.length; i++) {
        const here = Math.abs((snapValueOf(resolved[i] ?? 1) ?? 0) - value);
        const current = Math.abs(
          (snapValueOf(resolved[best] ?? 1) ?? 0) - value,
        );
        if (here < current) best = i;
      }
      return best;
    },
    [resolved],
  );

  // Controlled value (when it names a resolved point) or the nearest
  // resolution of the uncontrolled/default value; default: first point.
  const [rawSnap, setRawSnap] = useControllableState<number>(
    snapPoint === undefined || snapPoint === null
      ? undefined
      : nearestIndexFor(snapValueOf(snapPoint) ?? Number.NaN),
    defaultSnapPoint === undefined || defaultSnapPoint === null
      ? 0
      : nearestIndexFor(snapValueOf(defaultSnapPoint) ?? Number.NaN),
    undefined,
  );
  const activeSnap = Math.min(Math.max(0, rawSnap ?? 0), resolved.length - 1);

  const commitSnap = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(0, next), resolved.length - 1);
      const value = resolved[clamped] ?? 1;
      const changed = clamped !== activeSnap;
      setRawSnap(clamped);
      if (changed) onSnapPointChange?.(value);
    },
    [resolved, activeSnap, setRawSnap, onSnapPointChange],
  );

  const dragDismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false, { reason: "none" });
  }, [onDismiss, setOpen]);

  const dismiss = useCallback(
    (reason: OverlayOpenChangeReason = "outside-press") => {
      if (!dismissable) return;
      onDismiss?.();
      setOpen(false, { reason });
    },
    [dismissable, onDismiss, setOpen],
  );

  const close = useCallback(() => {
    setOpen(false, { reason: "close-press" });
  }, [setOpen]);

  const toggle = useCallback(() => {
    setOpen((previous) => !(previous ?? false), { reason: "trigger-press" });
  }, [setOpen]);

  const horizontal = side === "left" || side === "right";
  // Dismiss direction along the axis: left/top retreat negative,
  // right/bottom positive.
  const sign = side === "left" || side === "top" ? -1 : 1;

  // Resting translation for a snap index: fractions of the measured
  // extent, dp values as visible sizes.
  const offsetFor = useCallback(
    (index: number) => {
      const value = snapValueOf(resolved[index] ?? 1) ?? 1;
      if (isFraction(value)) return sign * extent * (1 - value);
      return sign * Math.max(0, extent - value);
    },
    [extent, resolved, sign],
  );

  const settle = useCallback(
    (distance: number, velocity: number) => {
      setDrag(0);
      if (
        dismissable &&
        (distance >= dismissDistanceFor(extent) || velocity > 0.75)
      ) {
        dragDismiss();
        return;
      }
      // Nearest snap to the release point.
      const at = offsetFor(activeSnap) + distance;
      let best = 0;
      for (let i = 1; i < resolved.length; i++) {
        if (Math.abs(offsetFor(i) - at) < Math.abs(offsetFor(best) - at)) {
          best = i;
        }
      }
      commitSnap(best);
    },
    [
      activeSnap,
      commitSnap,
      dismissable,
      dragDismiss,
      extent,
      offsetFor,
      resolved.length,
    ],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setDrag(0);
        },
        onPanResponderMove: (
          _event: unknown,
          gesture: { dx: number; dy: number },
        ) => {
          // Follow the finger along the dismiss axis only, clamped so
          // the surface never crosses fully open nor fully closed.
          const raw = sign * (horizontal ? gesture.dx : gesture.dy);
          const base = offsetFor(activeSnap);
          const min = sign > 0 ? 0 : -extent;
          const max = sign > 0 ? extent : 0;
          setDrag(Math.min(Math.max(raw, min - base), max - base));
        },
        onPanResponderRelease: (
          _event: unknown,
          gesture: { dx: number; dy: number; vx: number; vy: number },
        ) => {
          const distance = sign * (horizontal ? gesture.dx : gesture.dy);
          const velocity = sign * (horizontal ? gesture.vx : gesture.vy);
          settle(distance, velocity);
        },
        onPanResponderTerminate: () => {
          // Cancelled gesture: snap back, commit nothing.
          setDrag(0);
        },
      }),
    [activeSnap, extent, horizontal, offsetFor, settle, sign],
  );

  const expand = useCallback(() => {
    commitSnap(activeSnap + 1);
  }, [activeSnap, commitSnap]);
  const collapse = useCallback(() => {
    if (activeSnap === 0 && dismissable) dismiss();
    else commitSnap(activeSnap - 1);
  }, [activeSnap, commitSnap, dismiss, dismissable]);

  const commitSnapValue = useCallback(
    (value: DrawerSnapPoint): void => {
      const numeric = snapValueOf(value);
      commitSnap(numeric === undefined ? activeSnap : nearestIndexFor(numeric));
    },
    [activeSnap, commitSnap, nearestIndexFor],
  );

  const translate = offsetFor(activeSnap) + drag;

  const disclosure = useMemo<DrawerDisclosure>(
    () => ({
      open: isOpen ?? false,
      toggle,
      close,
      dismiss,
      modal,
      dismissable,
      side,
      horizontal,
      snapPoint: resolved[activeSnap] ?? 1,
      activeSnap,
      snapCount: resolved.length,
      translate,
      panHandlers: responder.panHandlers,
      setExtent,
      commitSnapValue,
      expand,
      collapse,
    }),
    [
      isOpen,
      toggle,
      close,
      dismiss,
      modal,
      dismissable,
      side,
      horizontal,
      resolved,
      activeSnap,
      translate,
      responder,
      commitSnapValue,
      expand,
      collapse,
    ],
  );

  // The root owns state, never layout: no host element (Base UI parity).
  return (
    <OverlayRoot
      open={isOpen}
      onOpenChange={setOpen}
      onDismiss={onDismiss}
      modal={modal}
      dismissable={dismissable}
      initialFocus={initialFocus}
      finalFocus={finalFocus}
      dismiss={{
        outsidePointer: dismissable,
        systemBack: dismissable,
        escape: dismissable,
      }}
    >
      <DrawerDisclosureContext.Provider value={disclosure}>
        {children}
      </DrawerDisclosureContext.Provider>
    </OverlayRoot>
  );
}

export type DrawerTriggerState = {
  /** Whether the drawer is currently open. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export type DrawerTriggerProps = {
  /** Terminal: it never opens and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of trigger state, caller-provided. */
  style?: StateStyle<DrawerTriggerState, StyleProp<ViewStyle>>;
  /** Trigger content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<DrawerTriggerState, SlotProps>;
};

export function DrawerTrigger({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: DrawerTriggerProps): React.ReactNode {
  const disclosure = useContext(DrawerDisclosureContext);
  const open = disclosure?.open ?? false;
  const state: DrawerTriggerState = { open, disabled };
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

  // Outside a root there is no drawer to open: render inert
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

export type DrawerPortalProps = {
  /** Portal content (Backdrop + Popup composed by the caller). */
  children?: ReactNode;
  testID?: string;
};

export function DrawerPortal({
  children,
  testID,
}: DrawerPortalProps): React.JSX.Element | null {
  const disclosure = useContext(DrawerDisclosureContext);
  // Outside a root there is no open state to present: render nothing.
  if (!disclosure) return null;
  if (!disclosure.open) return null;

  // The measured container lives here (not in the popup): the snap
  // math needs the full-bleed extent, and the container is the shared
  // layout owner the scrim and surface both fill. The disclosure is
  // re-provided inside the portal: portaled content renders at the
  // host, outside this root's subtree, so without an explicit provider
  // the parts below would read a null disclosure.
  return (
    <OverlayPortal>
      <DrawerDisclosureContext.Provider value={disclosure}>
        <View
          testID={testID === undefined ? undefined : `${testID}-container`}
          style={{ flex: 1 }}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            const next = disclosure.horizontal ? width : height;
            if (next > 0) disclosure.setExtent(next);
          }}
        >
          <View testID={testID} style={{ flex: 1 }}>
            {children}
          </View>
        </View>
      </DrawerDisclosureContext.Provider>
    </OverlayPortal>
  );
}

export type DrawerBackdropState = {
  /** Whether the drawer is currently open. */
  open: boolean;
};

export type DrawerBackdropProps = {
  testID?: string;
  /** Value or function of backdrop state, caller-provided. */
  style?: StateStyle<DrawerBackdropState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * scrim host; dismissal wiring stays on the part.
   */
  render?: RenderProp<DrawerBackdropState, SlotProps>;
};

export function DrawerBackdrop({
  testID,
  style,
  render,
}: DrawerBackdropProps): React.ReactNode {
  const disclosure = useContext(DrawerDisclosureContext);
  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: DrawerBackdropState = { open: disclosure.open };

  // Modal + dismissable: the labelled scrim dismisses (the Dialog
  // precedent). Otherwise the scrim is a plain host with no label and
  // no handler — no fake affordance — and a non-modal drawer keeps
  // its scrim inert regardless.
  if (disclosure.modal && disclosure.dismissable) {
    const handlePress = () => disclosure.dismiss("outside-press");
    const substituted = resolveRender(
      render,
      {
        accessibilityLabel: "Dismiss",
        testID,
        onPress: handlePress,
        style: [{ flex: 1 }, resolveStyle(style, state)],
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        accessibilityLabel="Dismiss"
        testID={testID}
        onPress={handlePress}
        style={[{ flex: 1 }, resolveStyle(style, state)]}
      />
    );
  }

  const substituted = resolveRender(
    render,
    {
      testID,
      style: [{ flex: 1 }, resolveStyle(style, state)],
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return <View testID={testID} style={[{ flex: 1 }, resolveStyle(style, state)]} />;
}

export type DrawerPopupState = {
  /** Whether the drawer is currently open. */
  open: boolean;
  /** Anchored edge. */
  side: DrawerSide;
  /** Active snap point value. */
  snapPoint: DrawerSnapPoint;
};

export type DrawerPopupProps = {
  /** Accessible name source for the drawer surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of popup state, caller-provided. */
  style?: StateStyle<DrawerPopupState, StyleProp<ViewStyle>>;
  /** Surface content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * surface host; role, modality, drag, and dismissal wiring stay on
   * the part.
   */
  render?: RenderProp<DrawerPopupState, SlotProps>;
  /** Forwarded to the surface `View`. */
  ref?: Ref<ElementRef<typeof View>>;
  /**
   * Explicit initial focus target (wins over the root's). Element, ref,
   * function of the open interaction, or `false` to keep focus where
   * it is. Default: the popup container or Title (never a destructive
   * action).
   */
  initialFocus?: OverlayFocusValue;
  /**
   * Explicit restore target (wins over the trigger). See
   * `OverlayRootProps.finalFocus` for the value shape.
   */
  finalFocus?: OverlayFocusValue;
};

export function DrawerPopup({
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
  initialFocus,
  finalFocus,
}: DrawerPopupProps): React.ReactNode {
  const disclosure = useContext(DrawerDisclosureContext);
  // Bridges and hooks before guards (see DialogPopup).
  const overlay = useOverlayMaybe();
  const overlayRefs = useOverlayRefsMaybe();

  const popupNodeRef = useRef<ElementRef<typeof View> | null>(null);
  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      popupNodeRef.current = node;
      if (overlayRefs) overlayRefs.popupRef.current = node;
      assignRef(ref, node);
    },
    [overlayRefs, ref],
  );

  // One focus scope per popup: Title parts register here so the
  // default initial target resolves without a DOM query on native.
  // Stops are skipped for drawers — the default is the container or
  // Title, announced with its label, never a destructive action
  // (unless the caller marks one explicitly).
  const focusScope = useMemo<FocusScope>(() => createFocusScope(), []);

  const open = disclosure?.open ?? false;
  const modal = disclosure?.modal ?? true;
  useModalFocus({
    open,
    initialFocus: initialFocus ?? overlay?.initialFocus,
    finalFocus: finalFocus ?? overlay?.finalFocus,
    scope: focusScope,
    skipStops: true,
    interactionRef: overlayRefs?.interaction,
    popupRef: popupNodeRef,
    restoreRef: overlayRefs?.triggerRef ?? { current: null },
  });

  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: DrawerPopupState = {
    open: disclosure.open,
    side: disclosure.side,
    snapPoint: disclosure.snapPoint,
  };

  // iOS VoiceOver scrub dismisses — the bound form of the `escape`
  // branch, reported as `escape-key`. Guarded on `dismissable` like
  // the platform back button.
  const canEscape =
    (overlay?.isTop ?? true) &&
    (overlay
      ? shouldDismissOn("escape", overlay.open, overlay.dismissBranches)
      : disclosure.dismissable);
  const handleAccessibilityEscape = canEscape
    ? () => disclosure.dismiss("escape-key")
    : undefined;

  // iOS modal claim on the popup (top layer only). Non-modal popups
  // claim nothing — neither trap focus nor hide anything. On web the
  // same modality is `aria-modal` plus the Tab trap below.
  const top = overlay?.isTop ?? true;
  const modalActive = modal && top;
  const web = isWebEnvironment();
  const handleKeyDown =
    web && modalActive
      ? (event: { key?: unknown; shiftKey?: unknown; preventDefault?: unknown }) =>
          trapTabKey(popupNodeRef.current, event)
      : undefined;

  // Anchor edge: full-bleed on the cross axis, flush on the side.
  const anchor: ViewStyle =
    disclosure.side === "left"
      ? { left: 0, top: 0, bottom: 0 }
      : disclosure.side === "right"
        ? { right: 0, top: 0, bottom: 0 }
        : disclosure.side === "top"
          ? { top: 0, left: 0, right: 0 }
          : { bottom: 0, left: 0, right: 0 };
  const transform = disclosure.horizontal
    ? [{ translateX: disclosure.translate }]
    : [{ translateY: disclosure.translate }];

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      role: "dialog",
      accessibilityRole: "dialog",
      accessibilityLabel,
      testID,
      onAccessibilityEscape: handleAccessibilityEscape,
      accessibilityViewIsModal: modalActive,
      ...(web && modalActive ? { "aria-modal": true } : null),
      onKeyDown: handleKeyDown,
      style: [
        { position: "absolute", ...anchor, transform },
        resolveStyle(style, state),
      ],
      children,
      ref: setPopupRef,
      ...disclosure.panHandlers,
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
        role="dialog"
        accessibilityRole="dialog"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        onAccessibilityEscape={handleAccessibilityEscape}
        accessibilityViewIsModal={modalActive}
        {...(web && modalActive ? { "aria-modal": true } : null)}
        onKeyDown={handleKeyDown}
        style={[
          { position: "absolute", ...anchor, transform },
          resolveStyle(style, state),
        ]}
        {...disclosure.panHandlers}
      >
        {children}
      </View>
    </FocusScopeProvider>
  );
}

export type DrawerTitleProps = {
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Heading content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function DrawerTitle({
  testID,
  style,
  children,
  render,
}: DrawerTitleProps): React.ReactNode {
  const scope = useFocusScopeMaybe();
  const setTitleNode = useScopeTitle(scope);
  const substituted = resolveRender(
    render,
    { testID, style, children, ref: setTitleNode } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text
      ref={setTitleNode}
      accessibilityRole="header"
      testID={testID}
      style={style}
    >
      {children}
    </Text>
  );
}

export type DrawerDescriptionProps = {
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Description content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function DrawerDescription({
  testID,
  style,
  children,
  render,
}: DrawerDescriptionProps): React.ReactNode {
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

export type DrawerCloseState = {
  /** Whether the button is currently disabled. */
  disabled: boolean;
};

export type DrawerCloseProps = {
  /** Terminal: it never closes and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of close state, caller-provided. */
  style?: StateStyle<DrawerCloseState, StyleProp<ViewStyle>>;
  /** Button content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<DrawerCloseState, SlotProps>;
  /**
   * Mark this Close as the default initial focus target. Default `false`.
   */
  initialFocus?: boolean;
};

export function DrawerClose({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  initialFocus = false,
}: DrawerCloseProps): React.ReactNode {
  const disclosure = useContext(DrawerDisclosureContext);
  const state: DrawerCloseState = { disabled };
  const scope = useFocusScopeMaybe();
  const setCloseNode = useScopeStop(scope, initialFocus);

  const closeDrawer = useCallback(() => {
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
      onPress: closeDrawer,
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
      onPress={closeDrawer}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export type DrawerHandleState = {
  /** Whether the drawer is currently open. */
  open: boolean;
  /** Index of the active snap point. */
  activeSnap: number;
  /** Number of configured snap points. */
  snapCount: number;
};

export type DrawerHandleProps = {
  testID?: string;
  /** Value or function of handle state, caller-provided. */
  style?: StateStyle<DrawerHandleState, StyleProp<ViewStyle>>;
  /** Handle content (usually none — the grip is caller style). */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<DrawerHandleState, SlotProps>;
};

/**
 * DrawerHandle — the visible grip. A button (role) with `dismiss`,
 * `expand`, and `collapse` accessibility actions: the screen-reader
 * gesture parity for drag. Tap expands one snap; the actions dismiss
 * or step the snap. Caller-styled (usually a short rounded bar).
 */
export function DrawerHandle({
  testID,
  style,
  children,
  render,
}: DrawerHandleProps): React.ReactNode {
  const disclosure = useContext(DrawerDisclosureContext);
  const state: DrawerHandleState = {
    open: disclosure?.open ?? false,
    activeSnap: disclosure?.activeSnap ?? 0,
    snapCount: disclosure?.snapCount ?? 0,
  };

  const onAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      const name = event.nativeEvent.actionName;
      if (name === "dismiss") disclosure?.dismiss("close-press");
      else if (name === "expand") disclosure?.expand();
      else if (name === "collapse") disclosure?.collapse();
    },
    [disclosure],
  );

  const pressHandle = useCallback(() => {
    disclosure?.expand();
  }, [disclosure]);

  // Outside a root there is no drawer to drive: render inert rather
  // than dropping the node silently.
  const inert = disclosure === null;
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { disabled: inert },
      testID,
      disabled: inert,
      accessibilityActions: [
        { name: "dismiss", label: "Dismiss drawer" },
        { name: "expand", label: "Expand drawer" },
        { name: "collapse", label: "Collapse drawer" },
      ],
      onAccessibilityAction,
      onPress: pressHandle,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inert }}
      testID={testID}
      disabled={inert}
      accessibilityActions={[
        { name: "dismiss", label: "Dismiss drawer" },
        { name: "expand", label: "Expand drawer" },
        { name: "collapse", label: "Collapse drawer" },
      ]}
      onAccessibilityAction={onAccessibilityAction}
      onPress={pressHandle}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}
