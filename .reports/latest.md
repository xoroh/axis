# Status report — 2026-10-16 (Axis completion program, turn 9)

## Done this turn
- **PR #33 merged** (owner-approved Menu follow-ups): took main
  in with a clean merge (single README conflict — ported the
  compound docs into `docs/components/menu.md`, kept main's
  short README), CI green, squash-merged by agent per approval.
- **PR #37 OPEN (large — for owner review/merge): Menu
  selectable parts.** `MenuCheckboxItem` (+`Indicator`, stays
  open by default) + `MenuRadioGroup`/`MenuRadioItem`
  (+`Indicator`, closes on select) with controlled-state APIs
  over the shared activation hook (Item/LinkItem/selectable
  differ in role only — no duplicated logic). RNTL +7 (full
  jest 56/416 green locally). Parity rows updated (submenu
  aliases rejected with rationale; filter parts deferred on
  the collection transfer, recorded).
- Turn-8 docs (PR #36) merged after a behind-main race
  (rebase-free merge-in flow, no `--admin`).
- Positioning `align`/`alignOffset` verified live through the
  compound `MenuPositioner` path (unit tests + RNTL suites).

## Decisions with rationale
1. **No `value` on checkbox items** (test bug, not type bug).
   *Rationale: checked state IS the identity; group
   membership doesn't exist for checkboxes. The test
   carried a `value` from the radio pattern — removed.*
2. **Radio `onValueChange` stays `(value: string)`** with a
   null-swallowing adapter to the hook. *Rationale: null is
   the empty initial, never a reported transition (no
   deselect in single-select) — the public type tells the
   truth about what fires.*
3. **Submenu aliases rejected (again, finally).**
   *Rationale: a renamed `DropdownMenu` adds names without
   behavior; recorded in parity so it stays decided.*
4. **Filter parts deferred on collection transfer.**
   *Rationale: filtering without item registration is chrome;
   the gate (`collection` transfer) is the honest trigger.*
5. **Q7/Q5 follow-through verified on merged main** (index,
   Drawer alias, compatibility doc all present post-merge).

## No architecture conflicts escalated
Nothing this turn needed owner arbitration beyond the queued
large PR itself.

## Remaining program
1. Popover, Select, Combobox, Tooltip, controls families with
   parity rows.
2. Planned slices (Q6 example scaffold next? or focus
   containment — owner ordering: Q6 scaffold + demos was
   queued before menu-checkbox work; reassess next turn).
3. README-example accuracy gate (Q15).
4. Rewrite readiness report WITH full parity, stop for
   confirmation. Kern untouched.

## Standing constraints (unchanged)
- Release HOLD: no publish/tags/versions. No Kern/token deps.
  No branches deleted. Merges by merge-commit (no force-push
  on shared branches; rebase only unpushed tip work... this
  turn used merge-in flow throughout). Small green PRs merged
  by agent; large ones reported (#37).
- Open owner calls: Q6 example app, release timing, PR #37.
