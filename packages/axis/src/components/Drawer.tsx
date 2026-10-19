import {
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  PanResponder,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { OverlayPortal, OverlayRoot } from "./Overlay";

/**
 * Drawer — an unstyled edge-anchored panel with snap points and swipe dismissal.
 *
 * Base UI naming (owner direction, verified live 2026-10-19): the
 * edge-anchored panel is a `Drawer`, and Base UI `Drawer` owns snap
 * points — so the bottom-sheet `Sheet` folds in here instead of
 * living beside it. `snapPoints` are preset resting positions along
 * the dismiss axis: numbers in (0, 1] are fractions of the measured
 * container extent (width for `left`/`right`, height for `top`/
 * `bottom`); numbers greater than 1 are dp; `'NNNpx'` strings are dp.
 * Anything else (`rem`, garbage) resolves out; an empty resolution
 * falls back to `[1]` (fully open). Nothing here throws on caller
 * input.
 *
 * Structure only: the `Overlay` root painting at the app's
 * `PortalHost`, holding a scrim layer with the drawer surface
 * anchored to its `side` (default `"left"`). No default visuals —
 * every visual value (`overlayStyle`, `surfaceStyle`) is
 * caller-provided; cross-axis size (width for side drawers, height
 * for top/bottom) especially is caller geometry. State follows the
 * `useControllableState` pattern three times: `open` (+
 * `onOpenChange`) for visibility, `snapPoint` (+
 * `onSnapPointChange`) for the active snap value, `side` is static.
 * Presence is mount/unmount: closed renders `null`.
 *
 * The container is measured with the surface's own `onLayout` (last
 * measurement wins; before the first layout the drawer rests at its
 * snap rather than hiding — a hidden-until-measured drawer would read
 * as a mount failure).
 *
 * Drag (the `Sheet` PanResponder pattern, generalized): a drag on the
 * surface along the dismiss axis follows the finger (`drag` state);
 * on release a drag past the dismiss distance (`max(64dp, 20% of the
 * dismiss-axis extent)`) or with dismiss-direction velocity dismisses
 * when `dismissable` (otherwise it snaps back), and any other release
 * settles to the nearest snap point. Screen-reader users get the same
 * moves through `expand`/`collapse` accessibility actions — gesture
 * parity, not a gesture requirement.
 *
 * Scrim and modality: when `dismissable` (default `true`) AND `modal`
 * (default `true`) the scrim is a `Pressable` labelled "Dismiss" and
 * scrim press closes via `onDismiss` + `onOpenChange(false)` (the
 * `Dialog` scrim precedent); otherwise it is a plain `View` with no
 * label and no handler. In particular a non-modal drawer (`modal`
 * `false`) keeps its scrim inert — dismiss through caller actions,
 * drag, or system back, which still follows `dismissable` alone.
 * `Modal.onRequestClose` is always wired to the same dismiss path
 * and no-ops when not `dismissable` (the `Overlay` root owns it).
 *
 * Deferred, each for a named reason (not oversight):
 * - No animation: the surface tracks state synchronously (Dialog
 *   precedent). Spring/snap animation would need the `presence`
 *   model to keep the surface mounted through transitions; until a
 *   consumer needs it, that machinery buys zero observed behavior.
 * - No focus trap beyond the overlay root's modal announcement and
 *   focus move/restore (the `focusTrap` RN adaptation, parity D5).
 *
 * Accessibility notes: the surface is an accessibility element
 * (`accessible`) so the `dialog` role reaches assistive tech. The
 * `modal` flag is deliberately omitted from `accessibilityState`:
 * React Native's `AccessibilityState` host type has no `modal` key
 * (checked against the RN 0.87 `ViewAccessibility` types), so it is
 * left out rather than smuggled past the typechecker.
 *
 * Test ids: the surface carries `testID`; the scrim carries
 * `<testID>-scrim` and the measured container `<testID>-container`
 * when `testID` is given (the Accordion `-panel` precedent). The
 * container id exists so tests can drive measurement with a layout
 * event — snap math without a measured container is untestable.
 */

export type DrawerSide = "left" | "right" | "top" | "bottom";

/** A snap point value: fraction of the container extent, dp, or px string. */
export type DrawerSnapPoint = number | string;

export type DrawerState = {
  /** Whether the drawer is currently open. */
  open: boolean;
  /** Anchored edge. */
  side: DrawerSide;
  /** Active snap point value. */
  snapPoint: DrawerSnapPoint;
};

export type DrawerProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed dismiss. */
  onOpenChange?: (open: boolean) => void;
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
   * (fully open — previous Drawer behavior). Numbers in (0, 1] are
   * fractions of the measured container extent; numbers greater than 1
   * are dp; `'NNNpx'` strings are dp. Sorted, deduped; garbage resolves
   * out and an empty resolution falls back to `[1]`.
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
  /** Drawer content. */
  children?: ReactNode;
  /** Accessible name source for the drawer surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Scrim layer style, caller-provided. */
  overlayStyle?: StyleProp<ViewStyle>;
  /** Drawer surface (box) style: value or function of drawer state. */
  surfaceStyle?: StateStyle<DrawerState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity) for the drawer
   * surface: an element is cloned with the surface props merged under
   * its own; a function receives `(props, state)`. The overlay host,
   * scrim, drag, and snap wiring stay on the part.
   */
  render?: RenderProp<DrawerState, SlotProps>;
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
  ref: DrawerProps["ref"],
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

