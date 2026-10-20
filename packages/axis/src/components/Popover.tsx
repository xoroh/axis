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
import type {
  OverlayOpenChangeDetails,
  OverlayOpenChangeReason,
} from "../dismissWiring";
import type { Align, Placement } from "../positioning";
import {
  type RenderProp,
  resolveRender,
  resolveStyle,
  type StateStyle,
} from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import {
  OverlayPortal,
  OverlayRoot,
  useOverlayMaybe,
  useOverlayRefsMaybe,
} from "./Overlay";
import { Portal } from "./Portal";
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
  webTabIndexProps,
} from "./useAccessibilityFocus";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Popover — a compound anchored overlay (Base UI parity).
 *
 * `PopoverRoot` owns open state (renders no element);
 * `PopoverTrigger` toggles on tap and registers the anchor;
 * `PopoverPortal` presents at the app's portal host (overlay host
 * when modal, in-box otherwise); `PopoverBackdrop` is the scrim
 * (modal roots only); `PopoverPositioner` measures and places the
 * box; `PopoverPopup` is the content box; `PopoverTitle` /
 * `PopoverDescription` are text; `PopoverClose` closes;
 * `PopoverArrow` is a caller-positioned marker. No default visuals —
 * every visual value is caller-provided. State follows
 * `useControllableState`: `open` (+ `onOpenChange`) for controlled
 * use, `defaultOpen` for uncontrolled (default `false`).
 *
 * Deferred, each for a named reason (not oversight):
 * - No animation: the box mounts/unmounts synchronously with state
 *   (parity D9).
 * - No focus trap: containing accessibility focus needs the
 *   `focusTrap` + `overlayModality` RN adaptation (parity D5).
 *
 * Accessibility notes: the box is an accessibility element
 * (`accessible`) carrying `aria-label` — but declares no
 * role. React Native defines no popover role, and an unbacked role
 * claim is worse than honest silence (the Label precedent).
 *
 * Test ids follow Dialog: the box carries `testID`; the scrim
 * carries `<testID>-scrim`.
 */

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

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* The parts below mirror Base UI's Popover anatomy — Root (state      */
/* owner, renders no element), Trigger (tap toggle + anchor            */
/* registration), Portal (overlay host when modal, in-box otherwise),  */
/* Backdrop (the scrim, modal only), Positioner (measured placement   */
/* against the trigger anchor), Popup (the content box), Title,        */
/* Description, Close, Arrow — with `render` element/function          */
/* composition and value-or-function `style` on every part. Popovers  */
/* are non-modal overlays, so the compound defaults `modal` to `false` */
/* (the inverse of Dialog/Menu). Omitted Base UI pieces are           */
/* documented deviations, not oversights: no `data-*` attributes      */
/* (D1), no `Viewport` (caller `ScrollView` content), no focus        */
/* containment (D5), no animation states (D9), no `modal` trap-focus   */
/* distinction, and no popover role claim — RN defines none, so the   */
/* box stays a labelled region (honest silence).                       */
/* ------------------------------------------------------------------ */

export type PopoverRootState = {
  open: boolean;
};

