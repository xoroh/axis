import {
  createContext,
  type ElementRef,
  isValidElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { createToastQueue, type ToastQueue } from "../toastQueue";
import { useControllableState } from "../useControllableState";
import { Portal } from "./Portal";

/**
 * Toast — transient notification compound family (Base UI parity).
 *
 * Anatomy:
 * - ToastProvider: owns the shared toast queue and toast manager
 * - ToastViewport: landmark container painting queued toasts
 * - ToastPortal: optional portal presentation container
 * - ToastRoot: single notification surface with timed auto-dismiss
 * - ToastTitle: notification header / title text
 * - ToastDescription: notification message body text
 * - ToastAction: interactive action button (e.g. "Undo")
 * - ToastClose: dismiss button
 *
 * ADR-112 aria-only: the root carries role="status" and aria-live="polite".
 * Zero legacy accessibility* props emitted.
 */

export type ToastRootState = {
  /** Whether the toast is currently open. */
  open: boolean;
};

export type ToastRootContextValue = {
  open: boolean;
  dismiss: () => void;
};

const ToastRootContext = createContext<ToastRootContextValue | null>(null);

export function useToastRootContext(): ToastRootContextValue | null {
  return useContext(ToastRootContext);
}

export type ToastRootProps = {
  /** Controlled visibility. Wins over defaultOpen when defined. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default false. */
  defaultOpen?: boolean;
  /** Fires with the next visibility on every committed open/close. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Auto-dismiss delay in milliseconds. Default 4000. A value of 0
   * or less disables auto-dismiss.
   */
  duration?: number;
  /** Fires before closing when dismissed. */
  onDismiss?: () => void;
  /** Accessible name source for the toast surface (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Root view style: value or function of toast state. */
  style?: StateStyle<ToastRootState, StyleProp<ViewStyle>>;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<ToastRootState, SlotProps>;
  /** Forwarded to the toast surface View. */
  ref?: Ref<ElementRef<typeof View>>;
  /** Children compound parts or content. */
  children?: ReactNode;
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

export function ToastRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  duration = 4000,
  onDismiss,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  render,
  ref,
  children,
}: ToastRootProps): React.ReactNode {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false);
  }, [onDismiss, setOpen]);

  // Timed auto-dismiss: real setTimeout; 0 or less disables.
  useEffect(() => {
    if (!isOpen || duration <= 0) return;
    const timer = setTimeout(() => {
      dismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, dismiss]);

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  if (!isOpen) return null;
  const state: ToastRootState = { open: true };

  const contextValue: ToastRootContextValue = {
    open: true,
    dismiss,
  };

  const renderedChildren =
    typeof children === "string" || typeof children === "number" ? (
      <Text>{children}</Text>
    ) : (
      children
    );

  const substituted = resolveRender(
    render,
    {
      ref: setHostRef,
      accessible: true,
      role: "status",
      "aria-live": "polite",
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
      testID,
      style: resolveStyle(style, state),
      children: renderedChildren,
    } satisfies SlotProps,
    state,
  );

  if (substituted !== null) {
    return (
      <ToastRootContext.Provider value={contextValue}>
        {substituted}
      </ToastRootContext.Provider>
    );
  }

  return (
    <ToastRootContext.Provider value={contextValue}>
      <View
        ref={setHostRef}
        accessible
        role="status"
        aria-live="polite"
        {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
        {...(ariaLabelledBy !== undefined
          ? { "aria-labelledby": ariaLabelledBy }
          : {})}
        testID={testID}
        style={resolveStyle(style, state)}
      >
        {renderedChildren}
      </View>
    </ToastRootContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* ToastTitle                                                         */
/* ------------------------------------------------------------------ */

export type ToastTitleProps = {
  testID?: string;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function ToastTitle({
  testID,
  style,
  children,
  render,
}: ToastTitleProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      role: "heading",
      testID,
      style,
      children,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <Text role="heading" testID={testID} style={style}>
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* ToastDescription                                                   */
/* ------------------------------------------------------------------ */

export type ToastDescriptionProps = {
  testID?: string;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function ToastDescription({
  testID,
  style,
  children,
  render,
}: ToastDescriptionProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      children,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <Text testID={testID} style={style}>
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* ToastAction                                                        */
/* ------------------------------------------------------------------ */

export type ToastActionState = {
  disabled: boolean;
};

export type ToastActionProps = {
  disabled?: boolean;
  onPress?: () => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  style?: StateStyle<ToastActionState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<ToastActionState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
};

export function ToastAction({
  disabled = false,
  onPress,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: ToastActionProps): React.ReactNode {
  const ctx = useContext(ToastRootContext);
  const state: ToastActionState = { disabled };

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
    ctx?.dismiss();
  }, [disabled, onPress, ctx]);

  const substituted = resolveRender(
    render,
    {
      ref,
      role: "button",
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

  const renderedChildren =
    typeof children === "string" || typeof children === "number" ? (
      <Text>{children}</Text>
    ) : (
      children
    );

  return (
    <Pressable
      ref={ref}
      role="button"
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
      {renderedChildren}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* ToastClose                                                         */
/* ------------------------------------------------------------------ */

export type ToastCloseState = {
  disabled: boolean;
};

export type ToastCloseProps = {
  disabled?: boolean;
  onPress?: () => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  style?: StateStyle<ToastCloseState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<ToastCloseState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
};

export function ToastClose({
  disabled = false,
  onPress,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: ToastCloseProps): React.ReactNode {
  const ctx = useContext(ToastRootContext);
  const state: ToastCloseState = { disabled };

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
    ctx?.dismiss();
  }, [disabled, onPress, ctx]);

  const substituted = resolveRender(
    render,
    {
      ref,
      role: "button",
      "aria-label": ariaLabel ?? "Close",
      "aria-disabled": disabled || undefined,
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

  const renderedChildren =
    typeof children === "string" || typeof children === "number" ? (
      <Text>{children}</Text>
    ) : (
      children
    );

  return (
    <Pressable
      ref={ref}
      role="button"
      aria-label={ariaLabel ?? "Close"}
      aria-disabled={disabled || undefined}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      disabled={disabled}
      onPress={handlePress}
      style={resolveStyle(style, state)}
    >
      {renderedChildren}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* ToastPortal                                                        */
/* ------------------------------------------------------------------ */

export type ToastPortalProps = {
  children?: ReactNode;
  testID?: string;
};

export function ToastPortal({
  children,
  testID,
}: ToastPortalProps): React.JSX.Element {
  return (
    <Portal>
      <View testID={testID}>{children}</View>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* Queued toasts (Base UI Provider + Viewport parity)                 */
/* ------------------------------------------------------------------ */

export type ToastOptions = {
  /** Message content rendered inside the queued toast. */
  message: ReactNode;
  /** Action button label. No label, no action button. */
  actionLabel?: string;
  /** Fires when the action button is pressed (the toast dismisses too). */
  onAction?: () => void;
  /** Accessible name source for the toast surface (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /**
   * Auto-dismiss delay in milliseconds. Default 4000; 0 or less
   * disables auto-dismiss.
   */
  duration?: number;
};

export type ToastManager = {
  /** Queue a toast; returns its id for targeted dismissal. */
  add: (options: ToastOptions) => string;
  /** Dismiss one queued toast. Unknown ids are a no-op. */
  dismiss: (id: string) => void;
  /** Dismiss every queued toast. */
  clear: () => void;
};

type ToastProviderValue = {
  queue: ToastQueue;
  payloadFor: (id: string) => ToastOptions | undefined;
  manager: ToastManager;
};

const ToastProviderContext = createContext<ToastProviderValue | null>(null);

export function ToastProvider({
  children,
}: {
  /** App content; toasts paint wherever ToastViewport sits. */
  children?: ReactNode;
}): React.JSX.Element {
  const queue = useMemo(() => createToastQueue(), []);
  const payloads = useRef(new Map<string, ToastOptions>());
  const sequence = useRef(0);

  const manager = useMemo<ToastManager>(
    () => ({
      add: (options: ToastOptions) => {
        const id = `toast-${sequence.current++}`;
        payloads.current.set(id, options);
        queue.add(id);
        return id;
      },
      dismiss: (id: string) => {
        payloads.current.delete(id);
        queue.dismiss(id);
      },
      clear: () => {
        payloads.current.clear();
        queue.clear();
      },
    }),
    [queue],
  );

  const value = useMemo<ToastProviderValue>(
    () => ({
      queue,
      payloadFor: (id: string) => payloads.current.get(id),
      manager,
    }),
    [queue, manager],
  );

  return (
    <ToastProviderContext.Provider value={value}>
      {children}
    </ToastProviderContext.Provider>
  );
}

export function useToast(): ToastManager {
  const provider = useContext(ToastProviderContext);
  if (!provider) {
    throw new Error("useToast must be used under a ToastProvider.");
  }
  return provider.manager;
}

export type ToastViewportState = {
  /** Currently queued toast count. */
  count: number;
};

export type ToastViewportProps = {
  testID?: string;
  /** Viewport container style: value or function of viewport state. */
  style?: StateStyle<ToastViewportState, StyleProp<ViewStyle>>;
  /**
   * Maximum visible toasts; older toasts beyond the limit stay queued
   * but unpainted. Default: no limit.
   */
  limit?: number;
  /** Element or function substitution (Base UI parity). */
  render?: RenderProp<ToastViewportState, SlotProps>;
  /** Forwarded to the viewport container View. */
  ref?: Ref<ElementRef<typeof View>>;
};

export function ToastViewport({
  testID,
  style,
  limit,
  render,
  ref,
}: ToastViewportProps): React.ReactNode {
  const provider = useContext(ToastProviderContext);
  if (!provider) return null;

  return (
    <ToastViewportInner
      testID={testID}
      style={style}
      limit={limit}
      render={render}
      ref={ref}
      queue={provider.queue}
      payloadFor={provider.payloadFor}
      onItemOpenChange={provider.manager.dismiss}
    />
  );
}

function ToastViewportInner({
  testID,
  style,
  limit,
  render,
  ref,
  queue,
  payloadFor,
  onItemOpenChange,
}: ToastViewportProps & {
  queue: ToastQueue;
  payloadFor: (id: string) => ToastOptions | undefined;
  onItemOpenChange: (id: string) => void;
}): React.ReactNode {
  const version = useSyncExternalStore(
    queue.subscribe,
    queue.version,
    queue.version,
  );
  void version;

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const ids = queue.order();
  const visible = limit !== undefined && limit >= 0 ? ids.slice(0, limit) : ids;
  const items = visible.map((id) => {
    const payload = payloadFor(id);
    if (!payload) return null;
    return (
      <ToastRoot
        key={id}
        open
        onOpenChange={(next) => {
          if (!next) onItemOpenChange(id);
        }}
        duration={payload.duration}
        aria-label={payload["aria-label"]}
        aria-labelledby={payload["aria-labelledby"]}
        testID={testID ? `${testID}-${id}` : undefined}
      >
        {isValidElement(payload.message) ? (
          payload.message
        ) : (
          <ToastDescription>{payload.message}</ToastDescription>
        )}
        {payload.actionLabel ? (
          <ToastAction
            onPress={payload.onAction}
            aria-label={payload.actionLabel}
          >
            <Text>{payload.actionLabel}</Text>
          </ToastAction>
        ) : null}
      </ToastRoot>
    );
  });

  const state: ToastViewportState = { count: ids.length };
  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      children: items,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setHostRef} testID={testID} style={resolveStyle(style, state)}>
      {items}
    </View>
  );
}
