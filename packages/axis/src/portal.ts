/**
 * The owned Portal registry — kern's own overlay host, alongside Base UI.
 *
 * ## Why this is a primitive, and why it does NOT replace Base UI on web
 *
 * Every overlay renders its surface somewhere other than its trigger's DOM
 * parent: that "somewhere else" needs an owner (ordering, mount/unmount,
 * cleanup on unmount). Today the web renderer borrows that owner from Base UI's
 * `Portal` and native borrows it from `Modal`. D12 rules the extraction as
 * DUAL-PATH: kern gains its OWN portal registry that both renderers can host
 * through, while web KEEPS its Base UI usage. Removing the borrowed owner
 * before the owned one is proven would strand every overlay on a host nobody
 * exercises; adding alongside lets the owned path prove itself per surface.
 *
 * ## What is genuinely shared, and what is not
 *
 * The REGISTRY is shared: which overlay ids are mounted, in what order, and
 * the rule that unmounting removes exactly one registration. The HOST is not —
 * a DOM container element and an RN `Modal` stack are platform code. So this
 * returns mount state, and each renderer paints it.
 */

export type PortalEntry = {
  /** Stable overlay identity, bottom-first in `order()`. */
  id: string;
  /** Monotonic sequence so two mounts in one frame still order deterministically. */
  sequence: number;
};

export type PortalRegistry = {
  subscribe(listener: () => void): () => void;
  /** Mount `id`. Re-mounting an open id refreshes nothing — it is a no-op. */
  mount(id: string): void;
  /** Unmount `id`. Unknown ids are a no-op, never an error. */
  unmount(id: string): void;
  /** Mounted ids, bottom-first. */
  order(): readonly string[];
  isMounted(id: string): boolean;
};

/** Create an empty portal registry. Pure — no DOM, no RN. */
export function createPortalRegistry(): PortalRegistry {
  const mounted = new Map<string, number>();
  let sequence = 0;
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const l of listeners) l();
  };
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    mount(id: string) {
      if (mounted.has(id)) return;
      mounted.set(id, sequence++);
      emit();
    },
    unmount(id: string) {
      if (!mounted.has(id)) return;
      mounted.delete(id);
      emit();
    },
    order() {
      return [...mounted.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(([id]) => id);
    },
    isMounted: (id: string) => mounted.has(id),
  };
}

/**
 * Resolve where a surface renders: the caller's explicit host wins, else the
 * shared default. A description, not a container lookup — finding the DOM node
 * or RN host is the renderer's job.
 */
export function resolvePortalTarget(options: {
  ownerProvided?: string;
  defaultTarget?: string;
}): string {
  return options.ownerProvided ?? options.defaultTarget ?? "kern-portal-root";
}
