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
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { Portal } from "./Portal";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * ContextMenu — long-press popup menu compound family (Base UI parity).
 *
 * Anatomy:
 * - ContextMenuRoot: owns open state and anchor placement context
 * - ContextMenuTrigger: long-press trigger wrapping caller anchor content
 * - ContextMenuPortal: presents floating tree at the app's PortalHost
 * - ContextMenuBackdrop: dismiss scrim (press closes menu)
 * - ContextMenuPositioner: measured floating container placed relative to anchor
 * - ContextMenuPopup: menu container carrying role="menu"
 * - ContextMenuItem: pressable action with role="menuitem"
 * - ContextMenuSeparator: horizontal visual divider
 * - ContextMenuGroup / ContextMenuGroupLabel: logical item grouping
 * - ContextMenuArrow: optional floating pointer indicator
 *
 * ADR-112 aria-only: emits role and aria-* only; zero legacy accessibility* props.
 */

export type ContextMenuRootState = {
  /** Whether the menu is currently open. */
  open: boolean;
};

export type ContextMenuContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  dismiss: () => void;
  anchorHostRef: React.RefObject<ElementRef<typeof View> | null>;
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
};

const ContextMenuRootContext = createContext<ContextMenuContextValue | null>(
  null,
);

export function useContextMenuContext(): ContextMenuContextValue | null {
  return useContext(ContextMenuRootContext);
}

export type ContextMenuRootProps = {
  /** Controlled visibility. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default `false`. */
  defaultOpen?: boolean;
  /** Fires on every visibility change. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /** Children compound parts. */
  children?: ReactNode;
};

