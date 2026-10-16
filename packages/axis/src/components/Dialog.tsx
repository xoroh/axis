import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  Modal,
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
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
