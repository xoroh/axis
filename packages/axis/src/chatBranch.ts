/**
 * The branch model — the edit-and-retry pager over answer variants.
 *
 * ## Why this is a primitive
 *
 * Regenerating or editing resubmits a turn and leaves several answers
 * where one was; the pager (`< 1/2 >`) on both renderers walks the
 * same index over the same count. If the web side wraps around while
 * native clamps, the same Next press lands on different answers per
 * renderer — pager motion is behavior, and behavior belongs here once.
 *
 * ## What is genuinely shared, and what is not
 *
 * The INDEX is shared: normalise, step, stop-at-the-ends, and the
 * hide-when-single rule, following the `selection`-model precedent
 * (pure transitions plus a controlled/uncontrolled hook). The TREE is
 * not — persisted message trees stay transport-owned; this models the
 * local pager over `count` variants, the cheap v1 the research
 * recommends until a consumer proves it needs more.
 */

import { useCallback } from "react";
import { useControllableState } from "./useControllableState";

/** Clamp `index` into `0..count-1`; an empty branch has index `0`. */
export function normalizeBranchIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.floor(index), 0), count - 1);
}

/** Step forward, stopping at the last variant: Next on the last is a no-op. */
export function nextBranchIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(normalizeBranchIndex(index, count) + 1, count - 1);
}

/** Step back, stopping at the first variant: Previous on the first is a no-op. */
export function previousBranchIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(normalizeBranchIndex(index, count) - 1, 0);
}

/**
 * Whether the pager hides: a single variant has nowhere to step, and
 * callers hide it by default (opt out only for a pager that reserves
 * layout while variants load).
 */
export function shouldHideBranchPicker(
  count: number,
  hideWhenSingleBranch = true,
): boolean {
  return hideWhenSingleBranch && count <= 1;
}

/**
 * The pager index, controlled or uncontrolled. `count` changes
 * normalise immediately rather than waiting for a press: a variant
 * list that shrinks below the shown index falls back to the last
 * remaining variant, so the pager never points past its own list
 * (the `useSelection` narrowing precedent).
 */
export function useBranch(options: {
  count: number;
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
}): {
  index: number;
  count: number;
  previous: () => void;
  next: () => void;
  goTo: (index: number) => void;
} {
  const count = Math.max(0, Math.floor(options.count));
  const [raw, setRaw] = useControllableState<number>(
    options.value,
    options.defaultValue ?? 0,
    options.onChange,
  );
  const index = normalizeBranchIndex(raw ?? 0, count);

  const goTo = useCallback(
    (next: number) => {
      setRaw(normalizeBranchIndex(next, count));
    },
    [count, setRaw],
  );

  const next = useCallback(() => {
    setRaw((previous) => nextBranchIndex(previous ?? 0, count));
  }, [count, setRaw]);

  const previous = useCallback(() => {
    setRaw((previous) => previousBranchIndex(previous ?? 0, count));
  }, [count, setRaw]);

  return { index, count, previous, next, goTo };
}
