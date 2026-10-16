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
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Tooltip — an unstyled hint anchored to content.
 *
 * Long-press the anchor to toggle. The tip is measured and placed
 * with `useFloatingPlacement` (anchor `measure()` + viewport +
 * `resolveFloatingRect`); until measured it stays transparent at
 * origin rather than flashing somewhere wrong. No hover model (no
 * pointer on touch devices), no scrim — dismissal is a second
 * long-press or the controlled prop. `placement` prefers a side;
 * the rect math clamps into the viewport.
 *
 * Compound form (Base UI parity) lives below in this module:
 * `TooltipRoot` (visibility state) with `TooltipTrigger`
 * (long-press toggle + anchor registration), `TooltipPortal`
 * (in-box host — a non-modal hint never takes a `Modal` host),
 * `TooltipPositioner`, `TooltipPopup`, `TooltipArrow`. Omitted
 * Base UI pieces are recorded there, not here.
 */

export type TooltipProps = {
  /** Tooltip body content (required — an empty tip is a bug). */
  content: ReactNode;
  /** Anchor content the tip describes (required). */
  children: ReactNode;
  /** Controlled visibility. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default `false`. */
  defaultOpen?: boolean;
  /** Fires on every visibility change. */
  onOpenChange?: (open: boolean) => void;
  /** Preferred side. Default `"top"`. Clamped into the viewport. */
  placement?: Placement;
  /** Accessible name source for the tip. */
  accessibilityLabel?: string;
  testID?: string;
  /** Anchor wrapper style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Tip container style, caller-provided. */
  tipStyle?: StyleProp<ViewStyle>;
  /** Forwarded to the anchor wrapper host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

function assignRef(
  ref: TooltipProps["ref"],
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

export function Tooltip({
  content,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  placement,
  accessibilityLabel,
  testID,
  style,
  tipStyle,
  ref,
}: TooltipProps): React.JSX.Element {
  const [visible, setVisible] = useControllableState<boolean>(
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
    active: visible ?? false,
  });

  const toggle = useCallback(() => {
    setVisible((previous) => !(previous ?? false));
  }, [setVisible]);

  return (
    <View ref={setAnchorRef} style={style} testID={testID}>
      <Pressable onLongPress={toggle}>{children}</Pressable>
      {visible ? (
        <View
          // Explicit like the anchor rule for progressbar/image: a tip
          // whose role never reaches assistive tech is broken.
          accessible
          accessibilityRole="tooltip"
          accessibilityLabel={accessibilityLabel}
          onLayout={floating.onContentLayout}
          style={[floating.style, tipStyle]}
        >
          {content}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* `<Tooltip>` above is the concise inline API (anchor + long-press     */
/* toggle + measured tip). The parts below mirror Base UI's Tooltip     */
/* anatomy — Root (state owner, renders no element), Trigger            */
/* (long-press toggle + anchor registration), Portal (in-box host),     */
/* Positioner (measured placement against the trigger anchor), Popup    */
/* (the tip), Arrow (caller-positioned marker) — with `render`          */
/* element/function composition and value-or-function `style` on       */
/* every part. Omitted Base UI pieces are documented deviations, not   */
/* oversights: no `Provider` (show/hide delays coordinate hover,       */
/* which has no touch equivalent — D8), no `Modal` portal host (a       */
/* non-modal hint must never trap touches; the tip paints in-box       */
/* like the monolith), no hover or keyboard traversal (D8), no          */
/* animation states (D9), and no `data-*` attributes (D1). Dismissal    */
/* is a second long-press or the controlled prop — there is no scrim,   */
/* so there is no Backdrop part.                                        */
/* ------------------------------------------------------------------ */

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
};

/**
 * Shared visibility state for the tip's parts. Internal to this
 * module (not exported): parts must render inside a `TooltipRoot`
 * to participate; outside one the trigger renders inert and the
 * portal never mounts.
 */
const TooltipRootContext = createContext<TooltipRootDisclosure | null>(null);

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

  const toggle = useCallback(() => {
    if (disabled) return;
    setVisible((previous) => !(previous ?? false));
  }, [disabled, setVisible]);

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  // Terminal: a disabled root reads hidden under any open state.
  const effectiveOpen = disabled ? false : (visible ?? false);

  const disclosure = useMemo<TooltipRootDisclosure>(
    () => ({
      open: effectiveOpen,
      toggle,
      groupDisabled: disabled,
      anchorHostRef,
      setAnchorRef,
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
  if (!root) return null;
  if (!root.open) return null;

  // In-box host, never a `Modal`: a non-modal hint must not trap
  // touches (documented above). The part exists so callers compose
  // the Base UI shape and gain the escape hatch if a modal tip is
  // ever proven necessary.
  return <View testID={testID}>{children}</View>;
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
  const state: TooltipPositionerState = { open: root.open };

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

  const setTipRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignTipRef(ref, node);
    },
    [ref],
  );

  if (!root) return null;
  if (!root.open) return null;
  const state: TooltipPopupState = { open: root.open };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "tooltip",
      accessibilityLabel,
      testID,
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
