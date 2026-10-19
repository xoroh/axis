import { useEffect, useRef } from "react";
import { AccessibilityInfo, findNodeHandle } from "react-native";

/**
 * Shared screen-reader focus wiring for overlay surfaces (internal —
 * not barrel-exported: it is RN-specific measurement plumbing like
 * `useFloatingPlacement`, not a public behavior model).
 *
 * `OverlayRoot` owns this for modal surfaces (move into the surface
 * on open, restore to the trigger on close). Non-modal surfaces
 * (Popover, Tooltip) borrow the same pair through
 * `useAccessibilityFocusRestore` below — announce + restore, never
 * containment (parity D5: no traversal trap on native).
 *
 * Timing rule (upstream rn-primitives finding at the pinned SHA):
 * synchronous `setAccessibilityFocus` on a freshly-mounted node is
 * unreliable on both platforms, so the SR-tree focus is deferred
 * ~50 ms while the duck-typed imperative `focus()` on a host that
 * exposes one stays synchronous (a mounted host is safe to call).
 * Every deferred call returns its cancel so effects clean up.
 */

/** Move screen-reader focus to `target`. Returns a cancel for the deferred SR-tree focus. */
export function focusAccessibilityNode(target: unknown): () => void {
  if (!target) return () => {};
  const maybeFocusable = target as { focus?: () => void };
  if (typeof maybeFocusable.focus === "function") maybeFocusable.focus();
  const tag = findNodeHandle(target as never);
  if (!tag) return () => {};
  const timer = setTimeout(() => {
    AccessibilityInfo.setAccessibilityFocus(tag);
  }, 50);
  return () => {
    clearTimeout(timer);
  };
}

export function useAccessibilityFocusRestore(options: {
  /** Whether the surface is currently open. */
  open: boolean;
  /** Silent surfaces (e.g. an unlabelled tip) opt out both ways. Default `true`. */
  enabled?: boolean;
  /** Node receiving SR focus on open. */
  targetRef: { readonly current: unknown };
  /** Node receiving SR focus back on close. */
  restoreRef: { readonly current: unknown };
}): void {
  const { open, enabled = true, targetRef, restoreRef } = options;
  // Starts closed: a surface that mounts already-open still announces —
  // the mount commit is the transition the listener missed.
  const wasOpenRef = useRef(false);
  const movedRef = useRef(false);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (open && !wasOpen) {
      if (!enabled) return undefined;
      // The node ref attaches during this same commit (children commit
      // before parent effects), so the target is present to focus.
      movedRef.current = true;
      return focusAccessibilityNode(targetRef.current);
    }
    if (!open && wasOpen) {
      if (!movedRef.current) return undefined;
      movedRef.current = false;
      if (!enabled) return undefined;
      return focusAccessibilityNode(restoreRef.current);
    }
    return undefined;
  }, [open, enabled, targetRef, restoreRef]);
}
