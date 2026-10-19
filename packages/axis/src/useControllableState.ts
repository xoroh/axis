import { useCallback, useEffect, useRef, useState } from "react";
import type { OverlayOpenChangeDetails } from "./dismissWiring";

export type StateAction<T> = T | ((previous: T | undefined) => T);

/** Controlled/uncontrolled state with updater support and mode-change warning. */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T | undefined,
  onChange?: (next: T, details?: OverlayOpenChangeDetails) => void,
): [
  T | undefined,
  (next: StateAction<T>, details?: OverlayOpenChangeDetails) => void,
] {
  const [internal, setInternal] = useState<T | undefined>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const currentRef = useRef(current);
  const wasControlled = useRef(controlled);
  currentRef.current = current;

  useEffect(() => {
    if (wasControlled.current !== controlled) {
      // Misuse detector (React issues the same warning): flipping
      // controlled↔uncontrolled mid-lifetime is always a bug. Kept
      // because it catches real defects, not for compatibility.
      console.warn(
        "Axis: a component changed from controlled to uncontrolled (or vice versa). Keep the value prop defined for its lifetime.",
      );
      wasControlled.current = controlled;
    }
  }, [controlled]);

  const setValue = useCallback(
    (action: StateAction<T>, details?: OverlayOpenChangeDetails) => {
      const previous = currentRef.current;
      const next =
        typeof action === "function"
          ? (action as (previous: T | undefined) => T)(previous)
          : action;
      currentRef.current = next;
      if (!controlled) setInternal(next);
      if (!Object.is(previous, next)) onChange?.(next, details);
    },
    [controlled, onChange],
  );

  return [current, setValue];
}
