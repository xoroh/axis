import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * The Presence model — exit-animation suspension for unmounting surfaces.
 *
 * ## Why this is a primitive
 *
 * A surface that disappears the instant `open` flips to `false` cannot play an
 * exit animation; a surface that stays mounted forever leaks. Both renderers
 * need the same rule — stay mounted while exiting, unmount when the exit
 * finishes — and each wires a different finish signal (web: CSS
 * `animationend`; native: the `Modal` close / Animated callback). One owner for
 * the state machine, per-renderer finish signals.
 *
 * ## What is genuinely shared, and what is not
 *
 * The MACHINE is shared: `mounted → exiting → unmounted`, where closing moves
 * to `exiting` (still rendered) and only the renderer's `finishExit()` moves to
 * `unmounted`. Reopening from `exiting` returns to `mounted` without ever
 * unmounting. The SIGNAL is not — no DOM event or Animated value appears here.
 */

/** Where a surface is in its mount lifecycle. */
export type PresenceState = "mounted" | "exiting" | "unmounted";

/**
 * Pure transition: which lifecycle state follows `open` from `current`.
 *
 * Closing from `mounted` suspends in `exiting` (the renderer keeps painting
 * until its exit animation reports done); reopening from `exiting` restores
 * `mounted` directly. Nothing here touches a timer or an event.
 */
export function nextPresenceState(
  current: PresenceState,
  open: boolean,
): PresenceState {
  if (open) return "mounted";
  return current === "unmounted" ? "unmounted" : "exiting";
}

export type PresenceModel = {
  subscribe(listener: () => void): () => void;
  getState(): PresenceState;
  /** The renderer reports its controlled `open` value. */
  setOpen(open: boolean): void;
  /** The renderer reports its exit animation finished. No-op unless exiting. */
  finishExit(): void;
  /** True while the surface must stay in the tree (mounted or exiting). */
  isPresent(): boolean;
};

/** Create a presence model starting from `initialOpen`. */
export function createPresenceModel(initialOpen: boolean): PresenceModel {
  let state: PresenceState = initialOpen ? "mounted" : "unmounted";
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const l of listeners) l();
  };
  const setState = (next: PresenceState) => {
    if (next === state) return;
    state = next;
    emit();
  };
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getState: () => state,
    setOpen: (open: boolean) => setState(nextPresenceState(state, open)),
    finishExit: () => {
      if (state === "exiting") setState("unmounted");
    },
    isPresent: () => state !== "unmounted",
  };
}

/**
 * React binding for the presence model. `open` is the controlled value; the
 * renderer calls the returned `finishExit` from its own animation-done signal.
 * The surface renders while `present` is true.
 */
export function usePresence(open: boolean): {
  present: boolean;
  state: PresenceState;
  finishExit: () => void;
} {
  const [model] = useState(() => createPresenceModel(open));
  const state = useSyncExternalStore(
    (listener) => model.subscribe(listener),
    () => model.getState(),
  );
  useEffect(() => {
    model.setOpen(open);
  }, [model, open]);
  return {
    present: state !== "unmounted",
    state,
    finishExit: model.finishExit,
  };
}
