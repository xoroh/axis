/**
 * The toast queue — ordered open-toast identity with subscribe/notify.
 *
 * ## Why this is a primitive, and what it does NOT own
 *
 * A single-shot `ToastRoot` (open/duration/action) covers one notification;
 * an app needs a QUEUE: several toasts alive at once, added from
 * anywhere, dismissed individually or all at once, painted in mount
 * order. The QUEUE is shared and belongs here: which toast ids are
 * open, in what order, and the rule that dismissing removes exactly
 * one registration. The PAYLOAD is not — message content, action
 * labels, and durations are caller data held by the rendered
 * `ToastProvider` (components zone), which owns this queue and maps
 * each id to its content. So this returns mount state, and the
 * renderer paints it.
 *
 * The `version` counter exists for `useSyncExternalStore`: the
 * snapshot must be a stable primitive, so subscribers read the
 * counter (bumped on every mutation) rather than a fresh array.
 */

export type ToastQueue = {
  subscribe(listener: () => void): () => void;
  /** Queue a toast id. Re-adding an open id is a no-op — it keeps its original order. */
  add(id: string): void;
  /** Dismiss `id`. Unknown ids are a no-op, never an error. */
  dismiss(id: string): void;
  /** Dismiss every queued toast. */
  clear(): void;
  /** Open ids, oldest-first. */
  order(): readonly string[];
  /** Whether `id` is currently queued. */
  isOpen(id: string): boolean;
  /** Queued toast count. */
  count(): number;
  /** Mutation counter for store snapshots. */
  version(): number;
};

/** Create an empty toast queue. Pure — no DOM, no RN. */
export function createToastQueue(): ToastQueue {
  const queued = new Map<string, number>();
  let sequence = 0;
  let version = 0;
  const listeners = new Set<() => void>();
  const emit = () => {
    version += 1;
    for (const l of listeners) l();
  };
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    add(id: string) {
      if (queued.has(id)) return;
      queued.set(id, sequence++);
      emit();
    },
    dismiss(id: string) {
      if (!queued.has(id)) return;
      queued.delete(id);
      emit();
    },
    clear() {
      if (queued.size === 0) return;
      queued.clear();
      emit();
    },
    order() {
      return [...queued.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(([id]) => id);
    },
    isOpen: (id: string) => queued.has(id),
    count: () => queued.size,
    version: () => version,
  };
}
