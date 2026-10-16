import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  Modal,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * NavigationDrawer — an unstyled edge-anchored navigation panel.
 *
 * Structure only: an RN `Modal` (transparent) holding a scrim layer
 * with the drawer surface anchored to the leading (`side="left"`,
 * default) or trailing edge. No default visuals — every visual
 * value (`overlayStyle`, `surfaceStyle`) is caller-provided; width
 * especially is caller geometry. State follows the
 * `useControllableState` pattern (`open`/`defaultOpen`/
 * `onOpenChange`); presence is mount/unmount. When `dismissable`
 * (default `true`) the scrim is a `Pressable` labelled "Dismiss"
 * and scrim press closes via `onDismiss` + `onOpenChange(false)`
 * (the `Dialog` scrim precedent); when `false` the scrim is a plain
 * `View` with no label and no handler. `Modal.onRequestClose` is
 * always wired to the same dismiss path and no-ops when not
 * `dismissable`.
 *
 * Deferred, each for a named reason (not oversight): no drag
 * gestures (the `Sheet` PanResponder pattern covers drag; a drawer
 * that needs edge-swipe says so in its section and composes it),
 * no animation (the `Dialog` precedent), no `BackHandler` beyond
 * `Modal.onRequestClose` (the `Dialog` precedent), no focus trap
 * (the `Dialog` precedent).
 *
 * Accessibility notes: the surface is an accessibility element
 * (`accessible`) so the `dialog` role reaches assistive tech. The
 * `modal` flag is deliberately omitted from `accessibilityState`:
 * React Native's `AccessibilityState` host type has no `modal` key
 * (checked against the RN 0.87 `ViewAccessibility` types), so it is
 * left out rather than smuggled past the typechecker.
 *
 * Test ids: the surface carries `testID`; the scrim carries
 * `<testID>-scrim` when `testID` is given (the Accordion `-panel`
 * precedent).
 */

export type NavigationDrawerProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed dismiss. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim (or request-close) dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * When `false`, scrim press does nothing: the drawer can only
   * close through the caller's own actions. Default `true`.
   */
  dismissable?: boolean;
  /** Anchored edge. Default `"left"`. */
  side?: "left" | "right";
  /** Drawer content. */
  children?: ReactNode;
  /** Accessible name source for the drawer surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Scrim layer style, caller-provided. */
  overlayStyle?: StyleProp<ViewStyle>;
  /** Drawer surface (box) style, caller-provided (width lives here). */
  surfaceStyle?: StyleProp<ViewStyle>;
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
  ref: NavigationDrawerProps["ref"],
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

export function NavigationDrawer({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  dismissable = true,
  side = "left",
  children,
  accessibilityLabel,
  testID,
  overlayStyle,
  surfaceStyle,
  ref,
}: NavigationDrawerProps): React.JSX.Element | null {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false);
  }, [onDismiss, setOpen]);

  if (!isOpen) return null;

  const anchor = side === "left" ? { left: 0 } : { right: 0 };

  return (
    <Modal transparent onRequestClose={dismissable ? dismiss : undefined}>
      <View style={[{ flex: 1 }, overlayStyle]}>
        {dismissable ? (
          <Pressable
            accessibilityLabel="Dismiss"
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
          testID={testID}
          style={[
            { position: "absolute", top: 0, bottom: 0, ...anchor },
            surfaceStyle,
          ]}
          ref={(node) => assignRef(ref, node)}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}
