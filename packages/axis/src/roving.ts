/**
 * Roving index — one tab stop per group, arrow traversal within it.
 *
 * ## Why this is a primitive and not a component
 *
 * A composite control (a list of segments, a carousel's item track, a
 * time-picker's three fields) is ONE tab stop, not N. Inside it, arrow keys move
 * between items. That is "roving focus", and it is a model — an active index plus
 * the invariant that only the active item is in the tab order — not a widget.
 *
 * The mechanism is platform-specific and deliberately NOT here: web presses
 * ArrowLeft/ArrowRight; React Native has no arrow keys at all, because a touch
 * device has no keyboard. So the two renderers supply their own input handling
 * and this model supplies only the state and the derived per-item facts. Folding
 * key handling in would make the "platform-free" claim false, which is the same
 * mistake the SheetSurface extraction would have made.
 *
 * ## What callers get
 *
 * `describe(index)` returns `isActive` and `isTabbable`. Those are deliberately
 * NOT named `tabIndex` or `focused`: `tabIndex` is web vocabulary, and a native
 * renderer maps `isTabbable` onto `accessibilityState.selected` instead. The
 * model must not encode which platform is consuming it, or a future third
 * renderer has to work around the web one.
 *
 * ## Wrap and disabled
 *
 * `loop: true` wraps from last to first. `loop: false` stops, and the
 * corresponding `next()`/`previous()` at the end is a no-op that returns the
 * same index — callers that need to know can compare. Disabled items are
 * skipped by traversal but keep their own position, so `count` and the index
 * stable: skipping by deletion would renumber everything after it.
 */

import { useState } from "react";

export type RovingOrientation = "horizontal" | "vertical" | "both";

export type RovingOptions = {
  /** Number of items in the group. */
  count: number;
  /** Which arrow keys move. `both` accepts either axis. */
  orientation?: RovingOrientation;
  /** Wrap from last to first. Default: no wrap. */
  loop?: boolean;
  /** Controlled active index. */
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  /** Items to skip during traversal. Position is preserved in the index space. */
  isDisabled?: (index: number) => boolean;
};

export type RovingItem = {
  index: number;
  /** This is the item that holds the group's single tab stop. */
  isActive: boolean;
  /** True only for the active item — the "one tab stop" invariant. */
  isTabbable: boolean;
  disabled: boolean;
};

export type RovingModel = {
  activeIndex: number;
  setActive: (index: number) => void;
  next: () => number;
  previous: () => number;
  first: () => number;
  last: () => number;
  describe: (index: number) => RovingItem;
  orientation: RovingOrientation;
  loop: boolean;
};

/** Clamp into 0..count-1; an empty group is index 0 and nothing is tabbable. */
function clamp(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(Math.max(index, 0), count - 1);
}

export function createRovingModel(options: RovingOptions): RovingModel {
  const {
    count,
    orientation = "horizontal",
    loop = false,
    isDisabled = () => false,
  } = options;

  const controlled = options.activeIndex !== undefined;
  let current = clamp(
    options.activeIndex ?? options.defaultActiveIndex ?? 0,
    count,
  );
  const listeners: ((index: number) => void)[] = [];
  const notify = (next: number) => {
    for (const fn of listeners) fn(next);
  };
  const commit = (raw: number) => {
    const next = clamp(raw, count);
    if (next === current) return;
    if (controlled) {
      // Controlled means the HOST owns the value. Report and stop: mutating
      // `current` here would let the model move itself and then disagree with
      // the prop on the next render.
      options.onActiveIndexChange?.(next);
      return;
    }
    current = next;
    notify(next);
  };

  /**
   * Step by one, skipping disabled items.
   *
   * A disabled item keeps its index — skipping is traversal, not deletion — so a
   * group of 3 with the middle disabled still reports indices 0..2.
   */
  const step = (delta: number) => {
    if (count <= 0) return current;
    const span = count;
    let index = current;
    // At most `span` probes: every item may be disabled, and then this returns
    // the current index rather than looping forever.
    for (let probe = 0; probe < span; probe += 1) {
      index += delta;
      if (index < 0 || index > span - 1) {
        if (!loop) return current;
        index = (index + span) % span;
      }
      if (!isDisabled(index)) break;
    }
    if (isDisabled(index)) return current;
    commit(index);
    return current;
  };

  return {
    get activeIndex() {
      return current;
    },
    set activeIndex(value: number) {
      commit(value);
    },
    setActive: commit,
    next: () => step(1),
    previous: () => step(-1),
    // `commit` reports rather than returns, so these read `current` back rather
    // than returning its void.
    first: () => {
      commit(0);
      return current;
    },
    last: () => {
      commit(count - 1);
      return current;
    },
    describe: (index: number): RovingItem => {
      // An EMPTY group has no items, so nothing is tabbable — including index 0.
      // Without this, clamp(0, 0) === 0 === current, so an empty group would
      // report one tab stop that does not exist.
      const disabled = count > 0 && isDisabled(index);
      const isActive =
        count > 0 && !disabled && clamp(index, count) === current;
      return {
        index,
        isActive,
        // EXACTLY ONE tabbable item per group — the whole point of the model.
        // When the active item is disabled there is none, which is correct: a
        // group whose only stop is disabled contributes no tab stop.
        isTabbable: isActive,
        disabled,
      };
    },
    orientation,
    loop,
  };
}

/**
 * React binding.
 *
 * The model is plain and synchronous, but a React caller needs the re-render
 * that follows a change of active index, so state is held here rather than
 * inside `createRovingModel`. Uncontrolled changes bump a counter to force the
 * re-render and read the value back out of the model; controlled callers are
 * driven by their own prop and are not re-rendered from here.
 */
export function useRovingModel(options: RovingOptions): RovingModel {
  const controlled = options.activeIndex !== undefined;
  // Uncontrolled state MUST live in React. The plain model keeps `current` in a
  // closure created per call, so rebuilding it on every render (as a hook
  // naturally does) would reset the index to `defaultActiveIndex` each time —
  // which is exactly the bug a model-only test cannot see, because the model
  // has no render cycle.
  const [internal, setInternal] = useState(() =>
    clamp(options.defaultActiveIndex ?? 0, options.count),
  );

  const model = createRovingModel({
    ...options,
    // Always pass the resolved value, so the model behaves as controlled and
    // reports changes rather than mutating its own copy.
    activeIndex: controlled ? (options.activeIndex ?? 0) : internal,
    onActiveIndexChange: (next) => {
      if (!controlled) setInternal(next);
      options.onActiveIndexChange?.(next);
    },
  });
  return model;
}
