import { useCallback, useState } from "react";

/**
 * The Press model — press/activation behaviour shared by every pressable.
 *
 * ## Why this is a primitive
 *
 * Pressed-state tracking (pressed visual while held, cancelled when the pointer
 * leaves) and keyboard activation (Enter and Space activate a pressable) exist
 * on BOTH renderers with independent implementations: web spreads `onClick` /
 * `onKeyDown`, native spreads `onPress`. A fix to which keys activate on one
 * side silently does not reach the other.
 *
 * ## What is genuinely shared, and what is not
 *
 * The MODEL is shared: pressed-or-not, and which keys count as activation.
 * The EVENTS are not — DOM keyboard/pointer events and RN press events are
 * platform types. So this exposes `begin`/`end`/`cancel` plus the key
 * predicate, and each renderer binds its own events to them.
 */

/** Pressed-or-not. Cancelled returns to idle without ever reporting a press. */
export type PressPhase = "idle" | "pressed";

export type PressModel = {
  getPhase(): PressPhase;
  isPressed(): boolean;
  /** Pointer/key went down on the target. No-op when disabled. */
  begin(): void;
  /** Release over the target: reports a press via the caller's `onPress`. */
  end(): void;
  /** Release off-target or interrupted: back to idle, no press reported. */
  cancel(): void;
  /** Whether the model accepts input at all. */
  isDisabled(): boolean;
};

/**
 * Which keyboard keys activate a pressable. Enter and Space (the `" "` key
 * value) — the two WAI-ARIA activation keys — and nothing else. A Tab or
 * Escape must never read as a press, on either renderer.
 */
export function isPressActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

/** Create a press model. `onPress` fires only on `end()` from `pressed`. */
export function createPressModel(options?: {
  disabled?: boolean;
  onPress?: () => void;
}): PressModel {
  const disabled = options?.disabled ?? false;
  const onPress = options?.onPress;
  let phase: PressPhase = "idle";
  return {
    getPhase: () => phase,
    isPressed: () => phase === "pressed",
    isDisabled: () => disabled,
    begin: () => {
      if (disabled || phase === "pressed") return;
      phase = "pressed";
    },
    end: () => {
      if (disabled || phase !== "pressed") return;
      phase = "idle";
      onPress?.();
    },
    cancel: () => {
      phase = "idle";
    },
  };
}

/**
 * React binding for the press model. Returns the pressed bit plus
 * platform-free `begin`/`end`/`cancel` the renderer binds to its own events —
 * web to pointer/key handlers, native to `onPressIn`/`onPressOut`.
 */
export function usePress(options?: {
  disabled?: boolean;
  onPress?: () => void;
}): {
  pressed: boolean;
  begin: () => void;
  end: () => void;
  cancel: () => void;
} {
  const [model] = useState(() => createPressModel(options));
  const [pressed, setPressed] = useState(false);
  // The model is created once per mount, so `options` is read at mount: a
  // pressable that flips `disabled` mid-gesture is a renderer concern (the
  // gesture is already committed), not a model one.
  const sync = useCallback(() => setPressed(model.isPressed()), [model]);
  const begin = useCallback(() => {
    model.begin();
    sync();
  }, [model, sync]);
  const end = useCallback(() => {
    model.end();
    sync();
  }, [model, sync]);
  const cancel = useCallback(() => {
    model.cancel();
    sync();
  }, [model, sync]);
  return { pressed, begin, end, cancel };
}
