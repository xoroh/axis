# Axis cleanup — Lane B triage report (2026-10-19)

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-19-axis-cleanup
GOAL: Zero open PRs, only `main` on the remote, clean tree — every
unmerged branch, worktree change, stash and untracked file triaged
MERGE or DROP, no patch archive.
Outcome: batch 2 MERGED (#63), docs batch 1 MERGED (#59); all stale
branches deleted; untracked triaged (useful reports ride the status
PR, old shots deleted); no stashes; no archive folder. Status PR
merges LAST, after Lane A's #57/#60.

## Triage table (MERGE or DROP + one-line reason)

### Branches — MERGE
| Item | Verdict | Reason |
|---|---|---|
| `docs/axis-docs-batch1-select-tabs-toast-field` (PR #59) | MERGE (ae91995) | Batch 1 docs; updated from main, CLEAN + validate SUCCESS, squash-merged by lead. |
| `docs/axis-docs-batch2-button-dialog-popover` (PR #63; supersedes closed #62) | MERGE (ea44c0f) | Batch 2 triaged solid on content (#59 structure, line-matched prop tables, gates green); screenshot commit dropped. CLEAN + validate SUCCESS, squash-merged. |
| `feat/axis-parity-select-menu` (PR #57) | MERGE (Lane A) | Parity work; Lane A merges. Not touched by this lane. |
| `feat/axis-overlay-root` (PR #60) | MERGE (Lane A) | Overlay root; Lane A merges after #57. Not touched by this lane. |
| `docs/axis-status-turn-15` (status PR) | MERGE (this PR, LAST) | Carries latest.md refresh + useful reports + this file. Merges only after #60. |

### Branches — DROP (remote + local deleted)
| Item | Reason |
|---|---|
| IN-MAIN remotes (apps/axis-example, chore/axis-no-compat, chore/axis-release-flow, docs quality/readme/split/refs/status-turn-{3,5,6,7,8,9,10,11,12}, feature baseui-dialog/menu/popover, batch-j/k/l/m, batch-n1/n2/n3, drawer, refs, switch-checked) | Fully merged — tips are ancestors of origin/main. |
| `docs/axis-release-ready`, `docs/axis-status-turn-1`, `docs/axis-status-turn-13` | PRs #20/#16/#52 CLOSED unmerged; stale status reports, superseded by latest.md + axis-status-2026-10-19.md. |
| `feature/axis-menu-parts`, `feature/axis-menu-selectable` | PRs #33/#37 MERGED (squash); content in main. |
| 11 gone-remote locals (example-demos, pack-vendor, readme-examples, quality-leftover, status-turn-14, research-reports, vision-and-decisions, ai-chat-models, baseui-alignment, models-zone, scope) | Each has a MERGED PR (#41–#56 range); content in main. |
| `chore/axis-release-flow`, `feature/axis-batch-m` (locals) | Ancestors of origin/main. |
| `feature/axis-menu-selectable` (local b700ace) | Contained in the deleted remote; PR #37 MERGED. |
| `review-58` (local-only e48d1ef) | Byte-identical metro/bundle files to main — superseded by #58. |
| `feat/axis-example-web`, `feat/axis-example-web-styling` | #58/#61 squash-merged; deleted at the very end after Lane A done and main checked out. |

### Worktrees
| Item | Verdict | Reason |
|---|---|---|
| `axis-docs-batch1`, `axis-docs-batch2` | Removed | Branches merged; trees clean, nothing unpushed. |
| `axis-vendor-clean` (detached 82c3179, untracked `vendor/axis-82c3179.tgz` 180K) | Removed | Stale regenerable tarball; nothing references the path. |
| `axis-status-turn-15` | KEEP until end | Hosts this status PR. |
| `/tmp/opencode/axis-overlay-root`, `xoroh-monorepo/axis-parity-select` | LEAVE | Lane A's (#60/#57). Untouched. |

### Stash / archive
- `git stash list`: empty — nothing to triage.
- `.team/archive/axis-2026-10-19` (4 batch-2 patches + INDEX.md):
  created during parking, then REMOVED per 02:59 correction (no
  patch archive; MERGE-or-DROP only). Docs restored via `git am`
  onto origin/main → PR #63 → merged; screenshot commit dropped.

### Untracked files (main checkout)
| Item | Verdict | Reason |
|---|---|---|
| `.reports/axis-status-2026-10-19.md`, `2026-10-16-axis-docs-base-ui-level.md`, `2026-10-17-axis-web-demo-p0.md`, `axis-dx-audit.md`, `kern-needs-from-axis.md` | MERGE via status PR | Useful reports, explicitly named. |
| `.reports/2026-10-19-axis-cleanup.md` (this file) | MERGE via status PR | Required final report. |
| `.reports/axis-docs-batch1-shots/` (12 PNGs) | DROP (deleted) | Shots served verification; batch-1 precedent keeps shots out of main. |
| `.reports/dx-audit/*.png` (16 flat PNGs) | DROP (deleted) | Old demo shots, superseded by #61 + tracked `dx-audit/after/`. |

## Commands run (real output)
- `git fetch --prune origin` → pruned 40+ deleted remote refs; origin/main advanced 82c3179 → 9ce685b (#58, #61) → ae91995 (#59) → ea44c0f (#63).
- Batch 2 restore: `git worktree add … origin/main` + `git am 0001–0003` (0004 screenshots dropped); `check:readme` holds (47 notes); `check:readme-examples` holds (18 blocks) — after `bun install` in the fresh worktree (first run failed 127 → missing node_modules, fixed by install; no lockfile change).
- #62 closed-as-deferred → `gh pr reopen` rejected (branch was deleted) → fresh PR #63 → comment cross-link on #62. Archive folder removed (`rm -rf`, verified gone).
- #59: merged origin/main into branch (clean), pushed; validate pass 50s; CLEAN + MERGEABLE → `gh pr merge --squash` → ae91995.
- #63: BEHIND after #59 → merged origin/main, pushed; validate pass 48s; CLEAN + MERGEABLE → squash-merged → ea44c0f.
- Branch deletions: `git push origin --delete` × 38 refs (all confirmed `[deleted]`); local `git branch -D` for all DROP locals.
- review-58 check: `diff` of metro.config.js + check-web-bundle.mjs vs origin/main → identical → deleted.
- Remote after deletes: only `main`, `feat/axis-example-web{,-styling}`, `feat/axis-overlay-root`, `feat/axis-parity-select-menu`.

## Verification (FINAL — appended when status PR merges)
`gh pr list` (empty) · `git branch -a` · `git worktree list` ·
`git stash list` · `git status` — see below.

- `gh pr list --state open` → (final output appended post-#60)
