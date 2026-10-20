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
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { Portal } from "./Portal";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * PreviewCard — a rich destination preview triggered by link interaction (Base UI parity).
 *
 * Anatomy:
 * - PreviewCardRoot: owns open state and delayed hover/press timing
 * - PreviewCardTrigger: anchor trigger wrapping the link/button
 * - PreviewCardPortal: presents preview popup at the app's PortalHost
 * - PreviewCardBackdrop: optional dismiss scrim
 * - PreviewCardPositioner: measured floating container placed relative to anchor
 * - PreviewCardPopup: popup card container carrying role="region"
 * - PreviewCardArrow: optional floating pointer indicator
 *
 * ADR-112 aria-only: emits role and aria-* only; zero legacy accessibility* props.
 */

export type PreviewCardRootState = {
  /** Whether the preview card is currently open. */
  open: boolean;
};

export type PreviewCardContextValue = {
  open: boolean;
  openCard: () => void;
  closeCard: () => void;
  toggle: () => void;
  anchorHostRef: React.RefObject<ElementRef<typeof View> | null>;
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
};

const PreviewCardRootContext = createContext<PreviewCardContextValue | null>(
  null,
);

export function usePreviewCardContext(): PreviewCardContextValue | null {
  return useContext(PreviewCardRootContext);
}

export type PreviewCardRootProps = {
  /** Controlled visibility. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default false. */
  defaultOpen?: boolean;
  /** Fires on every visibility change. */
  onOpenChange?: (open: boolean) => void;
  /** Open delay in milliseconds. Default 600ms. */
  delay?: number;
  /** Close delay in milliseconds. Default 300ms. */
  closeDelay?: number;
  /** Children compound parts. */
  children?: ReactNode;
};

export function PreviewCardRoot({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  delay = 600,
  closeDelay = 300,
}: PreviewCardRootProps): React.JSX.Element {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  const openCard = useCallback(() => {
    clearTimers();
    if (delay <= 0) {
      setOpen(true);
    } else {
      openTimerRef.current = setTimeout(() => {
        setOpen(true);
      }, delay);
    }
  }, [clearTimers, delay, setOpen]);

  const closeCard = useCallback(() => {
    clearTimers();
    if (closeDelay <= 0) {
      setOpen(false);
    } else {
      closeTimerRef.current = setTimeout(() => {
        setOpen(false);
      }, closeDelay);
    }
  }, [clearTimers, closeDelay, setOpen]);

  const toggle = useCallback(() => {
    clearTimers();
    setOpen((previous) => !(previous ?? false));
  }, [clearTimers, setOpen]);

  const value = useMemo<PreviewCardContextValue>(
    () => ({
      open: isOpen ?? false,
      openCard,
      closeCard,
      toggle,
      anchorHostRef,
      setAnchorRef,
    }),
    [isOpen, openCard, closeCard, toggle, setAnchorRef],
  );

  return (
    <PreviewCardRootContext.Provider value={value}>
      {children}
    </PreviewCardRootContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* PreviewCardTrigger                                                 */
/* ------------------------------------------------------------------ */

export type PreviewCardTriggerState = {
  open: boolean;
  disabled: boolean;
};

export type PreviewCardTriggerProps = {
  disabled?: boolean;
  href?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  style?: StateStyle<PreviewCardTriggerState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<PreviewCardTriggerState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // Frozen ref object cannot take write
    }
  }
}

