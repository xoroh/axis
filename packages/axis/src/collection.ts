/**
 * The collection model — ordered item identity for filtering and lookup.
 *
 * ## Why this is a primitive
 *
 * Combobox filtering, menu filtering, and select value-label lookup
 * all reduce to the same two questions: which registered items match
 * a query, and what text belongs to a key. Three independent
 * implementations drift on exactly the edge users feel — whether
 * `"mango"` matches `" Mango"` — so the same query filters
 * differently per component.
 *
 * ## What is genuinely shared, and what is not
 *
 * The REGISTRY and the MATCH are shared: keyed item identity in
 * registration order, the default case-insensitive substring match,
 * and the filter/lookup helpers every consumer reads. The PARTS are
 * not — which components register (select items publish labels,
 * menu items publish filter text, combobox options are data and
 * never register) is per-family composition. Keyboard traversal
 * over the registry (active index, typeahead focus) is NOT here:
 * the contract's conditional-keyboard rule admits it only where a
 * section adopts it, and no section does yet.
 */

import { useCallback, useMemo, useState } from "react";

/** One registered item: stable identity plus its matchable text. */
export type CollectionItem = {
  /** Stable identity, unique within its registry. */
  key: string;
  /** Matchable text (label, filter text, option text). */
  text: string;
};

/** Whether `text` matches `query`. The default is substring; callers pass ranking. */
export type CollectionMatch = (query: string, text: string) => boolean;

/**
 * The shared default match: trimmed, case-insensitive substring. An
 * empty query matches everything (an unfiltered list shows all
 * items, never none).
 */
export function defaultCollectionMatch(query: string, text: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return text.toLowerCase().includes(needle);
}

/**
 * Keys of `items` matching `query`, in registration order. Pure —
 * data-driven consumers (combobox options) filter without
 * registering anything.
 */
export function filterCollectionKeys(
  items: readonly CollectionItem[],
  query: string,
  match: CollectionMatch = defaultCollectionMatch,
): string[] {
  return items.filter((item) => match(query, item.text)).map((item) => item.key);
}

/** The registered text for `key`, or `undefined` when unregistered. */
export function findCollectionText(
  items: readonly CollectionItem[],
  key: string,
): string | undefined {
  return items.find((item) => item.key === key)?.text;
}

/**
 * The item registry for children-driven consumers (select items
 * publish labels, menu items publish filter text). Re-registering a
 * key replaces its text in place (a label edit never reorders the
 * list); unregistering drops it. Registration order is the list
 * order — filtering never re-sorts.
 */
export function useCollectionRegistry(): {
  items: readonly CollectionItem[];
  register: (item: CollectionItem) => void;
  unregister: (key: string) => void;
} {
  const [items, setItems] = useState<readonly CollectionItem[]>([]);

  const register = useCallback((item: CollectionItem) => {
    setItems((previous) => {
      const at = previous.findIndex((entry) => entry.key === item.key);
      if (at === -1) return [...previous, item];
      if (previous[at]?.text === item.text) return previous;
      const next = [...previous];
      next[at] = item;
      return next;
    });
  }, []);

  const unregister = useCallback((key: string) => {
    setItems((previous) =>
      previous.some((entry) => entry.key === key)
        ? previous.filter((entry) => entry.key !== key)
        : previous,
    );
  }, []);

  // Memoized: consumers hang this object in context values and effect
  // deps, where a fresh identity every render would rebuild the
  // context, re-run every registration effect (unregister +
  // re-register always allocate), change `items` again, and loop
  // forever through passive effects.
  return useMemo(
    () => ({ items, register, unregister }),
    [items, register, unregister],
  );
}