export function ContextMenuRoot({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
}: ContextMenuRootProps): React.JSX.Element {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);

  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false);
  }, [onDismiss, setOpen]);

  const toggle = useCallback(() => {
    setOpen((previous) => !(previous ?? false));
  }, [setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const value = useMemo<ContextMenuContextValue>(
    () => ({
      open: isOpen ?? false,
      toggle,
      close,
      dismiss,
      anchorHostRef,
      setAnchorRef,
    }),
    [isOpen, toggle, close, dismiss, setAnchorRef],
  );

  return (
    <ContextMenuRootContext.Provider value={value}>
      {children}
    </ContextMenuRootContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* ContextMenuTrigger                                                 */
/* ------------------------------------------------------------------ */

export type ContextMenuTriggerState = {
  open: boolean;
  disabled: boolean;
};

export type ContextMenuTriggerProps = {
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  style?: StateStyle<ContextMenuTriggerState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<ContextMenuTriggerState, SlotProps>;
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

export function ContextMenuTrigger({
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: ContextMenuTriggerProps): React.ReactNode {
  const ctx = useContext(ContextMenuRootContext);
  const open = ctx?.open ?? false;
  const state: ContextMenuTriggerState = { open, disabled };

  const handleLongPress = useCallback(() => {
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
      onLongPress: handleLongPress,
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
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
      onLongPress={handleLongPress}
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
/* ContextMenuPortal                                                  */
/* ------------------------------------------------------------------ */

export type ContextMenuPortalProps = {
  children?: ReactNode;
  testID?: string;
};

export function ContextMenuPortal({
  children,
  testID,
}: ContextMenuPortalProps): React.JSX.Element | null {
  const ctx = useContext(ContextMenuRootContext);
  if (!ctx?.open) return null;

  return (
    <Portal>
      <ContextMenuRootContext.Provider value={ctx}>
        <View testID={testID}>{children}</View>
      </ContextMenuRootContext.Provider>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* ContextMenuBackdrop                                                */
/* ------------------------------------------------------------------ */

export type ContextMenuBackdropState = {
  open: boolean;
};

export type ContextMenuBackdropProps = {
  testID?: string;
  style?: StateStyle<ContextMenuBackdropState, StyleProp<ViewStyle>>;
  render?: RenderProp<ContextMenuBackdropState, SlotProps>;
};

const SCRIM_STYLE: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function ContextMenuBackdrop({
  testID,
  style,
  render,
}: ContextMenuBackdropProps): React.ReactNode {
  const ctx = useContext(ContextMenuRootContext);
  if (!ctx?.open) return null;
  const state: ContextMenuBackdropState = { open: ctx.open };

  const substituted = resolveRender(
    render,
    {
      testID,
      role: "button",
      "aria-label": "Dismiss menu",
      onPress: ctx.dismiss,
      style: [SCRIM_STYLE, resolveStyle(style, state)],
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      testID={testID}
      role="button"
      aria-label="Dismiss menu"
      onPress={ctx.dismiss}
      style={[SCRIM_STYLE, resolveStyle(style, state)]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* ContextMenuPositioner                                              */
/* ------------------------------------------------------------------ */

export type ContextMenuPositionerState = {
  open: boolean;
  side: "top" | "bottom" | "left" | "right";
};

export type ContextMenuPositionerProps = {
  side?: "top" | "bottom" | "left" | "right";
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
  placement?: Placement;
  testID?: string;
  style?: StateStyle<ContextMenuPositionerState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<ContextMenuPositionerState, SlotProps>;
};

export function ContextMenuPositioner({
  side,
  align,
  sideOffset,
  alignOffset,
  placement,
  testID,
  style,
  children,
  render,
}: ContextMenuPositionerProps): React.ReactNode {
  const ctx = useContext(ContextMenuRootContext);
  const floating = useFloatingPlacement({
    anchorRef: ctx?.anchorHostRef ?? { current: null },
    placement: side ?? placement ?? "bottom",
    offset: sideOffset,
    align,
    alignOffset,
    active: ctx?.open ?? false,
  });

  if (!ctx?.open) return null;
  const state: ContextMenuPositionerState = {
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
/* ContextMenuPopup                                                   */
/* ------------------------------------------------------------------ */

export type ContextMenuPopupState = {
  open: boolean;
};

export type ContextMenuPopupProps = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  style?: StateStyle<ContextMenuPopupState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<ContextMenuPopupState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
};

export function ContextMenuPopup({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: ContextMenuPopupProps): React.ReactNode {
  const ctx = useContext(ContextMenuRootContext);
  if (!ctx?.open) return null;
  const state: ContextMenuPopupState = { open: ctx.open };

  const substituted = resolveRender(
    render,
    {
      ref,
      accessible: true,
      role: "menu",
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
      role="menu"
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
/* ContextMenuItem                                                    */
/* ------------------------------------------------------------------ */

export type ContextMenuItemState = {
  disabled: boolean;
};

export type ContextMenuItemProps = {
  disabled?: boolean;
  onSelect?: () => void;
  onPress?: () => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  style?: StateStyle<ContextMenuItemState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<ContextMenuItemState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
};

export function ContextMenuItem({
  disabled = false,
  onSelect,
  onPress,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: ContextMenuItemProps): React.ReactNode {
  const ctx = useContext(ContextMenuRootContext);
  const state: ContextMenuItemState = { disabled };

  const handlePress = useCallback(() => {
    if (disabled) return;
    onSelect?.();
    onPress?.();
    ctx?.close();
  }, [disabled, onSelect, onPress, ctx]);

  const substituted = resolveRender(
    render,
    {
      ref,
      role: "menuitem",
      "aria-disabled": disabled || undefined,
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
      testID,
      disabled,
      onPress: handlePress,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={ref}
      role="menuitem"
      aria-disabled={disabled || undefined}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      disabled={disabled}
      onPress={handlePress}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* ContextMenuSeparator                                               */
/* ------------------------------------------------------------------ */

export type ContextMenuSeparatorProps = {
  testID?: string;
  style?: StyleProp<ViewStyle>;
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function ContextMenuSeparator({
  testID,
  style,
  render,
}: ContextMenuSeparatorProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      role: "separator",
      "aria-orientation": "horizontal",
      testID,
      style,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <View
      role="separator"
      aria-orientation="horizontal"
      testID={testID}
      style={style}
    />
  );
}

/* ------------------------------------------------------------------ */
/* ContextMenuGroup / ContextMenuGroupLabel                            */
/* ------------------------------------------------------------------ */

export type ContextMenuGroupProps = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function ContextMenuGroup({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
}: ContextMenuGroupProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      role: "group",
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
      testID,
      style,
      children,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <View
      role="group"
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      style={style}
    >
      {children}
    </View>
  );
}

export type ContextMenuGroupLabelProps = {
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function ContextMenuGroupLabel({
  testID,
  style,
  children,
  render,
}: ContextMenuGroupLabelProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      role: "presentation",
      testID,
      style,
      children,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <View role="presentation" testID={testID} style={style}>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* ContextMenuArrow                                                   */
/* ------------------------------------------------------------------ */

export type ContextMenuArrowProps = {
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function ContextMenuArrow({
  testID,
  style,
  children,
  render,
}: ContextMenuArrowProps): React.ReactNode {
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
