# Quality findings — Axis audit (owner quality mandate, 2026-10-16)

Living record: each problem, why it is wrong, proposed fix with
priority. Fixed items stay listed with their PR for traceability.

## Fixed

- **Q1 — 14 duplicated README component sections** (Meter,
  Loader, Skeleton, EmptyState, Card, ListItem, Kbd, Table,
  Carousel, Toolbar, Chip, LinkButton, LoadingButton,
  SplitButton). Batch-appended docs re-documented earlier
  batches; no gate noticed, so readers found two
  near-identical sections. *Fix: PR #23* — second copies removed
  (SplitButton details merged into the survivor), plus a
  `check-readme` gate (unique headers, TOC sync, source-of-truth
  lines) wired into CI. Priority was high. DONE.
- **Q2 — No README table of contents (≈1100 lines, 66 sections).**
  Undiscoverable reference. *Fix: PR #23* — generated Contents,
  kept honest by the same gate. DONE.
- **Q3 — Mixed section-title casing** (RadioGroup vs Settings
  Row). *Fix: PR #23* — spaced human titles everywhere (Base UI
  docs pattern). DONE.
- **Q4 — Stale CHANGELOG `Unreleased`** (scaffolding-era line
  while 17 changesets pend). A hand list would be a second
  opinion on changesets. *Fix: PR #23* — section now points at
  changesets until the first release. DONE.
- **Q12 — Switch `value` state props diverged from Base UI.**
  Critic decision: `checked`/`defaultChecked`/`onCheckedChange`
  exactly. Old spellings kept as warn-once deprecated aliases
  (both handlers fire, canonical wins) until removal — Kern's
  cutover keeps working. *Fix: PR #25.* DONE.
- **Q13 — 16 components missing ref forwarding** (Avatar, Badge,
  Card, EmptyState, Fieldset, Field, Kbd, Label, ListItem,
  Loader, Meter, NavigationRail, Progress, Separator, Skeleton,
  Toast). *Fix: PR #26* — inline documented composition + one
  forwarding test each; README prop lists updated. DONE.
- **Q14 — ARIA state naming audit.** Outcome: consistent. The
  only mapping is pressed→`selected` (Toggle, ToggleGroup
  items) — forced, RN has no `pressed` state key (verified
  against RN 0.87 `ViewAccessibility`), documented in the Toggle
  parity row. `checked` (Switch/Checkbox/groups), `expanded`
  (triggers/menus), `busy` (loading), `disabled` everywhere.
  DONE (verified, no code change needed).

## Proposed (needs owner call — not started)

- **Q5 — RESOLVED by owner decision: Base UI naming.** The
  edge-anchored panel is `Drawer`; `NavigationDrawer` is a
  warn-once deprecated alias; `Sheet` stays (detents/snap/drag
  genuinely different). Shipped; alias removal after one minor
  is the only remainder.
- **Q15 — README examples are untested prose.** Against the
  no-doc-errors bar, the tsx blocks (package + root READMEs,
  component notes) need mechanical accuracy checking
  (import/specifier/prop-name verification against the barrel).
  Planned: `check-readme-examples` gate slice. Priority:
  medium.

- **Q5 — `Sheet` vs Base UI `Drawer` naming.** Base UI has
  `Drawer` (edge panel + snap points + gestures); our `Sheet`
  (bottom detents + drag) overlaps it heavily, and owner
  direction demands Base UI names. Options: (a) rename
  `Sheet`→`Drawer` with `side`+`snapPoints` API (matches Base,
  breaks the 1-week-old `Sheet` API pre-1.0); (b) keep both
  (`Sheet` bottom-only, `Drawer` edge-anchored — but then our
  `NavigationDrawer` triple-collides by name). Priority: medium
  (cheap pre-1.0, expensive after). **RESOLVED (owner call this
  turn): option (b) with `Drawer` canonical — shipped; alias
  removal pending.**
- **Q6 — No interactive demo surface.** Docs are prose +
  untested snippets; Base UI/shadcn pattern is live examples and
  a playground. Owner decision: no playground in the axis repo;
  keep ONE runnable Expo example app (`apps/example`) covering
  every component; interactive docs/playground belongs to
  Kern's site. Scaffold next. Priority: medium.
- **Q7 — README single-file scale.** RESOLVED this turn: split
  shipped (66 notes in `docs/components/`, short READMEs,
  retargeted gate).

## Verified OK (no action)

- **Q8 — No MCP/CLI plans exist.** Single exclusion line in the
  contract; nothing to drop.
- **Q9 — Barrel hygiene.** Single `.` entry, 247 exports, no dead
  names found; monolith + compound coexistence intentional
  (documented in `BASE_UI_PARITY.md`).
- **Q10 — `ListItem` vs `SettingsRow` overlap.** Real but
  documented (generic slots vs settings semantics + control
  slot). Watch item: revisit if a third row type appears.
- **Q11 — `apps/` placeholder, peers, engines, HOLD.** As
  designed; release HOLD intact everywhere.
