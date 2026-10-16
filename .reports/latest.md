# Status report — 2026-10-16 (Axis completion program, turn 14)

## Done this turn
- **PR #55 OPEN (for owner merge — open-only rule): repeatable
  `scripts/pack-vendor.mjs`.** Builds fresh, packs with npm
  (release-equivalent), names `axis-<short-sha>.tgz`, prints
  path + sha512. Refuses dirty tracked trees (`--allow-dirty`
  for scratch). No version bump, no publish. Documented in
  CONTRIBUTING (Kern copy + re-pin flow). Verified: tarball
  contents (dist/README/LICENSE, no src), clean `file:`-spec
  consumer install loads the models entry, deterministic name
  + bytes across runs, dirty refusal. Full battery green.
  Ran in dedicated worktree; main checkout untouched.
- Q15 gate PR (#54) still open from last turn (CI was green;
  left for owner under open-only rule).

## Decisions with rationale
1. **Untracked files don't dirty-fail the script**
   (`--untracked-files=no`). *Rationale: `npm pack` ships
   the `files` allowlist, never the worktree — untracked
   files cannot affect the bytes, so failing on them would
   cry wolf (including on the script's own development).*
2. **Nested per-condition types in `./models`** (not top-level
   `types`). *Rationale: attw FalseESM — top-level types
   resolve ESM declarations against the CJS artifact; the
   `.` entry's nested shape passes, so mirror it.*
3. **No duplicate ADR** (vision 006/011 cover scope +
   no-compat). *Rationale: recorded last turn, unchanged.*
4. **`useControllableState` misuse warning kept.**
   *Rationale: dev-error detector with React precedent, not
   compat — but its stale vendor prefix was corrected with
   the reason stated in code.*

## Remaining program (in order)
1. Owner merges #54 (Q15 gate), #55 (vendoring).
2. AI chat models (after scope PR #45 merged — NOTE: verify
   #45 state; last turn reported it open): useStickToBottom,
   status vocabulary, Message + a11y, ToolCall, attachments,
   prompt input, branch, Source — models zone, tests, parity
   notes. Small PRs, worktrees.
3. Popover/Select/Tooltip/controls alignment remainder +
   parity backfill; planned slices (focus, nesting,
   handles, transitions, Q6 demos follow-ups).
4. Rewrite readiness report WITH full parity, stop for
   confirmation. Kern untouched.

## Standing constraints (unchanged)
- Release HOLD: no publish/tags/versions. No Kern/token
  deps (read-only grep only). No branches deleted. Open PRs
  only — never merge own PRs. Behind-main races by
  rebase/merge-in, never `--admin`.
- Open owner calls: #54/#55 merges, release timing.
