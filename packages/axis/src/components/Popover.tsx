import {
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useRef,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { Placement } from "../positioning";
import { useControllableState } from "../useControllableState";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Popover — a non-modal anchored overlay with tap toggle and scrim dismissal.
 *
 * Tap the anchor to toggle (a `Pressable` `onPress` — not the Tooltip
 * long-press; popovers open on tap). The box is measured and placed
 * with `useFloatingPlacement` (anchor `measure()` + viewport +
 * `resolveFloatingRect`); until measured it stays transparent at
 * origin rather than flashing somewhere wrong. Unlike Dialog there is
 * no `Modal`: the scrim and the box render inline, as siblings of the
 * anchor inside the anchor wrapper. The scrim is a transparent
 * absolute-fill `Pressable` labelled "Dismiss" — scrim press closes
 * through `onDismiss` + `onOpenChange(false)`; taps inside the box do
 * not dismiss (the box is the scrim's sibling, not its child, unlike
 * the Dialog surface). State follows `useControllableState`: `open`
 * (+ `onOpenChange`) for controlled use, `defaultOpen` for
 * uncontrolled (default `false`). Closed renders the anchor only —
 * no scrim, no box.
 *
 * Deferred, each for a named reason (not oversight):
 * - No animation: the box mounts/unmounts synchronously with state.
 *   Exit transitions would need the `presence` model to keep the box
 *   mounted until the animation finishes; until a consumer needs
 *   animated dismissal, that machinery buys zero observed behavior
 *   (the Dialog precedent).
 * - No arrow/chrome: unstyled by contract — every visual value is
 *   caller-provided (`style`, `popoverStyle`); there is no surface to
 *   decorate.
 * - No hover: no pointer on touch devices (the Tooltip precedent).
 * - No focus trap: containing accessibility focus needs the
 *   `focusTrap` + `overlayModality` models adapted to RN
 *   accessibility-focus traversal (no DOM tab order to borrow);
 *   until that adaptation lands, the box only declares its label and
 *   leaves traversal to the host (the Dialog precedent).
 *
 * Accessibility notes: the box is an accessibility element
 * (`accessible`) carrying `accessibilityLabel` so the region is
 * announced — but it declares NO role. React Native defines no
 * popover role (checked against the installed RN `ViewAccessibility`
 * `AccessibilityRole` union, which has none), and an unbacked role
 * claim is worse than honest silence (the Label/Separator precedent).
 *
 * Test ids follow Dialog: the box carries `testID`; the scrim
 * carries `<testID>-scrim`. The anchor wrapper carries none, so the
 * box query can never collide with it.
 */

export type PopoverProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed toggle or dismiss. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * Preferred side. Default `"bottom"` (the `resolveFloatingRect`
   * fallback). Clamped into the viewport.
   */
  placement?: Placement;
  /** Anchor content the popover is attached to (required). Tap toggles. */
  children: ReactNode;
  /** Popover body content (required — an empty box is a bug). */
  content: ReactNode;
  /** Accessible name source for the popover region. */
  accessibilityLabel?: string;
  testID?: string;
  /** Anchor wrapper style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Popover box style, caller-provided. */
  popoverStyle?: StyleProp<ViewStyle>;
  /** Forwarded to the anchor wrapper host element. */
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
  ref: PopoverProps["ref"],
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

/**
 * Structural scrim fill: positioning, not a visual value (no color,
 * so the scrim stays transparent). The Tooltip `position: absolute`
 * precedent — structure the component owns, visuals the caller owns.
 */
const SCRIM_STYLE: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function Popover({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  placement,
  children,
  content,
  accessibilityLabel,
  testID,
  style,
  popoverStyle,
  ref,
}: PopoverProps): React.JSX.Element {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      anchorHostRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const floating = useFloatingPlacement({
    anchorRef: anchorHostRef,
    placement,
    active: isOpen ?? false,
  });

  const toggle = useCallback(() => {
    setOpen((previous) => !(previous ?? false));
  }, [setOpen]);

  // Scrim path (the Dialog order): `onDismiss` first, then report
  // `false`. `useControllableState` drops the `onOpenChange` call when
  // the value is unchanged, so dismissing an already-closed popover
  // stays silent.
  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false);
  }, [onDismiss, setOpen]);

  return (
    <View ref={setAnchorRef} style={style}>
      <Pressable onPress={toggle}>{children}</Pressable>
      {isOpen ? (
        <>
          <Pressable
            accessibilityLabel="Dismiss"
            testID={testID ? `${testID}-scrim` : undefined}
            onPress={dismiss}
            style={SCRIM_STYLE}
          />
          <View
            // Explicit like the Tooltip rule: a labelled region whose
            // element flag never reaches assistive tech is broken. No
            // role — RN defines none for popovers (see header).
            accessible
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            onLayout={floating.onContentLayout}
            style={[floating.style, popoverStyle]}
          >
            {content}
          </View>
        </>
      ) : null}
    </View>
  );
}