export type PopoverRootProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed toggle or dismissal, with the reason. */
  onOpenChange?: (open: boolean, details?: OverlayOpenChangeDetails) => void;
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
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
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
  "aria-label"?: string;
  "aria-labelledby"?: string;
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
  /**
   * Explicit initial focus target (wins over the root's). Element, ref,
   * function of the open interaction, or `false` to keep focus where
   * it is. Default: first focusable element in the popup (marked,
   * stops), else Title, else the box.
   */
  initialFocus?: OverlayFocusValue;
  /**
   * Explicit restore target (wins over the anchor). See
   * `OverlayRootProps.finalFocus` for the value shape.
   */
  finalFocus?: OverlayFocusValue;
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
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Value or function of close state, caller-provided. */
  style?: StateStyle<PopoverCloseState, StyleProp<ViewStyle>>;
  /** Button content. */
  children?: ReactNode;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<PopoverCloseState, SlotProps>;
  /**
   * Mark this Close as the default initial focus target. Default `false`.
   */
  initialFocus?: boolean;
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
  /** Dismiss with a reason (default `"outside-press"`). */
  dismiss: (reason?: OverlayOpenChangeReason) => void;
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
  initialFocus,
  finalFocus,
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
    setOpen((previous) => !(previous ?? false), {
      reason: "trigger-press",
    });
  }, [setOpen]);

  const close = useCallback(() => {
    setOpen(false, { reason: "close-press" });
  }, [setOpen]);

  // Backdrop path: `onDismiss` first, then report `false`.
  // Guarded on `disablePointerDismissal`.
  const dismiss = useCallback(
    (reason: OverlayOpenChangeReason = "outside-press") => {
      if (disablePointerDismissal) return;
      onDismiss?.();
      setOpen(false, { reason });
    },
    [disablePointerDismissal, onDismiss, setOpen],
  );

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
      initialFocus={initialFocus}
      finalFocus={finalFocus}
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
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
}: PopoverTriggerProps): React.ReactNode {
  const disclosure = useContext(PopoverDisclosureContext);
  const open = disclosure?.open ?? false;
  const state: PopoverTriggerState = { open, disabled };
  // The trigger press is the open interaction for function-form focus
  // targets. Outside a root there is no overlay — the write is a no-op.
  const overlayRefs = useOverlayRefsMaybe();

  const toggleTrigger = useCallback(() => {
    if (disabled) return;
    if (overlayRefs) overlayRefs.interaction.current = "trigger-press";
    disclosure?.toggle();
  }, [disabled, disclosure, overlayRefs]);

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
      role: "button",
      "aria-expanded": open,
      "aria-disabled": disabled || inert || undefined,
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
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
      role="button"
      aria-expanded={open}
      aria-disabled={disabled || inert || undefined}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
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
  // NOTE: no `open` gate — the portal stays mounted through the exit
  // commit so the popup's focus hook observes the close transition;
  // the parts below still paint nothing while closed.
  if (!disclosure) return null;

  // Non-modal roots (the default for popovers) present through the
  // plain `Portal` at the app's `PortalHost` — above sibling content,
  // with no scrim trap. Presses outside reach the
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
    // Reason is explicit: the backdrop press is the outside-press
    // dismiss path (never the raw press event).
    const handlePress = () => disclosure.dismiss("outside-press");
    const substituted = resolveRender(
      render,
      {
        "aria-label": "Dismiss",
        testID,
        onPress: handlePress,
        style: resolveStyle(style, state),
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        aria-label="Dismiss"
        testID={testID}
        onPress={handlePress}
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
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
  initialFocus,
  finalFocus,
}: PopoverPopupProps): React.ReactNode {
  const disclosure = useContext(PopoverDisclosureContext);
  const overlay = useOverlayMaybe();
  const overlayRefs = useOverlayRefsMaybe();
  // Hooks before guards: the focus node ref and scope must exist on
  // every render, and the move/restore wiring below no-ops while closed.
  const popupNodeRef = useRef<ElementRef<typeof View> | null>(null);
  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      popupNodeRef.current = node;
      assignPopupRef(ref, node);
    },
    [ref],
  );

  // One focus scope per popup: Title/Close parts register here so the
  // default initial target resolves without a DOM query on native.
  const focusScope = useMemo<FocusScope>(() => createFocusScope(), []);

  const open = disclosure?.open ?? false;
  // Move SR focus into the box on open, restore to the anchor on
  // close (the upstream `Content`/`Trigger` pair) — silent when the
  // box carries no label. Non-modal popovers claim nothing: neither
  // trap focus nor hide anything. Default target: first focusable
  // element (marked, stops), else Title, else the box.
  useModalFocus({
    open,
    enabled:
      (ariaLabel !== undefined || ariaLabelledBy !== undefined) &&
      disclosure !== null,
    initialFocus: initialFocus ?? overlay?.initialFocus,
    finalFocus: finalFocus ?? overlay?.finalFocus,
    scope: focusScope,
    interactionRef: overlayRefs?.interaction,
    sharedState: overlayRefs?.focus,
    popupRef: popupNodeRef,
    restoreRef: disclosure?.anchorHostRef ?? { current: null },
  });

  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: PopoverPopupState = { open: disclosure.open };

  // iOS VoiceOver scrub dismisses (the upstream `Content` precedent),
  // reported as `escape-key`. Guarded on `disablePointerDismissal`.
  const handleAccessibilityEscape = !disclosure.disablePointerDismissal
    ? () => disclosure.dismiss("escape-key")
    : undefined;

  // iOS modal claim on the popup (top layer only); non-modal popups
  // claim nothing. On web the same modality is `aria-modal` plus the
  // Tab trap below.
  const modal = disclosure.modal;
  const top = overlay?.isTop ?? true;
  const modalActive = modal && top;
  const web = isWebEnvironment();
  const handleKeyDown =
    web && modalActive
      ? (event: {
          key?: unknown;
          shiftKey?: unknown;
          preventDefault?: unknown;
        }) => trapTabKey(popupNodeRef.current, event)
      : undefined;

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
      testID,
      onAccessibilityEscape: handleAccessibilityEscape,
      accessibilityViewIsModal: modalActive,
      ...(modalActive ? { "aria-modal": true } : null),
      onKeyDown: handleKeyDown,
      ...webTabIndexProps(web),
      style: resolveStyle(style, state),
      children,
      ref: setPopupRef,
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
        {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
        {...(ariaLabelledBy !== undefined
          ? { "aria-labelledby": ariaLabelledBy }
          : {})}
        testID={testID}
        onAccessibilityEscape={handleAccessibilityEscape}
        accessibilityViewIsModal={modalActive}
        {...(modalActive ? { "aria-modal": true } : null)}
        onKeyDown={handleKeyDown}
        {...webTabIndexProps(web)}
        style={resolveStyle(style, state)}
      >
        {children}
      </View>
    </FocusScopeProvider>
  );
}

export function PopoverTitle({
  testID,
  style,
  children,
  render,
}: PopoverTitleProps): React.ReactNode {
  const scope = useFocusScopeMaybe();
  const setTitleNode = useScopeTitle(scope);
  const web = isWebEnvironment();

  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      children,
      ref: setTitleNode,
      ...webTabIndexProps(web),
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text
      ref={setTitleNode}
      role="heading"
      testID={testID}
      style={style}
      {...webTabIndexProps(web)}
    >
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
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  initialFocus = false,
}: PopoverCloseProps): React.ReactNode {
  const disclosure = useContext(PopoverDisclosureContext);
  const state: PopoverCloseState = { disabled };
  const scope = useFocusScopeMaybe();
  const setCloseNode = useScopeStop(scope, initialFocus);

  const closePopover = useCallback(() => {
    if (disabled) return;
    disclosure?.close();
  }, [disabled, disclosure]);

  const inert = disclosure === null;
  const substituted = resolveRender(
    render,
    {
      role: "button",
      "aria-disabled": disabled || inert || undefined,
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
      testID,
      disabled: disabled || inert,
      onPress: closePopover,
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
      role="button"
      aria-disabled={disabled || inert || undefined}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
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
