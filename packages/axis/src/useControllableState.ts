import { useCallback, useEffect, useRef, useState } from "react";

export type StateAction<T> = T | ((previous: T | undefined) => T);

/** Controlled/uncontrolled state with updater support and mode-change warning. */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T | undefined,
  onChange?: (next: T) => void,
): [T | undefined, (next: StateAction<T>) => void] {
  const [internal, setInternal] = useState<T | undefined>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const currentRef = useRef(current);
  const wasControlled = useRef(controlled);
  currentRef.current = current;

  useEffect(() => {
    if (wasControlled.current !== controlled) {
      console.warn(
        "Kern: a component changed from controlled to uncontrolled (or vice versa). Keep the value prop defined for its lifetime.",
      );
      wasControlled.current = controlled;
    }
  }, [controlled]);

  const setValue = useCallback(
    (action: StateAction<T>) => {
      const previous = currentRef.current;
      const next =
        typeof action === "function"
          ? (action as (previous: T | undefined) => T)(previous)
          : action;
      currentRef.current = next;
      if (!controlled) setInternal(next);
      if (!Object.is(previous, next)) onChange?.(next);
    },
    [controlled, onChange],
  );

  return [current, setValue];
}
