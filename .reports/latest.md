# Status report — 2026-10-16 (Axis completion program, turn 11)

## Done this turn
- **PR #42 merged**: Popover compound parts (modal-default-false,
  Backdrop modal-only, no role claim) + positioning
  `align`/`alignOffset`.
- **PR #44 merged** (models zone): `./models` subpath, nested
  per-condition types (attw FalseESM fixed), boundary closure
  walk + parity + manifest check (mutation-proven), header
  fixed, zones in contract + AGENTS.
- **PR #45 OPEN (large — owner merges): scope migration.**
  21 design-pattern components leave in one hard cut, no
  aliases, no deprecation (ADR 006/011, both on main):
  Badge, ButtonGroup, Card, Carousel, Chip, EmptyState, Fab,
  ExtendedFab, IconButton, Kbd, LinkButton, ListItem,
  LoadingButton, NavigationBar, NavigationRail, Pagination,
  SettingsRow, Skeleton, SplitButton, TopAppBar,
  NavigationDrawer alias. Keeps: Drawer (own file), Sheet
  (detents), all primitives. Button covers icon/loading
  (loading/busy, required label); link-look is caller
  styling. Parity gap noted (not added): Button has no
  render/asChild prop. Kern verified importing zero Axis
  components (models/hooks only). Full battery green
  (lint/typecheck/boundary/vitest/full-jest/build/publint/
  readme/demo-gate); index 66→46; changeset included.
- Work discipline: dedicated worktree `axis-scope` for the
  migration (main checkout untouched); other threads'
  research reports left untracked/uncommitted (one near-miss
  caught pre-commit — recorded below).

## Decisions with rationale
1. **No duplicate ADR**: vision thread already landed 006
   (scope) + 011 (no-compat). *Rationale: two sources for one
   decision is the rot class gates exist to prevent; the
   PR references them.*
2. **No fold-in for LinkButton/LoadingButton** (Lead
   decision executed literally). *Rationale: Base has no
   loading prop and forbids button-as-link — folding would
   have added non-Base API under a parity banner.*
3. **Checkbox items carry no `value`** (kept from last
   turn's slice). *Rationale: checked state is the identity.*
4. **Test-file renames** (search/pagination→search,
   trigger-topappbar→trigger, navigation→drawer).
   *Rationale: filenames are documentation; stale names
   after a move are the same lie as stale comments.*
5. **Kept pre-existing `switch.tsx` lint warning untouched.**
   *Rationale: another thread's file, fails identically on
   main — fixing it here would smuggle scope into the
   migration diff.*

## Process incident (recovered, no work lost)
- `git add -A` staged three other threads' untracked
  research reports into the Popover commit. Caught on
  pre-push review; removed via `rm --cached` + amend (own
  unmerged branch only). Rule going forward: `git status`
  review before every commit + verify-into-HEAD after.
- Line-ending-unrelated `edit` mismatches (2×) worked around
  via `python3` file edits with asserts. No content harmed.

## Remaining program (in order)
1. Owner merges #45 (or requests changes).
2. No-compat sweep PR (Switch value-aliases +
   NavigationDrawer alias — already deleted in #45? NO:
   #45 deletes the alias file outright; Switch aliases
   remain) — small PR next: remove Switch
   `value`/`defaultValue`/`onValueChange` + warn-once,
   update tests/README/parity row.
3. AI chat models (after scope PR): useStickToBottom,
   status vocabulary, Message + a11y, ToolCall, attachments,
   prompt input, branch, Source — models zone, tests,
   parity notes. Small PRs.
4. Popover/Select/Tooltip/controls alignment remainder +
   parity backfill; planned slices (focus, nesting,
   handles, transitions, Q15 gate, Q6 demos).
5. Rewrite readiness report WITH full parity, stop for
   confirmation. Kern untouched.

## Standing constraints (unchanged)
- Release HOLD: no publish/tags/versions. No Kern/token
  deps (this turn: read-only grep only). No branches
  deleted. No force-push on shared branches (one
  `--force-with-lease` on own unreviewed WIP branch + one
  documented amend cycle). Small green PRs merged by agent
  only where authorized; large ones reported.
- Open owner calls: #44 merged (done), #45 merge, release
  timing, Q6 demos, Q5 alias-removal remainder (folded
  into item 2 above).
