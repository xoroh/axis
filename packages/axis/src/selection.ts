import { useCallback, useMemo } from "react";
import { useControllableState } from "./useControllableState";

/**
 * The collection/selection model shared by every Kern control that selects.
 *
 * ## Why this is a primitive
 *
 * SegmentedButton, ToggleGroup, Accordion and Select all reduce to the same two
 * questions: is this key selected, and what happens when it is activated. The
 * answer differs in exactly one way — whether selection is exclusive or additive
 * — and that difference is a Kern decision (M3's segmented button is multi-select;
 * its radio group is not), not a platform detail.
 *
 * So the model is shared and the rendering is not. On web the selection axis is
 * Base UI's `multiple`; on native it is `accessibilityRole` switching between
 * `radio` and `checkbox`. Neither belongs in this file, which is why it can be a
 * real primitive rather than contract data.
 *
 * ## Why the key is generic
 *
 * SegmentedButton and ToggleGroup select by string value; Accordion selects by
 * INDEX, and `expanded: number[]` is public API. Pinning this to `string` would
 * have left Accordion out and made the "shared model" claim half true. The
 * selection rules never inspect the key, so there is nothing to gain from
 * narrowing it.
 *
 * ## Representation
 *
 * Selection is ALWAYS an array, including in single mode where it holds at most
 * one entry. Normalising to one shape removes the branch every consumer otherwise
 * writes (`isMultiple ? values : [value]`).
 */

/** The identity of a selectable item: string for value-keyed, number for index-keyed. */
export type SelectionKey = string | number;

export type SelectionMode =
  /**
   * Radio semantics: activating replaces, and re-activating the selected item
   * does NOTHING — it does not deselect. A radio group with nothing selected is
   * not a state M3 describes, and a control that empties itself on a second tap
   * surprises pointer users.
   */
  | "single"
  /**
   * Accordion / disclosure semantics: activating replaces, and re-activating the
   * CURRENT item COLLAPSES it. Distinct from `single` because "the one open
   * section" closing is the entire point of a disclosure.
   *
   * Found by a test: the first version of this primitive had only `single` and
   * applying it to Accordion broke the collapse that component exists to provide.
   */
  | "single-toggle"
  /** Multi-select: activating adds or removes. */
  | "multiple";

/** At most one entry in `single` mode; any number in `multiple`. */
export type Selection<K extends SelectionKey = string> = readonly K[];

/** Coerce a caller's single-or-array value into the array representation. */
export function normalizeSelection<K extends SelectionKey>(
  value: K | readonly K[] | undefined,
  mode: SelectionMode,
): Selection<K> {
  if (value === undefined) return [];
  const list = (
    typeof value === "string" || typeof value === "number" ? [value] : value
  ) as K[];
  if (mode !== "multiple") return list.slice(0, 1);
  // Deduplicate: a multi-select reporting the same key twice is a caller bug,
  // and carrying it would make `length` lie about how many are selected.
  return [...new Set(list)];
}

/** Whether `key` is currently selected. */
export function isSelected<K extends SelectionKey>(
  selected: Selection<K>,
  key: K,
): boolean {
  return selected.includes(key);
}

/**
 * Apply an activation to the selection.
 *
 * In `single` mode an activation always REPLACES, even re-activating the current
 * key — that is what a radio group does. Deselecting would leave the group with
 * nothing selected, which M3 does not describe. (A hand-rolled implementation
 * this replaced set `""` on re-activation, producing a phantom empty-string
 * selection instead.)
 */
export function toggleSelection<K extends SelectionKey>(
  selected: Selection<K>,
  key: K,
  mode: SelectionMode,
): Selection<K> {
  if (mode === "single-toggle") {
    // Collapse when the open one is activated again; otherwise move to `key`.
    return selected[0] === key ? [] : [key];
  }
  if (mode === "single") return [key];
  return selected.includes(key)
    ? selected.filter((entry) => entry !== key)
    : [...selected, key];
}

/** Equality by contents, independent of activation order. */
function sameSelection<K extends SelectionKey>(
  a: Selection<K>,
  b: Selection<K>,
): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((entry) => setA.has(entry));
}

/**
 * The selection state, controlled or uncontrolled, with a stable `select`
 * callback.
 *
 * `mode` changes normalise immediately rather than waiting for an interaction:
 * widening single -> multiple keeps the selection, narrowing multiple -> single
 * keeps the FIRST entry, so a control never reports more selected items than its
 * mode permits.
 */
export function useSelection<K extends SelectionKey>({
  value,
  defaultValue,
  onChange,
  mode,
}: {
  value?: K | readonly K[];
  defaultValue?: K | readonly K[];
  onChange?: (next: Selection<K>) => void;
  mode: SelectionMode;
}): [Selection<K>, (key: K) => void] {
  // `useControllableState` is generic over T, so its `onChange` is
  // `(next: T) => void`. Our T is the caller's single-or-array, but our onChange
  // receives the normalised array — so the bridge is a real function rather than
  // a cast, which would hide the difference between "what the caller passed in"
  // and "what we report back".
  //
  // It is `useCallback`'d because `useControllableState` keeps `onChange` in the
  // deps of its own setter: a fresh closure every render would rebuild `setRaw`
  // every render, and therefore `select` too.
  const notify = useCallback(
    (next: K | readonly K[] | undefined) => {
      onChange?.(normalizeSelection(next, mode));
    },
    [onChange, mode],
  );

  const [raw, setRaw] = useControllableState<K | readonly K[] | undefined>(
    value,
    defaultValue,
    notify,
  );

  const selected = useMemo(() => normalizeSelection(raw, mode), [raw, mode]);

  const select = useCallback(
    (key: K) => {
      setRaw((previous) => {
        const current = normalizeSelection(previous, mode);
        const updated = toggleSelection(current, key, mode);
        // Compare by VALUE. `useControllableState` skips when `Object.is`
        // matches, and two arrays with equal contents are never identical — so
        // without this a re-activation would report a change that did not
        // happen, and a consumer wiring `onChange` to a state setter would loop.
        if (sameSelection(current, updated)) return previous;
        return updated;
      });
    },
    [mode, setRaw],
  );

  return [selected, select];
}
