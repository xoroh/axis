import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wave 1 of the P2c-3 extraction (`docs/conventions/primitives.md` §3): one
 * owner for behaviour that exists in BOTH renderers today with independent
 * implementations, so a fix to one cannot silently fail to reach the other.
 *
 * Overlay modality is the "is this overlay the active one" fact: everything
 * behind an open sheet/dialog/menu must become inert, and only the topmost
 * overlay may respond. Each renderer has to implement it — DOM via `inert` and
 * the `aria-hidden`/focus-trap dance, RN via `AccessibilityInfo` and
 * `pointerEvents` — and the LOGIC of which overlay is on top, and what becomes
 * inert when it opens and closes, is identical.
 *
 * What stays in each renderer is the ACT of applying inertness (it needs the
 * platform), which is exactly the split the spec asks for: the decision is
 * shared, the surface is not.
 */

/** An overlay's identity within the stack. Any stable key will do. */
export type OverlayId = string;

export type OverlayModalityState = {
  /** The topmost registered overlay, or `null` when the stack is empty. */
  readonly top: OverlayId | null;
  /** Every registered overlay, bottom-first. */
  readonly stack: readonly OverlayId[];
  /** The topmost registered MODAL overlay, or `null` when none is open. */
  readonly modalTop: OverlayId | null;
  /** True when at least one modal overlay is registered (i.e. open). */
  readonly isModalActive: boolean;
  /** True when `id` is the topmost overlay — i.e. it is the interactive one. */
  isTop(id: OverlayId): boolean;
  /**
   * True when content OUTSIDE `id` must be inert. False for the top overlay and
   * false for an empty stack, so a consumer can wire this straight to `inert`
   * without a special case for "nothing is open".
   */
  isInertOutside(id: OverlayId): boolean;
};

/**
 * Registry of open overlays, in one place, shared by every renderer.
 *
 * Registration is a stack rather than a counter because the topmost overlay is
 * the only interactive one, and a counter cannot express that. Registering the
 * same id twice is a no-op rather than a second stack entry: a re-render that
 * re-registers must not make one overlay look two-deep.
 *
 * Modality travels with the registration (`{ modal: true }` for modal
 * surfaces): the Android app-root hook (`useModalActive`) needs to know
 * whether ANY modal is open, and the registry is the one owner that sees
 * every overlay. Non-modal overlays (popovers, tooltips, non-modal drawers)
 * register without it and never count as modal.
 */
export function createOverlayModality(): {
  register(id: OverlayId, options?: { modal?: boolean }): () => void;
  subscribe(listener: () => void): () => void;
  getState(): OverlayModalityState;
} {
  const stack: OverlayId[] = [];
  const modalById = new Map<OverlayId, boolean>();
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const l of listeners) l();
  };

  return {
    register(id: OverlayId, options?: { modal?: boolean }) {
      if (!stack.includes(id)) {
        stack.push(id);
        modalById.set(id, options?.modal ?? false);
        emit();
      }
      let released = false;
      return () => {
        // Guard the release: an overlay that unmounts twice, or whose cleanup
        // runs after a re-register, must not remove a LATER overlay that
        // happens to sit at the same index.
        if (released) return;
        released = true;
        const i = stack.indexOf(id);
        if (i !== -1) {
          stack.splice(i, 1);
          modalById.delete(id);
          emit();
        }
      };
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getState(): OverlayModalityState {
      const snapshot = stack.slice();
      const modalTop =
        [...snapshot].reverse().find((id) => modalById.get(id) === true) ??
        null;
      return {
        top: snapshot.length ? snapshot[snapshot.length - 1] : null,
        stack: snapshot,
        modalTop,
        isModalActive: modalTop !== null,
        isTop: (id) => snapshot[snapshot.length - 1] === id,
        isInertOutside: (id) =>
          snapshot.length > 0 && snapshot[snapshot.length - 1] !== id,
      };
    },
  };
}

/**
 * Register an overlay for as long as this component is mounted.
 *
 * `active: false` unregisters without unmounting, which is what a sheet that is
 * mounted-but-closed needs — an overlay that is present in the tree but not
 * open must not make content outside it inert. `modal` marks modal surfaces
 * so the shared registry can answer "is any modal open" (the Android
 * app-root hook); non-modal overlays register without it.
 */
export function useOverlayRegistration(
  registry: ReturnType<typeof createOverlayModality>,
  id: OverlayId,
  active = true,
  modal = false,
): void {
  // The registry and id are read through refs so that passing an inline id
  // object, or swapping registries, does not tear down and re-register — which
  // would emit twice and briefly mark content as not-inert.
  const latest = useRef({ registry, id, active, modal });
  latest.current = { registry, id, active, modal };

  // biome-ignore lint/correctness/useExhaustiveDependencies: reads through `latest` on purpose -- adding it would re-run every render, the exact tear-down the ref prevents
  useEffect(() => {
    if (!latest.current.active) return;
    return latest.current.registry.register(latest.current.id, {
      modal: latest.current.modal,
    });
  }, [registry, id, active, modal]);
}

/** Subscribe to the overlay stack. Returns the current state, re-rendering on change. */
export function useOverlayModality(
  registry: ReturnType<typeof createOverlayModality>,
): OverlayModalityState {
  const [state, setState] = useState<OverlayModalityState>(() =>
    registry.getState(),
  );

  const read = useCallback(() => setState(registry.getState()), [registry]);

  useEffect(() => {
    // Re-read on subscribe: an overlay may have registered between the initial
    // state read and this effect running.
    read();
    return registry.subscribe(read);
  }, [registry, read]);

  return state;
}

export type OverlayModalityRegistry = ReturnType<typeof createOverlayModality>;

let sharedOverlayModality: OverlayModalityRegistry | null = null;

/**
 * Shared overlay modality registry for global stacking, top-detection,
 * and dismissal order across the application.
 */
export function getSharedOverlayModality(): OverlayModalityRegistry {
  if (!sharedOverlayModality) {
    sharedOverlayModality = createOverlayModality();
  }
  return sharedOverlayModality;
}
