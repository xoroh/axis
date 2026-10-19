# Axis final review — 2026-10-19 (independent verification)

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-19-axis-final-review
Reviewer position: took no part in the cleanup; read-only review from
`~/Desktop/Business/xoroh-monorepo/axis` (on `main`), fixes from the
single worktree `axis-review`, one PR per fix.
Inputs: `.reports/2026-10-19-axis-cleanup.md`,
`.reports/2026-10-19-axis-integration-overlay-root.md`,
`.reports/latest.md`, the Axis section of `.team/board.md`,
`docs/VISION.md`, `docs/decisions/` (001–011), `docs/IDEAS.md`.

## Outcome

**Cleanup verified DONE and correct, with 3 real defects found and
fixed.** The merge/drop calls in the cleanup report (PRs #57–#66,
closed #62, deleted branches, worktrees, `.reports`, `vendor/`)
were all judged right; every merged PR's content is on `main`;
nothing dropped was a real improvement. `main` builds and passes
every gate (see real output below). `latest.md` and the board's
Axis section were stale/duplicated — fixed via PRs below.
End state after this report merges and the worktree is removed:
exactly the `axis` folder on `main`, synced with `origin/main`.

Fix PRs (all squash-merged, CLEAN + green, no `--admin`,
no force-push to `main`):

| PR | Fix | Merge |
|---|---|---|
| #67 `docs(axis): refresh latest.md` | Finding 1 | `38916c5` |
| #68 `docs(axis): fix stale post-#57/#60 parity rows` | Finding 2 | `d06957a` |
| #69 `fix(axis): pack-vendor pre-flight checks` | Finding 3 | `a417eac` |
| #70 this report | Record | (last to merge) |

## Findings (severity + disposition)

1. **Medium — `latest.md` duplicated and stale (fixed, #67).**
   Carried the intro paragraph twice, two overlapping Done sections
   (`0638a61` + `ea44c0f`, older one listed second), stale blockers
   ("#57 + #60 open", "(#57 open + after)"), an "Open PRs" table
   listing merged #64 as "this PR / last to merge" with no mention
   of #65/#66, a stale tree-state note, and "~46" docs (actual: 47
   files in `docs/components/`). Rewrote at `81437e9`: verified
   Done items, full PR table #58–#66, remaining program in roadmap
   order, current NOT READY blockers. No content lost.
2. **Medium — `BASE_UI_PARITY.md` kept 6 pre-#57/#60 rows
   (fixed, #68).** `SelectPortal` as own-`Modal` host (now
   `OverlayPortal`; `Modal` only via `useModal` opt-in);
   `typeahead` "no part consumes it" (consumed by Select + Menu
   key handling); gaps-table row "Combobox / Select needs
   `collection` transfer + typeahead design" (transfer landed and
   is consumed — narrowed to Combobox/Autocomplete wiring
   pending); `Autocomplete` blocker reworded the same way;
   gaps-table `Tooltip` monolith row (all 7 compound parts exist —
   row deleted, per-part table stands); `PortalHost` "each
   overlay's own `Modal`" (presentation is each `OverlayRoot`'s
   own). Each verified against `Select.tsx`/`Tooltip.tsx`/
   `Menu.tsx`/`Overlay.tsx`/`index.ts` before editing.
3. **Low-medium — `pack-vendor` crashed cryptically without
   deps/tools (fixed, #69).** Kern friction entry 1, explicit
   backlog in `latest.md`: a clean worktree died inside the build
   with `tsup: command not found`, and any machine without `npm`
   died with an `ENOENT` stack trace (reproduced here). Added a
   pre-flight naming the missing tool (`git`/`bun`/`npm`) or
   telling the user to run `bun install --frozen-lockfile` first.
   All four failure modes observed returning the clean hint;
   happy path untouched; biome clean. Entry 2 (`ToastViewport`
   style typing) deliberately left as backlog: per ADR 007 the
   fix belongs at the component layer, not in the neutral model
   (see release gaps / next items).
4. **Informational (not a defect) — no `npm` on this machine.**
   `check:publish` (`attw --pack` → `npm pack`) and the pack step
   of `pack-vendor` cannot run locally. `publint` itself passes
   (one `repository.url` suggestion only); packability proven via
   `bun pm pack --dry-run` (12 files, 1.15 MB unpacked); CI
   (which has npm) is green on the same SHAs. Environment gap,
   recorded so nobody re-reports it.

No-fix notes: ADR 010's status line ("no models built yet") is
stale (chat models exist under `src/`) — left for the owner, ADRs
are decision records, not status pages. The "review-58
byte-identical" deletion is not re-verifiable post-hoc (branch
gone); accepted on the report's `diff` evidence, low risk.
"#57 parity (Select/Combobox/Tooltip…)" PR-title shorthand
overstates Combobox (monolith-only) — titles are immutable, and
`latest.md` + parity doc now state it accurately.

