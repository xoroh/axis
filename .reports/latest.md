# Status report — 2026-10-16 (Axis completion program, turn 13)

## Done this turn
- **PR #51 OPEN (for owner merge — open-only rule): Q6 demo
  coverage complete.** 12 family demos (selection, entry,
  list-select, ranges, display, disclosure, overlays, menu,
  dropdown, bars, popover) cover all 103 barrel component
  exports; dialog/menu demos extended to compound parts.
  `check-demo-coverage` now fails on missing (proven both
  directions: full-exit 0, missing-exit 1) and runs in CI
  validate after the build alongside example typecheck (tsc
  clean against the built barrel). Demos unstyled, no Kern
  deps. Full battery green.
- Research reports (#49) landed on main; contents verified
  identical to the shared-checkout copies (nothing lost).

## Decisions with rationale
1. **Family demos, not per-component files** (12 files for
   95 exports). *Rationale: parts compose in use — a Menu
   demo showing Item+Separator+Group together is honest
   composition; 95 one-component files would be theatre.*
2. **Demos resolve the built barrel** (kept from scaffold).
   *Rationale: proves the shipped artifact.*
3. **Monolith usages included** (Menu, Popover, Dialog
   demos render both forms). *Rationale: the gate counts
   barrel names — claiming without rendering would be
   dishonest; both forms are public API.*
4. **tsc as the prop verifier** (3 real API bugs caught:
   Tabs/Checkbox-children/Menu-label props don't exist).
   *Rationale: hand-checking 95 components' props doesn't
   scale; the compiler is the reviewer that never tires.*

## Remaining program (in order)
1. Owner merges #51 (or requests changes).
2. Q15 README-example accuracy gate.
3. Popover/Select/Tooltip/controls alignment remainder +
   parity backfill; planned slices (focus, nesting,
   handles, transitions, Q6 demos done).
4. Rewrite readiness report WITH full parity, stop for
   confirmation. Kern untouched.

## Standing constraints (unchanged)
- Release HOLD: no publish/tags/versions. No Kern/token
  deps. No branches deleted. Open PRs only — never merge
  own PRs (new rule this turn). Behind-main races by
  rebase/merge-in, never `--admin`.
- Open owner calls: #51 merge, release timing.
