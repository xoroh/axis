/**
 * The typeahead model — character-buffer matching over collection items.
 *
 * ## Why this is a primitive
 *
 * Select, menu, and combobox lists on both renderers answer the same
 * question when character keys arrive: which item does the typed
 * buffer point at. The rules that make typeahead feel right —
 * prefix matching, same-character cycling, buffer expiry — are
 * identical per renderer, so two spellings drift on exactly the
 * behavior touch-typists memorize.
 *
 * ## What is genuinely shared, and what is not
 *
 * The BUFFER and the MATCH are shared: timed buffer accumulation
 * over `CollectionItem`s, prefix matching, and same-character
 * cycling with wrap-around. The KEY PLUMBING is not — no Axis list
 * part receives character key events on touch hardware (there is no
 * text field to type into), so no rendered part consumes this yet:
 * the first consumer is hardware-keyboard forwarding,
 * which reads this model without pulling any renderer. Filtering
 * while typing (combobox entry, menu filter input) already flows
 * through the `collection` match; this covers highlight-to-match,
 * not filter-to-match.
 */

import type { CollectionItem } from "./collection";

/** The typed buffer: accumulated characters plus the last-key time (ms). */
export type TypeaheadBuffer = {
  text: string;
  /** `Date.now()`-space timestamp of the last appended character. */
  at: number;
};

/**
 * Append `char` to the buffer, restarting it when `now` arrives
 * later than `timeout` (default `500`) after the previous key.
 * Non-single inputs are ignored — keys arrive one character at a
 * time, and pasting a word is not typing.
 */
export function appendTypeaheadQuery(
  previous: TypeaheadBuffer | null,
  char: string,
  now: number,
  timeout = 500,
): TypeaheadBuffer {
  if (char.length !== 1) return previous ?? { text: "", at: now };
  if (!previous || now - previous.at > timeout) return { text: char, at: now };
  return { text: previous.text + char, at: now };
}

/** Whether the buffer has gone stale with no new key by `now`. */
export function isTypeaheadExpired(
  buffer: TypeaheadBuffer | null,
  now: number,
  timeout = 500,
): boolean {
  if (!buffer || buffer.text === "") return true;
  return now - buffer.at > timeout;
}

/**
 * The key the buffer points at: the first item whose text starts
 * with the buffer (case-insensitive). A buffer of one repeated
 * character (`"aaa"`) cycles instead — it matches that single
 * initial, searching forward from `fromKey` (exclusive) with
 * wrap-around, so repeated presses walk the same-initial items.
 * An unknown `fromKey` searches from the start.
 */
export function matchTypeaheadKey(
  items: readonly CollectionItem[],
  query: string,
  fromKey?: string | null,
): string | undefined {
  const buffer = query.toLowerCase();
  if (buffer === "" || items.length === 0) return undefined;
  const first = buffer.charAt(0);
  const repeating =
    buffer.length > 1 && buffer.split("").every((char) => char === first);
  const needle = repeating ? first : buffer;
  const matches = (text: string): boolean =>
    text.toLowerCase().startsWith(needle);
  if (!repeating) {
    return items.find((item) => matches(item.text))?.key;
  }
  const from =
    fromKey === undefined || fromKey === null
      ? -1
      : items.findIndex((item) => item.key === fromKey);
  for (let step = 1; step <= items.length; step += 1) {
    const index = (from + step + items.length * 2) % items.length;
    const item = items[index];
    if (item && matches(item.text)) return item.key;
  }
  return undefined;
}