export function Drawer({
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
  children,
  accessibilityLabel,
  testID,
  overlayStyle,
  surfaceStyle,
  render,
  ref,
}: DrawerProps): React.ReactNode {
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
  // A controlled value past the end (snapPoints shrank under it)
  // clamps silently — the drawer rests at the nearest real snap.
  // The hook types the value as possibly undefined; the default
  // above guarantees 0, and the fallback satisfies the typechecker,
  // not a runtime path.
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

  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false);
  }, [onDismiss, setOpen]);

  const horizontal = side === "left" || side === "right";
  // Dismiss direction along the axis: left/top retreat negative,
  // right/bottom positive.
  const sign = side === "left" || side === "top" ? -1 : 1;

  // Resting translation for a snap index: fractions of the measured
  // extent, dp values as visible sizes. The index is always clamped
  // before use, so the fallback never fires.
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
        dismiss();
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
      dismiss,
      dismissable,
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

  if (!isOpen) return null;

  const translate = offsetFor(activeSnap) + drag;
  const transform = horizontal
    ? [{ translateX: translate }]
    : [{ translateY: translate }];
  // Anchor edge: full-bleed on the cross axis, flush on the side.
  const anchor: ViewStyle =
    side === "left"
      ? { left: 0, top: 0, bottom: 0 }
      : side === "right"
        ? { right: 0, top: 0, bottom: 0 }
        : side === "top"
          ? { top: 0, left: 0, right: 0 }
          : { bottom: 0, left: 0, right: 0 };
  const scrimLabel = modal && dismissable ? "Dismiss" : undefined;
  const state: DrawerState = {
    open: true,
    side,
    snapPoint: resolved[activeSnap] ?? 1,
  };

  function commitSnapValue(value: DrawerSnapPoint): void {
    const numeric = snapValueOf(value);
    commitSnap(numeric === undefined ? activeSnap : nearestIndexFor(numeric));
  }

  const onSurfaceAccessibilityAction = (event: {
    nativeEvent: { actionName: string };
  }) => {
    if (event.nativeEvent.actionName === "expand") expand();
    else if (event.nativeEvent.actionName === "collapse") collapse();
  };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "dialog",
      accessibilityLabel,
      accessibilityActions: [
        { name: "expand", label: "Expand drawer" },
        { name: "collapse", label: "Collapse drawer" },
      ],
      onAccessibilityAction: onSurfaceAccessibilityAction,
      testID,
      style: [
        { position: "absolute", ...anchor, transform },
        resolveStyle(surfaceStyle, state),
      ],
      children,
      onDismiss: dismiss,
      onSnapPointChange: commitSnapValue,
      ref,
      ...responder.panHandlers,
    } satisfies SlotProps,
    state,
  );

  const surface =
    substituted !== null ? (
      substituted
    ) : (
      <View
        accessible
        accessibilityRole="dialog"
        accessibilityLabel={accessibilityLabel}
        accessibilityActions={[
          { name: "expand", label: "Expand drawer" },
          { name: "collapse", label: "Collapse drawer" },
        ]}
        onAccessibilityAction={onSurfaceAccessibilityAction}
        testID={testID}
        style={[
          { position: "absolute", ...anchor, transform },
          resolveStyle(surfaceStyle, state),
        ]}
        ref={(node) => assignRef(ref, node)}
        {...responder.panHandlers}
      >
        {children}
      </View>
    );

  return (
    <OverlayRoot
      open={isOpen}
      onOpenChange={setOpen}
      onDismiss={dismiss}
      modal={modal}
      dismissable={dismissable}
      dismiss={{
        outsidePointer: dismissable,
        systemBack: dismissable,
        escape: dismissable,
      }}
    >
      <OverlayPortal
        testID={testID === undefined ? undefined : `${testID}-portal`}
      >
        <View
          style={[{ flex: 1 }, overlayStyle]}
          testID={testID === undefined ? undefined : `${testID}-container`}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            const next = horizontal ? width : height;
            if (next > 0) setExtent(next);
          }}
        >
          {scrimLabel !== undefined ? (
            <Pressable
              accessibilityLabel={scrimLabel}
              testID={testID === undefined ? undefined : `${testID}-scrim`}
              onPress={dismiss}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {surface}
        </View>
      </OverlayPortal>
    </OverlayRoot>
  );
}
