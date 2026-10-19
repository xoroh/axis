import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
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
import type { Align, Placement } from "../positioning";
import {
  type RenderProp,
  resolveRender,
  resolveStyle,
  type StateStyle,
} from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { OverlayPortal, OverlayRoot } from "./Overlay";
import { Portal } from "./Portal";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Popover — a non-modal anchored overlay with tap toggle and scrim dismissal.
 *
 * Tap the anchor to toggle (a `Pressable` `onPress` — not the Tooltip
 * long-press; popovers open on tap). The box is measured and placed
 * with `useFloatingPlacement` (anchor `measure()` + viewport +
 * `resolveFloatingRect`); until measured it stays transparent at
 * origin rather than flashing somewhere wrong. Unlike Dialog there is
 * no `Modal`: the box and scrim present through `Portal` at the app's
 * `PortalHost` — above sibling content, never trapped in the anchor's
 * box. The scrim is a transparent absolute-fill `Pressable` labelled
 * "Dismiss" — scrim press closes through `onDismiss` +
 * `onOpenChange(false)`; taps inside the box do not dismiss (the box
 * is the scrim's sibling, not its child, unlike the Dialog surface). State follows `useControllableState`: `open`
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
        <Portal>
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
        </Portal>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* `<Popover>` above is the concise inline API (anchor + in-box scrim  */
/* + measured box, children partitioned into anchor/content props).    */
/* The parts below mirror Base UI's Popover anatomy — Root (state      */
/* owner, renders no element), Trigger (tap toggle + anchor            */
/* registration), Portal (overlay host when modal, in-box otherwise),  */
/* Backdrop (the scrim, modal only), Positioner (measured placement   */
/* against the trigger anchor), Popup (the content box), Title,        */
/* Description, Close, Arrow — with `render` element/function          */
/* composition and value-or-function `style` on every part. The       */
/* monolith stays non-modal inline by design: popovers are             */
/* non-modal overlays, so the compound defaults `modal` to `false`    */
/* (the inverse of Dialog/Menu). Omitted Base UI pieces are           */
/* documented deviations, not oversights: no `data-*` attributes      */
/* (D1), no `Viewport` (caller `ScrollView` content), no focus        */
/* containment (D5), no animation states (D9), no `modal` trap-focus   */
/* distinction, and no popover role claim — RN defines none, so the   */
/* box stays a labelled region like the monolith (honest silence).     */
/* ------------------------------------------------------------------ */

export type PopoverRootState = {
  open: boolean;
};

export type PopoverRootProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed toggle or dismissal. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * When `true`, backdrop press does not dismiss. Default `false`.
   */
  disablePointerDismissal?: boolean;
  /**
   * Whether the open popover presents modally (an overlay host with a
   * scrim). Default `false` — popovers are non-modal overlays; the
   * portal renders in-box and the trigger stays pressable. Presses
   * outside reach the app rather than dismissing (same documented
   * limitation as non-modal menus).
   */
  modal?: boolean;
  /** Trigger, Portal, and shared content. Renders no element itself. */
  children?: ReactNode;
  /** Accepted for ref-spreading callers; the root renders no element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type PopoverTriggerState = {
  /** Whether the popover is currently open. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export type PopoverTriggerProps = {
  /** Terminal: it never toggles and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of trigger state, caller-provided. */
  style?: StateStyle<PopoverTriggerState, StyleProp<ViewStyle>>;
  /** Trigger (anchor) content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<PopoverTriggerState, SlotProps>;
};

export type PopoverBackdropState = {
  /** Whether the popover is currently open. */
  open: boolean;
};

export type PopoverBackdropProps = {
  testID?: string;
  /** Value or function of backdrop state, caller-provided. */
  style?: StateStyle<PopoverBackdropState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<PopoverBackdropState, SlotProps>;
};

export type PopoverPositionerState = {
  /** Whether the popover is currently open. */
  open: boolean;
};

export type PopoverPositionerProps = {
  /** Preferred side for the content box. Default `"bottom"`. */
  side?: Placement;
  /** Cross-axis alignment. Default `"center"`. */
  align?: Align;
  /** Gap between anchor and content edges. Default `0`. */
  sideOffset?: number;
  /** Shift along the cross axis after alignment. Default `0`. */
  alignOffset?: number;
  testID?: string;
  /** Value or function of positioner state, caller-provided. */
  style?: StateStyle<PopoverPositionerState, StyleProp<ViewStyle>>;
  /** Popup (and optional Arrow content) composed by the caller. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<PopoverPositionerState, SlotProps>;
};

export type PopoverPopupState = {
  /** Whether the popover is currently open. */
  open: boolean;
};

export type PopoverPopupProps = {
  /** Accessible name source for the popover region (no role — see module note). */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of popup state, caller-provided. */
  style?: StateStyle<PopoverPopupState, StyleProp<ViewStyle>>;
  /** Popup content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<PopoverPopupState, SlotProps>;
  /** Forwarded to the content `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type PopoverTitleProps = {
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Heading content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type PopoverDescriptionProps = {
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Description content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type PopoverCloseState = {
  /** Whether the button is currently disabled. */
  disabled: boolean;
};

export type PopoverCloseProps = {
  /** Terminal: it never closes and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of close state, caller-provided. */
  style?: StateStyle<PopoverCloseState, StyleProp<ViewStyle>>;
  /** Button content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<PopoverCloseState, SlotProps>;
};

export type PopoverArrowProps = {
  testID?: string;
  /**
   * Marker style, caller-provided. Positioning is caller geometry
   * (same documented rule as `MenuArrow`).
   */
  style?: StyleProp<ViewStyle>;
  /** Marker content (usually none — the shape is caller style). */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type PopoverPortalProps = {
  /** Portal content (Backdrop + Positioner composed by the caller). */
  children?: ReactNode;
  testID?: string;
};

type PopoverDisclosure = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  dismiss: () => void;
  disablePointerDismissal: boolean;
  modal: boolean;
  anchorHostRef: { current: ElementRef<typeof View> | null };
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
};

/**
 * Shared open state for the compound parts. Internal (not exported).
 */
const PopoverDisclosureContext = createContext<PopoverDisclosure | null>(null);

/**
 * Assign one value to every ref in the list, for the popup host.
 * Inline here (not imported) deliberately — the contract rule.
 */
function assignPopupRef(
  ref: PopoverPopupProps["ref"],
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

export function PopoverRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  disablePointerDismissal = false,
  modal = false,
  children,
  ref,
}: PopoverRootProps): React.JSX.Element {
  // Accepted for ref-spreading callers; the root renders no element.
  void ref;
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const toggle = useCallback(() => {
    setOpen((previous) => !(previous ?? false));
  }, [setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Backdrop path: `onDismiss` first, then report `false`.
  // Guarded on `disablePointerDismissal`.
  const dismiss = useCallback(() => {
    if (disablePointerDismissal) return;
    onDismiss?.();
    setOpen(false);
  }, [disablePointerDismissal, onDismiss, setOpen]);

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  const disclosure = useMemo<PopoverDisclosure>(
    () => ({
      open: isOpen ?? false,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
      anchorHostRef,
      setAnchorRef,
    }),
    [
      isOpen,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
      setAnchorRef,
    ],
  );

  return (
    <OverlayRoot
      open={isOpen}
      onOpenChange={setOpen}
      onDismiss={onDismiss}
      modal={modal}
      dismissable={!disablePointerDismissal}
      dismiss={{
        outsidePointer: !disablePointerDismissal,
        systemBack: !disablePointerDismissal,
        escape: !disablePointerDismissal,
      }}
    >
      <PopoverDisclosureContext.Provider value={disclosure}>
        {children}
      </PopoverDisclosureContext.Provider>
    </OverlayRoot>
  );
}

export function PopoverTrigger({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: PopoverTriggerProps): React.ReactNode {
  const disclosure = useContext(PopoverDisclosureContext);
  const open = disclosure?.open ?? false;
  const state: PopoverTriggerState = { open, disabled };

  const toggleTrigger = useCallback(() => {
    if (disabled) return;
    disclosure?.toggle();
  }, [disabled, disclosure]);

  const setTriggerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      disclosure?.setAnchorRef(node);
    },
    [disclosure],
  );

  // Outside a root there is no popover to toggle: render inert
  // rather than dropping the node silently.
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

export function PopoverPortal({
  children,
  testID,
}: PopoverPortalProps): React.JSX.Element | null {
  const disclosure = useContext(PopoverDisclosureContext);
  // Outside a root there is no open state to present: render nothing.
  if (!disclosure) return null;
  if (!disclosure.open) return null;

  // Non-modal roots (the default for popovers) present through the
  // plain `Portal` at the app's `PortalHost` — above sibling content,
  // with no scrim trap, like the monolith. Presses outside reach the
  // app rather than dismissing (same documented limitation as
  // non-modal menus).
  //
  // The disclosure is re-provided inside the portal: portaled content
  // renders at the host, outside this root's subtree, so without an
  // explicit provider the parts below would read a null disclosure.
  if (!disclosure.modal) {
    return (
      <Portal>
        <PopoverDisclosureContext.Provider value={disclosure}>
          <View testID={testID}>{children}</View>
        </PopoverDisclosureContext.Provider>
      </Portal>
    );
  }
  return <OverlayPortal testID={testID}>{children}</OverlayPortal>;
}

export function PopoverBackdrop({
  testID,
  style,
  render,
}: PopoverBackdropProps): React.ReactNode {
  const disclosure = useContext(PopoverDisclosureContext);
  if (!disclosure) return null;
  if (!disclosure.open) return null;
  // The backdrop exists only for modal roots: without an overlay host
  // a full-fill scrim would trap the app's touches with no way to
  // dismiss except the trigger (the non-modal shape keeps the
  // trigger pressable instead).
  if (!disclosure.modal) return null;
  const state: PopoverBackdropState = { open: disclosure.open };

  if (!disclosure.disablePointerDismissal) {
    const substituted = resolveRender(
      render,
      {
        accessibilityLabel: "Dismiss",
        testID,
        onPress: disclosure.dismiss,
        style: resolveStyle(style, state),
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        accessibilityLabel="Dismiss"
        testID={testID}
        onPress={disclosure.dismiss}
        style={[SCRIM_STYLE, resolveStyle(style, state)]}
      />
    );
  }

  const substituted = resolveRender(
    render,
    { testID, style: resolveStyle(style, state) } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return (
    <View testID={testID} style={[SCRIM_STYLE, resolveStyle(style, state)]} />
  );
}

export function PopoverPositioner({
  side,
  align,
  sideOffset,
  alignOffset,
  testID,
  style,
  children,
  render,
}: PopoverPositionerProps): React.ReactNode {
  const disclosure = useContext(PopoverDisclosureContext);
  // Hooks before guards: measurement runs (harmlessly) even while
  // closed so activation never reorders hook calls.
  const floating = useFloatingPlacement({
    anchorRef: disclosure?.anchorHostRef ?? { current: null },
    placement: side,
    offset: sideOffset,
    align,
    alignOffset,
    active: disclosure?.open ?? false,
  });
  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: PopoverPositionerState = { open: disclosure.open };

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

export function PopoverPopup({
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: PopoverPopupProps): React.ReactNode {
  const disclosure = useContext(PopoverDisclosureContext);

  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignPopupRef(ref, node);
    },
    [ref],
  );

  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: PopoverPopupState = { open: disclosure.open };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
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
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      {children}
    </View>
  );
}

export function PopoverTitle({
  testID,
  style,
  children,
  render,
}: PopoverTitleProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text accessibilityRole="header" testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function PopoverDescription({
  testID,
  style,
  children,
  render,
}: PopoverDescriptionProps): React.ReactNode {
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

export function PopoverClose({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: PopoverCloseProps): React.ReactNode {
  const disclosure = useContext(PopoverDisclosureContext);
  const state: PopoverCloseState = { disabled };

  const closePopover = useCallback(() => {
    if (disabled) return;
    disclosure?.close();
  }, [disabled, disclosure]);

  const inert = disclosure === null;
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { disabled: disabled || inert },
      accessibilityLabel,
      testID,
      disabled: disabled || inert,
      onPress: closePopover,
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
      onPress={closePopover}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function PopoverArrow({
  testID,
  style,
  children,
  render,
}: PopoverArrowProps): React.ReactNode {
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
