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
  useSyncExternalStore,
} from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { createToastQueue, type ToastQueue } from "../toastQueue";
import { useControllableState } from "../useControllableState";

/**
 * ToastRoot — a transient notification with timed auto-dismiss.
 *
 * Structure only: a `View` carrying the message content with an optional
 * `Pressable` action, announced politely to screen readers. No default
 * visuals — every visual value (`style`) is caller-provided. State
 * follows the `useControllableState` pattern: `open` (+ `onOpenChange`)
 * for controlled use, `defaultOpen` for uncontrolled. No animation;
 * presence is binary (renders `null` when closed).
 *
 * Accessibility: the root carries `accessibilityLiveRegion="polite"` so
 * the message is announced on appearance. No `accessibilityRole="alert"`:
 * the installed react-native 0.87 types do list `"alert"` in
 * `AccessibilityRole`, but the role is omitted deliberately to keep the
 * surface to the specified props — the live region alone covers the
 * announcement, and callers needing a stronger semantic can wrap the
 * message themselves.
 *
 * Refs: none. The toast exposes no host handle — parents show and hide
 * it through `open`/`defaultOpen`/`onOpenChange`, and the action button
 * is an internal `Pressable`, so there is no element for a caller to
 * drive imperatively. This omission is intentional, not a gap.
 */

export type ToastRootState = {
  /** Whether the toast is currently open. */
  open: boolean;
};

export type ToastRootProps = {
  /** Controlled visibility. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next visibility on every committed open/close. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Auto-dismiss delay in milliseconds. Default `4000`. A value of `0`
   * or less disables auto-dismiss — the toast stays open until the
   * parent closes it or the action fires.
   */
  duration?: number;
  /** Message content. */
  children?: ReactNode;
  /**
   * Action button label. The action button renders only when this is
   * provided — no label, no action button.
   */
  actionLabel?: string;
  /**
   * Fires when the action button is pressed. The toast dismisses as
   * part of the same press.
   */
  onAction?: () => void;
  /** Accessible name source for the toast surface. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root view style: value or function of toast state. */
  style?: StateStyle<ToastRootState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToastRootState, SlotProps>;
  /** Forwarded to the toast surface `View`. */
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
  ref: ToastRootProps["ref"],
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

export function ToastRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  duration = 4000,
  children,
  actionLabel,
  onAction,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: ToastRootProps): React.ReactNode {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const dismiss = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Timed auto-dismiss while open. The timer is cleared on close,
  // on `duration` change, and on unmount; `duration <= 0` arms no
  // timer at all. State updates land inside `act` under test because
  // the suite awaits them through RNTL's async queries.
  useEffect(() => {
    if (!isOpen) return undefined;
    if (duration <= 0) return undefined;
    const timer = setTimeout(dismiss, duration);
    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, duration, dismiss]);

  const handleAction = useCallback(() => {
    onAction?.();
    setOpen(false);
  }, [onAction, setOpen]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  if (!isOpen) return null;

  const state: ToastRootState = { open: true };
  const substituted = resolveRender(
    render,
    {
      accessibilityLiveRegion: "polite",
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      onDismiss: dismiss,
      onAction: actionLabel ? handleAction : undefined,
      actionLabel,
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      <Text>{children}</Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={handleAction}
        >
          <Text>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Queued toasts (Base UI Provider + Viewport parity)                   */
/*                                                                      */
/* The single-shot `ToastRoot` above covers one notification. An app        */
/* needs a queue: several toasts alive at once, added from anywhere,    */
/* dismissed individually or all at once, painted in queue order.      */
/* `ToastProvider` owns a `createToastQueue` (the shared model) plus    */
/* the caller payloads per id; `useToast` adds/dismisses/clears from    */
/* anywhere under the provider (the Base UI `toast.add()` object API);  */
/* `ToastViewport` paints one single-shot `ToastRoot` per queued id.        */
/*                                                                      */
/* Base UI mapping (documented, not silent): the provider owns the      */
/* queue; each queued `ToastRoot` IS the `Root`; `children` composes the    */
/* `Title`/`Description` text (caller `Text`); `actionLabel`/`onAction` */
/* IS the `Action`; timed auto-dismiss IS the `Close`. There is no      */
/* separate `Title`/`Description`/`Close` part: on native the message    */
/* is caller text in a live region, and dismissal is time or action.    */
/* Do not conflate with M3 Snackbar — Kern owns that separately.       */
/* ------------------------------------------------------------------ */

export type ToastOptions = {
  /** Message content rendered inside the queued toast. */
  message: ReactNode;
  /** Action button label. No label, no action button. */
  actionLabel?: string;
  /** Fires when the action button is pressed (the toast dismisses too). */
  onAction?: () => void;
  /** Accessible name source for the toast surface. */
  accessibilityLabel?: string;
  /**
   * Auto-dismiss delay in milliseconds. Default `4000`; `0` or less
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
  /** App content; toasts paint wherever `ToastViewport` sits. */
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

  // The provider owns state, never layout: no host element (Base UI parity).
  return (
    <ToastProviderContext.Provider value={value}>
      {children}
    </ToastProviderContext.Provider>
  );
}

/**
 * The `toast.add()` object API (Base UI parity): add, dismiss, and
 * clear queued toasts from anywhere under a `ToastProvider`. Throws
 * outside one — a manager with no queue would silently drop toasts.
 */
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
  /**
   * Element or function substitution (Base UI parity) for the
   * viewport container. Queued toasts travel in the props as
   * `children`.
   */
  render?: RenderProp<ToastViewportState, SlotProps>;
  /** Forwarded to the viewport container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

function assignViewportRef(
  ref: ToastViewportProps["ref"],
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

export function ToastViewport({
  testID,
  style,
  limit,
  render,
  ref,
}: ToastViewportProps): React.ReactNode {
  const provider = useContext(ToastProviderContext);
  // Outside a provider there is no queue to paint: render nothing
  // rather than an unbacked container (the `MenuItem` precedent).
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
      assignViewportRef(ref, node);
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
        actionLabel={payload.actionLabel}
        onAction={payload.onAction}
        accessibilityLabel={payload.accessibilityLabel}
        testID={testID ? `${testID}-${id}` : undefined}
      >
        {payload.message}
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
