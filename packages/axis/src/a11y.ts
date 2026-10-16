/**
 * Accessibility plumbing — visually-hidden styling, stable ids, direction.
 *
 * ## Why this is a primitive
 *
 * Every labelled surface needs three things that have nothing to do with how
 * it looks: a way to hide content visually while keeping it announced
 * (icon-only labels, descriptions), a stable id to link triggers to surfaces,
 * and a text direction both renderers agree on. Both renderers hand-roll all
 * three today with independent implementations.
 *
 * ## What is genuinely shared, and what is not — stated carefully
 *
 * The VALUES are shared: the visually-hidden declaration is fixed CSS-in-JS
 * (not a token read — it names no colour, spacing, shape or type value), the
 * id algorithm is a prefixed counter, and direction resolution is a pure
 * fallback. The APPLICATION is not — web spreads the style object onto an
 * element, native maps it onto its own hidden-text host.
 */

export type A11yDir = "ltr" | "rtl" | "auto";

/**
 * The visually-hidden declaration both renderers apply to screen-reader-only
 * content. Fixed values, no tokens: hiding is geometry (`1px`, `clip`), never
 * a visual decision, so sharing it cannot move a theme value into the kernel.
 */
export const VISUALLY_HIDDEN_STYLE: Readonly<{
  position: "absolute";
  width: 1;
  height: 1;
  padding: 0;
  margin: -1;
  overflow: "hidden";
  clip: "rect(0, 0, 0, 0)";
  whiteSpace: "nowrap";
  borderWidth: 0;
}> = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

export type IdScope = {
  /** Next stable id in this scope: `prefix` + `-` + a 1-based counter. */
  nextId(): string;
  prefix: string;
};

/**
 * Create an id scope. Counters are per-scope so two scopes never collide, and
 * 1-based so the first id reads `prefix-1`, never `prefix-0`.
 */
export function createIdScope(prefix: string): IdScope {
  let counter = 0;
  return {
    prefix,
    nextId: () => {
      counter += 1;
      return `${prefix}-${counter}`;
    },
  };
}

/**
 * Resolve text direction: the explicit `dir` wins, else the host default,
 * else `"ltr"`. Never returns `undefined` — a renderer branching on direction
 * must always have an answer.
 */
export function resolveDir(options?: {
  dir?: A11yDir;
  defaultDir?: A11yDir;
}): A11yDir {
  return options?.dir ?? options?.defaultDir ?? "ltr";
}
