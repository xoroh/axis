# Status report — 2026-10-16 (Axis completion program, turn 8)

## Done this turn
- **PR #30 merged** (owner-approved Menu compound parts).
- **Q5 closed**: `Drawer` canonical, `NavigationDrawer`
  warn-once alias, `Sheet` kept as genuinely different (PR
  merged after green CI — small routine).
- **Q7 closed**: README split merged (PR #35, green).
  - `packages/axis/README.md` 1169 → short (install, minimal
    example, 66-row index with absolute URLs, doc links).
  - 66 per-component notes moved verbatim to
    `docs/components/*.md` (single `##` each, all with
    `Source of truth`, titles unique — verified
    programmatically).
  - Root `README.md` rewritten (stale scaffolding/release
    lines gone; HOLD-accurate release line).
  - Compatibility evidence preserved (not dropped) in new
    `docs/COMPATIBILITY.md`, linked from both READMEs.
  - `check-readme` retargeted (per-file source-of-truth,
    index sync, no stray sections) and green.
- **PR #33 still open for owner**: Menu follow-ups (large).
  No action taken on it (no waiting either — independent
  tracks shipped instead).

## Decisions with rationale
1. **Single-source component docs in `docs/components/`;
   published README keeps index only.** *Rationale: two prose
   sources drift (the Q1 rot class); absolute URLs keep the
   npm page functional.*
2. **One file per README section (66), not per family.**
   *Rationale: mechanical move, byte-verifiable, no content
   decisions smuggled in; regrouping later is cheap.*
3. **Compatibility evidence kept as `docs/COMPATIBILITY.md`.**
   *Rationale: dropping peer evidence to shorten a README
   would be information loss against the picture-perfect
   bar — the short README links instead of deleting.*
4. **Index is names + links, no descriptions.**
   *Rationale: descriptions duplicate the notes one click
   away and rot first; the gate keeps names/links exact.*

## Quality findings update
- Q7 DONE (this turn). Q5 DONE (last turn).
- New watch item **Q15 — README examples are untested prose**
  (8 tsx blocks + new minimal examples). Against the
  no-doc-errors bar, examples need mechanical accuracy
  checking (import/specifier/prop-name verification against
  the barrel). Planned: `check-readme-examples` gate slice.

## Remaining program
1. Q6 `apps/example` Expo scaffold (design noted last turn:
   no kern deps in-repo; barrel-coverage gate via tsc) —
   next turn, phased demos per family after scaffold.
2. Menu checkbox/radio/filter parts (after #33 lands, or
   stacked if cleaner) + submenu-alias evaluation.
3. Popover/Select/Tooltip/controls alignment + parity rows;
   planned slices (focus, nesting, handles, transitions).
4. Q7 follow-through: none (closed).
5. Rewrite readiness report WITH full parity, stop for
   confirmation. Kern untouched.

## Standing constraints (unchanged)
- Release HOLD: no publish/tags/versions. No Kern/token deps.
  No branches deleted. Behind-main races by rebase, never
  `--admin`. Small green PRs merged by agent (this turn: #30
  per owner approval, #35 docs split). Large ones reported
  for owner merge (#33).
