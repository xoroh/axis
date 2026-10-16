/**
 * The FocusTrap model — tab looping and autofocus events for modal surfaces.
 *
 * ## Why this is a primitive
 *
 * A modal surface must keep keyboard focus inside itself while open and move
 * focus into itself when it opens. Both renderers implement that today — web
 * through the dialog primitive's trap, native through explicit first-focusable
 * management — with independent loop arithmetic, so an off-by-one on one side
 * silently does not reach the other.
 *
 * ## What is genuinely shared, and what is not
 *
 * The LOOP is shared: given an ordered list of `count` focusable stops, which
 * stop follows a Tab / Shift+Tab, and where focus lands on open. The STOPS are
 * not — querying tabbable DOM nodes and RN focus targets is platform code. So
 * this works over indices; each renderer maps indices to its own stops.
 *
 * Autofocus is an EVENT descriptor, not an imperative call: the model returns
 * which index to focus (`{ type: "focus-stop", index }` or `{ type: "none" }`)
 * and the renderer performs it. Returning a description keeps DOM/RN focus
 * calls out of the kernel.
 */

export type TrapMove = "next" | "previous" | "first" | "last";

/** Pure index arithmetic for one trap move. */
export function nextTrapIndex(
  current: number,
  count: number,
  move: TrapMove,
  loop: boolean,
): number {
  if (count <= 0) return -1;
  // Clamp a stale index rather than trusting it: the stop list can shrink
  // while the trap is open (a menu item unmounts mid-open).
  const at = Math.min(Math.max(current, 0), count - 1);
  switch (move) {
    case "first":
      return 0;
    case "last":
      return count - 1;
    case "next":
      return at + 1 < count ? at + 1 : loop ? 0 : at;
    case "previous":
      return at - 1 >= 0 ? at - 1 : loop ? count - 1 : at;
  }
}

/** Where focus goes when the trap opens. A description, not a focus() call. */
export type AutofocusEvent =
  | { type: "focus-stop"; index: number }
  | { type: "none" };

/**
 * Which stop to focus on open: the caller's explicit `autoFocusIndex` when it
 * names a real stop, else the first stop, else no event (an empty trap has
 * nothing to focus and must not invent a target).
 */
export function resolveAutofocus(
  count: number,
  autoFocusIndex?: number,
): AutofocusEvent {
  if (count <= 0) return { type: "none" };
  if (
    autoFocusIndex !== undefined &&
    autoFocusIndex >= 0 &&
    autoFocusIndex < count
  ) {
    return { type: "focus-stop", index: autoFocusIndex };
  }
  return { type: "focus-stop", index: 0 };
}

export type FocusTrapModel = {
  /** Currently focused stop, or -1 when the trap holds no stops. */
  getCurrent(): number;
  getCount(): number;
  move(move: TrapMove): number;
  /** Tab from the last stop wraps exactly when `loop` is true. */
  loops(): boolean;
  autofocus(autoFocusIndex?: number): AutofocusEvent;
};

/** Create a trap over `count` ordered stops. `loop` defaults to true: a modal. */
export function createFocusTrapModel(options: {
  count: number;
  loop?: boolean;
  initialIndex?: number;
}): FocusTrapModel {
  const count = Math.max(0, options.count);
  const loop = options.loop ?? true;
  let current =
    count === 0
      ? -1
      : Math.min(Math.max(options.initialIndex ?? 0, 0), count - 1);
  return {
    getCurrent: () => current,
    getCount: () => count,
    loops: () => loop,
    move: (move: TrapMove) => {
      current = nextTrapIndex(current, count, move, loop);
      return current;
    },
    autofocus: (autoFocusIndex?: number) =>
      resolveAutofocus(count, autoFocusIndex),
  };
}
