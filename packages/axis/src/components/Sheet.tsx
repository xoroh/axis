import {
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Sheet — an unstyled bottom sheet with detents and drag dismissal.
 *
 * Structure only: an RN `Modal` (transparent) holding a scrim layer
 * with the sheet surface bottom-anchored inside it. No default
 * visuals — every visual value (`overlayStyle`, `surfaceStyle`,
 * `titleStyle`) is caller-provided. State follows the
 * `useControllableState` pattern twice: `open` (+ `onOpenChange`)
 * for visibility, `snapIndex` (+ `onSnapIndexChange`) for the active
 * detent. Presence is mount/unmount: closed renders `null`.
 *
 * Detents are fractions (0, 1] of the measured container height
 * (`detents`, default `[1]`): the sheet rests at
 * `height × (1 − fraction)` from the top. The container is measured
 * with the surface's own `onLayout` (last measurement wins; before
 * the first layout the sheet rests fully open rather than hiding —
 * a hidden-until-measured sheet would read as a mount failure).
 * Out-of-range, non-finite, and duplicate fractions are
 * clamped/dropped/deduped; an empty resolution falls back to `[1]`.
 * Nothing here throws on caller input.
 *
 * Drag (the `PanResponder` sheet pattern): a vertical drag on the
 * surface follows the finger (`dragDy` state); on release a downward
 * drag past the dismiss distance (`max(64dp, 20% of container)`) or
 * with downward velocity dismisses when `dismissable` (otherwise it
 * snaps back), and any other release settles to the nearest detent.
 * Screen-reader users get the same moves through `expand`/`collapse`
 * accessibility actions — gesture parity, not a gesture requirement.
 * When `dismissable` (default `true`) the scrim is a `Pressable`
 * labelled "Dismiss"; when `false` it is a plain `View` with no
 * label and no handler. `Modal.onRequestClose` is always wired to
 * the same dismiss path and no-ops when not `dismissable`.
 *
 * Deferred, each for a named reason (not oversight):
 * - No animation: the surface tracks state synchronously (Dialog
 *   precedent). Spring/detent animation would need the `presence`
 *   model to keep the surface mounted through transitions; until a
 *   consumer needs it, that machinery buys zero observed behavior.
 * - No `BackHandler` beyond `Modal.onRequestClose` (Dialog
 *   precedent: a lone surface must not own the global back button).
 * - No focus trap: containing accessibility focus needs the
 *   `focusTrap` + `overlayModality` models adapted to RN
 *   accessibility-focus traversal; until then the surface declares
 *   the dialog role and label and leaves traversal to the host.
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
 * event — detent math without a measured container is untestable.
 */

export type SheetProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed dismiss. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim, drag, or request-close dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * When `false`, scrim press and drag-down do nothing: the sheet can
   * only close through the caller's own actions. Default `true`.
   */
  dismissable?: boolean;
  /**
   * Snap fractions (0, 1] of container height. Default `[1]`
   * (fully open). Sorted, clamped, deduped; empty resolves to `[1]`.
   */
  detents?: number[];
  /** Controlled snap index into `detents`. Wins over `defaultSnapIndex`. */
  snapIndex?: number;
  /** Uncontrolled initial snap index. Default `0`. */
  defaultSnapIndex?: number;
  /** Fires when the snap index changes on a committed settle. */
  onSnapIndexChange?: (index: number) => void;
  /** Sheet title, rendered in a `Text` when provided. */
  title?: ReactNode;
  /** Sheet content. */
  children?: ReactNode;
  /** Accessible name source for the sheet surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Scrim layer style, caller-provided. */
  overlayStyle?: StyleProp<ViewStyle>;
  /** Sheet surface (box) style, caller-provided. */
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
  ref: SheetProps["ref"],
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

/** Downward drag that dismisses: 64dp or 20% of container, whichever is more. */
function dismissDistanceFor(containerHeight: number): number {
  return Math.max(64, containerHeight * 0.2);
}