export function PreviewCardTrigger({
  disabled = false,
  href,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: PreviewCardTriggerProps): React.ReactNode {
  const ctx = useContext(PreviewCardRootContext);
  const open = ctx?.open ?? false;
  const state: PreviewCardTriggerState = { open, disabled };

  const handlePress = useCallback(() => {
    if (disabled) return;
    ctx?.toggle();
  }, [disabled, ctx]);

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      ctx?.setAnchorRef(node);
      assignRef(ref, node);
    },
    [ctx, ref],
  );

  const substituted = resolveRender(
    render,
    {
      ref: setHostRef,
      testID,
      disabled,
      onPress: handlePress,
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
      ...(href !== undefined ? { href } : {}),
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setHostRef}
      testID={testID}
      disabled={disabled}
      onPress={handlePress}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* PreviewCardPortal                                                  */
/* ------------------------------------------------------------------ */

export type PreviewCardPortalProps = {
  children?: ReactNode;
  testID?: string;
};

export function PreviewCardPortal({
  children,
  testID,
}: PreviewCardPortalProps): React.JSX.Element | null {
  const ctx = useContext(PreviewCardRootContext);
  if (!ctx?.open) return null;

  return (
    <Portal>
      <PreviewCardRootContext.Provider value={ctx}>
        <View testID={testID}>{children}</View>
      </PreviewCardRootContext.Provider>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* PreviewCardBackdrop                                                */
/* ------------------------------------------------------------------ */

export type PreviewCardBackdropState = {
  open: boolean;
};

export type PreviewCardBackdropProps = {
  testID?: string;
  style?: StateStyle<PreviewCardBackdropState, StyleProp<ViewStyle>>;
  render?: RenderProp<PreviewCardBackdropState, SlotProps>;
};

const SCRIM_STYLE: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function PreviewCardBackdrop({
  testID,
  style,
  render,
}: PreviewCardBackdropProps): React.ReactNode {
  const ctx = useContext(PreviewCardRootContext);
  if (!ctx?.open) return null;
  const state: PreviewCardBackdropState = { open: ctx.open };

  const substituted = resolveRender(
    render,
    {
      testID,
      role: "button",
      "aria-label": "Dismiss preview",
      onPress: ctx.closeCard,
      style: [SCRIM_STYLE, resolveStyle(style, state)],
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      testID={testID}
      role="button"
      aria-label="Dismiss preview"
      onPress={ctx.closeCard}
      style={[SCRIM_STYLE, resolveStyle(style, state)]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* PreviewCardPositioner                                              */
/* ------------------------------------------------------------------ */

export type PreviewCardPositionerState = {
  open: boolean;
  side: "top" | "bottom" | "left" | "right";
};

export type PreviewCardPositionerProps = {
  side?: "top" | "bottom" | "left" | "right";
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
  placement?: Placement;
  testID?: string;
  style?: StateStyle<PreviewCardPositionerState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<PreviewCardPositionerState, SlotProps>;
};

export function PreviewCardPositioner({
  side,
  align,
  sideOffset,
  alignOffset,
  placement,
  testID,
  style,
  children,
  render,
}: PreviewCardPositionerProps): React.ReactNode {
  const ctx = useContext(PreviewCardRootContext);
  const floating = useFloatingPlacement({
    anchorRef: ctx?.anchorHostRef ?? { current: null },
    placement: side ?? placement ?? "bottom",
    offset: sideOffset,
    align,
    alignOffset,
    active: ctx?.open ?? false,
  });

  if (!ctx?.open) return null;
  const state: PreviewCardPositionerState = {
    open: ctx.open,
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

/* ------------------------------------------------------------------ */
/* PreviewCardPopup                                                   */
/* ------------------------------------------------------------------ */

export type PreviewCardPopupState = {
  open: boolean;
};

export type PreviewCardPopupProps = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  style?: StateStyle<PreviewCardPopupState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<PreviewCardPopupState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
};

export function PreviewCardPopup({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: PreviewCardPopupProps): React.ReactNode {
  const ctx = useContext(PreviewCardRootContext);
  if (!ctx?.open) return null;
  const state: PreviewCardPopupState = { open: ctx.open };

  const substituted = resolveRender(
    render,
    {
      ref,
      accessible: true,
      role: "region",
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
      testID,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={ref}
      accessible
      role="region"
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* PreviewCardArrow                                                   */
/* ------------------------------------------------------------------ */

export type PreviewCardArrowProps = {
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function PreviewCardArrow({
  testID,
  style,
  children,
  render,
}: PreviewCardArrowProps): React.ReactNode {
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