## Acceptance 1 — clean tree (real output)

Captured on the `axis` checkout after `git fetch --prune`
(`axis-review` worktree + this report branch are the only
appendix; removed right after this PR merges):

- `git branch -a` → `* main`, `remotes/origin/main` (+ the
  worktree-bound report branch, deleted post-merge). No other
  local or remote branches. Remote via API
  (`gh api repos/xoroh/axis/branches`): only `main`.
- `git worktree list` → `/home/.../xoroh-monorepo/axis @ <main>`
  plus `axis-review` (removed post-merge). No `/tmp` worktrees.
- `git stash list` → empty. `git status --porcelain` → empty
  (no untracked files outside `.gitignore`).
- `gh pr list --state open` → `[]` (after #70 merges; #67/#68/#69
  merged before it).
- Stray clones: `/tmp/axis-scripts`, `/tmp/axislead`,
  `/tmp/axistgz` are scratch note/script dirs (no `.git`);
  `~/.t3/scratch` holds no axis checkout; the only other
  "axis" hits are mailbox text and handoff notes, not clones.
- `refs/t3/orchestration-v2/*`: 72 refs kept, never pruned, not
  counted against clean (owner 03:15 CEST note).

## Acceptance 2 — merge/drop calls (all confirmed)

| Item | Call | Verification |
|---|---|---|
| #58 web demo, #61 styling | MERGE (f3e542e, 9ce685b) | On main; demo app + theme + bundle scripts present |
| #59 docs batch 1, #63 docs batch 2 | MERGE (ae91995, ea44c0f) | 6 docs with Base-UI-level prop tables on main |
| #62 docs batch 2 (first attempt) | CLOSE, supersede via #63 | #62 head fetched (`pull/62/head`): 3 docs commits byte-identical to #63 merge (`git diff` empty); only the screenshot commit dropped per batch-1 precedent. Nothing lost |
| #57 parity, #60 overlay root | MERGE (c9aab56, da1cde8) | Compound parts, collection/typeahead, OverlayRoot wiring all present on main (table below) |
| #64 status, #65 integration report, #66 verification | MERGE | On main; #66 touches only the cleanup report itself |
| #67/#68/#69 (this review) | MERGE | CLEAN + green each; on main |
| IN-MAIN remotes, gone-remote locals, `review-58`, `feat/axis-example-web{,-styling}` | DROP/delete | Remote is only `main`; end-state matches. Tips not re-verifiable post-hoc — accepted on merge ancestry + green main |
| `docs/axis-release-ready`, `status-turn-1/-13` (PRs #20/#16/#52 CLOSED) | DROP | Closed on GitHub; content superseded by `latest.md` + `axis-status-2026-10-19.md` |
| `axis-docs-batch1`, `axis-docs-batch2`, `axis-vendor-clean` worktrees | REMOVE | Gone; tarball regenerable (`bun pm pack` proven) |
| `.reports` PNG dirs (batch-1 shots, dx-audit flats) | DROP | Gone; useful reports ride #64; evidence shots tracked under `dx-audit/after/` |
| `.team/archive/axis-2026-10-19` | REMOVE (no patch archive) | Absent; triage stayed MERGE-or-DROP |

Post-#60 props check re-confirmed: `git show da1cde8` touches
17 files, zero `*Props` line changes in `Dialog.tsx`/`Popover.tsx`
(all new `*Props` are `Overlay*Props`) — #63 tables stand.

## Acceptance 3 — gates (real output, main, local bun 1.4.3)

- `bun install --frozen-lockfile` → `Checked 897 installs …
  (no changes)`. `bun test tests/` → `2 pass, 0 fail`.
- `bun run lint` → `Checked 202 files … No fixes applied.`
- `--filter @xoroh/axis typecheck` → exit 0.
- `--filter @xoroh/axis test` (vitest) → `27 passed`, `254 passed`.
- `--filter @xoroh/axis test:jest` → `56 suites / 456 tests pass`.
- `check:boundary` → `boundary holds: models pure; components
  RN-host-only; internals unexported` + mutation suite `26 pass`.
- `check:readme` → `47 component notes (unique, sourced)`.
- `check:readme-examples` → `28 tsx blocks parse … props exist`.
- `build` → DTS success (`index` 203.75 KB, `models` 68.59 KB).
- `--filter @xoroh/axis-example typecheck` → exit 0;
  `check:demos` → `all 140 components demoed` + `web bundle
  assertions hold: web deps present, Metro single-React pinned,
  hooks safe`.
- `check:publish` → publint passes (1 `repository.url`
  suggestion); `attw --pack` blocked by missing `npm` locally —
  CI green on the same tree (finding 4).
- `pack-vendor` → pre-checks added (#69); full pack needs `npm`
  (finding 4); `bun pm pack --dry-run` packs 12 files / 1.15 MB.
- CI (`validate`, bun 1.3.8): green on every push
  `da1cde8 → 0638a61 → 2331a27 → 81437e9 → 38916c5 → d06957a →
  a417eac` (success each; `a417eac` in progress at capture,
  PR #69's own run green before merge).

## Acceptance 4 — plan and board

`latest.md` (post-#67) matches `main`: every Done item
spot-checked in code (demos, theme, 6 docs, compound parts,
filter/submenu parts, collection/typeahead files, OverlayRoot ×
5 families, reports). Board Axis section updated to this review
in the same heartbeat. Remaining program is the roadmap order:
docs batch 3 → parity leftovers (Select `multiple`/
`alignItemWithTrigger`/scroll arrows; Combobox/Autocomplete onto
collection/typeahead; Accordion/Avatar/Checkbox/Meter/Progress/
NumberField/ContextMenu/Drawer splits; Form, no owner) → Slider
→ press state → date/time → Kern friction backlogs → release.

## Base UI parity table (observed on main)

| Family | State | Evidence |
|---|---|---|
| Select | Compound shipped (Root/Trigger/Value/Portal/Backdrop/Positioner/Popup/Arrow/Item/ItemText/ItemIndicator/Group/GroupLabel/Separator) + monolith; on OverlayRoot; typeahead consumed | `Select.tsx`, `index.ts:368-403` |
| Tooltip | Compound shipped (Provider/Root/Trigger/Portal/Positioner/Popup/Arrow) + monolith; deliberately NOT on OverlayRoot (non-modal hint) | `Tooltip.tsx:362-674` |
| Combobox | Monolith only (filtering via shared `collection` match); compound deferred | `Combobox.tsx:200` |
| Autocomplete | Monolith only; wiring onto `collection` pending | single-file component |
| Menu (+Dropdown) | Filter (Input/Clear/Empty) + submenus (SubmenuRoot/Trigger/Content) on OverlayRoot | `Menu.tsx:2098-2359` |
| Dialog / Popover / Drawer | Compound + monoliths on OverlayRoot/OverlayPortal | `Dialog.tsx:188`, `Popover.tsx:516`, `Drawer.tsx:185` |
| Overlay | Root/Trigger/Portal/Backdrop/Popup/Close (+namespace) shipped; `useModal` opt-in | `Overlay.tsx:231,492` |
| Toast | Provider + queue + Viewport + monolith; aligned | — |
| Tabs / Field / Button | Docs at Base UI level; implementation aligned | docs batch 1+2 |
| collection / typeahead | Models shipped, exported, consumed (menu filter, select lookup, combobox filtering) | `collection.ts`, `typeahead.ts`, `models.ts:182-184` |
| ContextMenu / NumberField / Slider / OTP / Meter / Progress / groups | Single-part; recorded gaps, no surprise | gaps table (post-#68) |
| Form / ScrollArea / PreviewCard | No export (`na-native` / no owner) | gaps table |

## What's still weak (honest)

- No fresh screenshots for the #60 Overlay demo section or the
  Select-on-OverlayRoot change (RNTL + gates only).
- Web Tooltip/ContextMenu tips still collapse
  (`useFloatingPlacement` never resolves on RNW — pre-existing).
- `menu-open` evidence shot shows an unstyled popup
  (parity-owned file, known).
- No emulator/simulator/device/screen-reader pass ever — top gap.
- `/tmp` worktrees removed on `git status`-emptiness only; the
  lost 10-18 work was redone, not rescued (nothing contradicts
  this, but no backup exists to prove it).

## Release-readiness gaps (0.1.0 with Kern): NOT READY

In order: 41 of 47 component docs thin; no device or
screen-reader pass; dependency advisories unverified; Kern pins
a stale Axis tarball (re-vendor past #60 — script ready, #69);
npm trusted publishing held (no versions/tags/publish without
explicit authorization). HOLD stands. No publish, version bump,
tag, deploy, DNS, or spending performed in this review.

## Suggested next items (in order)

1. Docs batch 3: Select/Menu/Tooltip/Overlay (families #57/#60
   changed; authors must read current code, not the old rows).
2. Parity leftovers per `latest.md` item 2 (Form needs an owner).
3. Slider gaps (Kern P1-1), then press state (P1-5), then
   date/time (P1-2/P1-3).
4. Friction entry 2 at the component layer (ADR 007 placement);
   re-vendor Kern past #60; advisories; device/a11y pass
   (needs Faroeq's phone).