export function Sheet({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  dismissable = true,
  detents = [1],
  snapIndex,
  defaultSnapIndex = 0,
  onSnapIndexChange,
  title,
  children,
  accessibilityLabel,
  testID,
  overlayStyle,
  surfaceStyle,
  titleStyle,
  ref,
}: SheetProps): React.JSX.Element | null {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );
  const [containerHeight, setContainerHeight] = useState(0);
  const [dragDy, setDragDy] = useState(0);

  // Resolved detents: finite fractions in (0, 1], ascending, deduped.
  // Never throws: garbage resolves to [1] (fully open).
  const resolved = useMemo(() => {
    const clean = detents.filter((f) => Number.isFinite(f) && f > 0 && f <= 1);
    const sorted = [...new Set(clean)].sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : [1];
  }, [detents]);

  const [rawSnap, setRawSnap] = useControllableState<number>(
    snapIndex,
    defaultSnapIndex,
    onSnapIndexChange,
  );
  // A controlled index past the end (detents shrank under it) clamps
  // silently — the sheet rests at the nearest real detent. The hook
  // types the value as possibly undefined (uncontrolled without a
  // default); the default parameter above guarantees 0, and the
  // fallback satisfies the typechecker, not a runtime path.
  const activeSnap = Math.min(Math.max(0, rawSnap ?? 0), resolved.length - 1);

  const commitSnap = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(0, next), resolved.length - 1);
      setRawSnap(clamped);
    },
    [resolved.length, setRawSnap],
  );

  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false);
  }, [onDismiss, setOpen]);

  // translateY for a detent: fully open (fraction 1) rests at 0, a
  // half detent rests half a container below the top. The index is
  // always clamped before use, so the fallback never fires (it
  // satisfies noUncheckedIndexedAccess, not a runtime path).
  const offsetFor = useCallback(
    (index: number) => containerHeight * (1 - (resolved[index] ?? 1)),
    [containerHeight, resolved],
  );

  const settle = useCallback(
    (dy: number, vy: number) => {
      setDragDy(0);
      if (
        dismissable &&
        (dy >= dismissDistanceFor(containerHeight) || vy > 0.75)
      ) {
        dismiss();
        return;
      }
      // Nearest detent to the release point.
      const at = offsetFor(activeSnap) + dy;
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
      containerHeight,
      dismiss,
      dismissable,
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
          setDragDy(0);
        },
        onPanResponderMove: (_event: unknown, gestureState: { dy: number }) => {
          // Clamp the follow: never above the container top, never
          // below its bottom.
          const base = offsetFor(activeSnap);
          setDragDy(
            Math.min(Math.max(gestureState.dy, -base), containerHeight - base),
          );
        },
        onPanResponderRelease: (
          _event: unknown,
          gestureState: { dy: number; vy: number },
        ) => {
          settle(gestureState.dy, gestureState.vy);
        },
        onPanResponderTerminate: () => {
          // Cancelled gesture: snap back, commit nothing.
          setDragDy(0);
        },
      }),
    [activeSnap, containerHeight, offsetFor, settle],
  );

  const expand = useCallback(() => {
    commitSnap(activeSnap + 1);
  }, [activeSnap, commitSnap]);
  const collapse = useCallback(() => {
    if (activeSnap === 0 && dismissable) dismiss();
    else commitSnap(activeSnap - 1);
  }, [activeSnap, commitSnap, dismiss, dismissable]);

  if (!isOpen) return null;

  const translateY = offsetFor(activeSnap) + dragDy;
  const scrimLabel = dismissable ? "Dismiss" : undefined;

  return (
    <Modal transparent onRequestClose={dismissable ? dismiss : undefined}>
      <View
        style={[{ flex: 1, justifyContent: "flex-end" }, overlayStyle]}
        testID={testID === undefined ? undefined : `${testID}-container`}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height > 0) setContainerHeight(height);
        }}
      >
        {dismissable ? (
          <Pressable
            accessibilityLabel={scrimLabel}
            testID={testID === undefined ? undefined : `${testID}-scrim`}
            onPress={dismiss}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View
          accessible
          accessibilityRole="dialog"
          accessibilityLabel={accessibilityLabel}
          accessibilityActions={[
            { name: "expand", label: "Expand sheet" },
            { name: "collapse", label: "Collapse sheet" },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "expand") expand();
            else if (event.nativeEvent.actionName === "collapse") collapse();
          }}
          testID={testID}
          style={[{ transform: [{ translateY }] }, surfaceStyle]}
          ref={(node) => assignRef(ref, node)}
          {...responder.panHandlers}
        >
          {title === undefined ? null : <Text style={titleStyle}>{title}</Text>}
          {children}
        </View>
      </View>
    </Modal>
  );
}
