/**
 * The source model — cited references behind a citation chip.
 *
 * ## Why this is a primitive
 *
 * Tool and web-search rows on both renderers cite the same
 * references: an `href` with an optional human title. The shared part
 * is deliberately thin — a shape plus list hygiene — because
 * everything visual (chips, cards, footnotes, inline citations) is
 * styled composition in the host design system. Thin is not nothing: without the shared
 * dedupe rule, the same URL cited twice renders two chips on one
 * renderer and one on the other.
 *
 * ## What is genuinely shared, and what is not
 *
 * The SHAPE and the HYGIENE are shared: `{href, title?}`,
 * whitespace trimming, empty-href dropping, and first-wins dedupe by
 * `href`. The FETCHING is not — resolving, opening, and previewing
 * sources are app and platform code.
 */

/** One cited reference: where it points, plus what to call it. */
export type ChatSource = {
  /** Cited URL. The dedupe key; surrounding whitespace is trimmed. */
  href: string;
  /** Human title; falls back to the href when absent. */
  title?: string;
};

/**
 * Clean a source list: trim hrefs, drop empties, dedupe by href with
 * first-wins (the earliest citation keeps its position and title).
 * Never throws on `undefined` — a turn with no sources normalises to
 * `[]`, not a crash.
 */
export function normalizeChatSources(
  sources: readonly ChatSource[] | undefined,
): ChatSource[] {
  if (!sources) return [];
  const seen = new Set<string>();
  const out: ChatSource[] = [];
  for (const source of sources) {
    const href = source.href.trim();
    if (!href || seen.has(href)) continue;
    seen.add(href);
    out.push({ ...source, href });
  }
  return out;
}

/**
 * The announced label for a citation: the title when it says
 * something, else the href. Never returns `""` — a chip the screen
 * reader cannot name is a silent control.
 */
export function resolveChatSourceLabel(source: ChatSource): string {
  const title = source.title?.trim();
  return title ? title : source.href.trim();
}
