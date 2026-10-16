# Status report — 2026-10-16 (Axis completion program, turn 12)

## Done this turn
- **PR #45 OPEN (large — owner merges): scope migration.**
  21 design-pattern components leave in one hard cut, no
  aliases, no deprecation (ADR 006/011): Badge, ButtonGroup,
  Card, Carousel, Chip, EmptyState, Fab, ExtendedFab,
  IconButton, Kbd, LinkButton, ListItem, LoadingButton,
  NavigationBar, NavigationRail, Pagination, SettingsRow,
  Skeleton, SplitButton, TopAppBar, NavigationDrawer alias.
  Keeps: Drawer (own file), Sheet, all primitives. Full
  battery green; index 66→46; Kern verified importing zero
  Axis components. Ran in dedicated worktree `axis-scope`;
  main checkout untouched.
- **PR #47 merged** (small, green): no-compat sweep part 1 —
  Switch value-aliases + warn-once removed (canonical
  checked/* only); controlled-misuse warning kept (real dev
  need, React precedent) with stale vendor prefix fixed and
  reason stated; tests/docs/parity updated.
- **PR #44 merged**: models zone (`./models` subpath, nested
  types, boundary closure walk, header/contract/AGENTS).

## Decisions with rationale
1. **No duplicate ADR for scope/no-compat** (vision thread
   landed 006/011 first). *Rationale: two sources for one
   decision is the rot class gates prevent; PRs reference
   them.*
2. **LinkButton/LoadingButton deleted outright** (Lead).
   *Rationale: Base has no loading prop and forbids
   button-as-link — folding would add non-Base API under a
   parity banner. Button `render` gap noted in PR, not
   added.*
3. **Checkbox items carry no `value`.** *Rationale: checked
   state is the identity (kept from the slice).*
4. **Stale test filenames renamed** with the move
   (search/pagination→search, trigger-topappbar→trigger,
   navigation→drawer). *Rationale: filenames are
   documentation.*
5. **Kept pre-existing example-app lint warning + controlled-
   misuse warning.** *Rationale: another thread's file /
   real dev need — neither is compat.*
6. **Research reports of other threads left untracked**
   (one near-miss caught pre-commit). *Rule: status review
   before every commit + verify-into-HEAD.*

## Remaining program (in order)
1. Owner merges #45 (or requests changes).
2. AI chat models (after scope PR): useStickToBottom,
   status vocabulary, Message + a11y, ToolCall,
   attachments, prompt input, branch, Source — models
   zone, tests, parity notes. Small PRs.
3. Popover/Select/Tooltip/controls alignment remainder +
   parity backfill; planned slices (focus, nesting,
   handles, transitions, Q15 gate, Q6 demos).
4. Rewrite readiness report WITH full parity, stop for
   confirmation. Kern untouched.

## Standing constraints (unchanged)
- Release HOLD: no publish/tags/versions. No Kern/token
  deps (this turn: read-only grep only). No branches
  deleted. No force-push on shared branches. Small green
  PRs merged by agent (#47); large ones reported (#45).
- Open owner calls: #45 merge, release timing, Q6 demos.
