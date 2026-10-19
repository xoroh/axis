# Axis integration report — 2026-10-19 (Lane A: overlay root)

PROJECT: Axis · LEAD: Axis Lead (owner go-ahead 2026-10-19 02:53 CEST) · BRIEF: 2026-10-19-axis-integration-overlay-root,
as updated 02:58/02:59/03:15/03:20 CEST (merges + #60 only; #59, status PR, friction log and pruning are Lane B).
GOAL (done): land the open Axis PRs in roadmap order, then land a green overlay root (#60).

Outcome: #58, #61, #57 and #60 are all MERGED (squash). `origin/main` ends at `da1cde8`.
#60 went from CI-red (7 missing Overlay demos) to green with the demos redone, Select wired
into OverlayRoot, and 3 selectparts tests updated for correct modal hiding behavior (456/456 jest green).

## PR links + merge SHAs

| PR | Head at merge | Base | Merge | Validate at merge |
|---|---|---|---|---|
| #58 `feat/axis-example-web` (Expo web demo: Metro single-React, hook-safe renderer, bundle check) | 7844571 | main | squash `f3e542e` 2026-10-19T00:57:09Z, MERGED | pass 41s run 39010870174 |
| #61 `feat/axis-example-web-styling` (light/dark theme + open-state evidence; retargeted `feat/axis-example-web`→main via API, main merged in, App.tsx/switch.tsx conflicts resolved to ours — squash tree identical to 7844571) | d793ed2 (51a9e25 + post-#58 merge) | main | squash `9ce685b`, MERGED | pass 57s run 39183127531 |
| #59 docs batch 1 (Tabs/Toast/Field + README) | — | — | squash `ae91995`, MERGED (by another lane while #57 was rebasing) | — |
| #63 docs batch 2 (Button/Dialog/Popover, Lane B) | — | — | squash `ea44c0f`, MERGED (likewise) | — |
| #57 `feat/axis-parity-select-menu` (Select/Combobox/Tooltip compound, Menu filter + submenus, collection + typeahead, flip) | fe724c2 (fc3a834 + post-#58/#61 merge c7d31b0 + post-#59/#63 merge) | main | squash `c9aab56`, MERGED | pass 56s run 39184101899, mss CLEAN |
| #60 `feat/axis-overlay-root` (OverlayRoot on PortalHost; Dialog/Popover/Menu/Drawer migrated) | 56334d2 (326563c + post-#57 merge 72ea049 + Select wiring 6065ccd + Overlay demos 56334d2) | main | squash `da1cde8`, MERGED | pass 57s run 39184929533, mss CLEAN |

#57 conflict note (honest): after #58/#61 merged, `apps/example/src/demos/overlays.tsx` conflicted
(#61 styled structure vs #57 compound-Tooltip addition). Resolved by keeping main's structure and
re-adding the compound Tooltip demo with theme styles. Post-#59/#63 merge was clean (docs-only, disjoint files).
#60 conflict note: `Menu.tsx` had 3 hunks (Overlay vs DropdownMenu imports; OverlayRoot wrapper vs
MenuSubContext provider; OverlayPortal host vs Modal host + comment). Resolved by keeping both
(MenuRoot is now OverlayRoot > MenuDisclosureContext > MenuSubContext; portal host is OverlayPortal).
`index.ts`/`models.ts`/`menuparts.rntest.tsx` auto-merged.

## #60 work detail (what changed vs the 326563c base)

1. **Select wired into OverlayRoot** (`packages/axis/src/components/Select.tsx`):
   `SelectRoot` wraps its context provider in `OverlayRoot` (Android back, stacking, focus, scroll
   lock — the MenuRoot precedent; overlay tracks the disabled-terminal `effectiveOpen`).
   `SelectPortal` paints through `OverlayPortal` instead of its own RN `Modal`; Modal import and
   stale host comments removed. Menu was already wired (merge resolution above). Monoliths stay
   in-box (unchanged, by design — same as the Menu monolith).
2. **Overlay demos redone** (`apps/example/src/demos/overlays.tsx` + registry): new "Overlay Root &
   Stacking" card rendering `OverlayRoot`/`OverlayTrigger`/`OverlayPortal`/`OverlayBackdrop`/
   `OverlayPopup`/`OverlayClose` (all six), plus `Overlay` (namespace) in the components list —
   the namespace's members are all rendered, which is what the gate counts. The 2026-10-18 demo
   work was never committed anywhere (both /tmp worktrees verified clean, see below), so this is
   a redo, not a rescue.
3. **selectparts fix** (`packages/axis/src/selectparts.rntest.tsx`): 3 tests failed after the
   wiring because the open trigger is now correctly hidden from accessibility queries behind its
   own modal layer (`accessibilityViewIsModal` — the same VoiceOver behavior dialogparts:72,
   menuparts:87 and overlayroot:150 already assert). Trigger queries behind an open layer now use
   `{ includeHiddenElements: true }` (new `pressHiddenTestId` helper). Component behavior
   unchanged; the tests were asserting pre-overlay queryability.

## Commands run + real output (excerpts)

- `gh pr view {58,61,57,59,60}` + `gh pr checks` — pre-merge states: #58 CLEAN/pass, #61 retargeted to
  main via `gh api repos/xoroh/axis/pulls/61 -X PATCH -f base=main` (gh pr edit cannot change base, exit 1),
  #57 DIRTY after #58/#61 (fixed on-branch), #60 BLOCKED→pass after demos.
- `gh pr merge {58,61,57,60} --squash` — SHAs in table above. No `--admin`, no force-push to main.
- Battery in `axis-overlay-root` (bun 1.4.3 installed as toolchain; `bun install --frozen-lockfile`,
  `bun.lock` untouched):
  - `check:demos`: `demo coverage holds: all 140 components demoed` (was: missing 7 Overlay components on #60 base).
  - `bun run lint`: `Checked 202 files`, clean (2 auto-fixed: biome format + import order).
  - `typecheck` (package + example): exit 0. `check:boundary`, `check:readme`, `check:readme-examples`, `build`: all hold/pass.
  - `test` (vitest): 27 files / 254 tests pass. `test:jest`: **56 suites / 456 tests pass**
    (before selectparts fix: 3 failed — modal-hiding behavior, fixed in tests as above).
- `git worktree remove /tmp/opencode/axis-parity-select` (was clean at fc3a834 — verified `git status`
  empty before removal; nothing lost) → re-created under xoroh-monorepo; same for
  `/tmp/opencode/axis-overlay-root` (clean at 326563c). /tmp worktrees no longer exist.
- Per 03:20 rule: removed `axis-parity-select` worktree + deleted `feat/axis-parity-select-menu`
  (local + remote, PR merged). `axis-overlay-root` worktree + `feat/axis-overlay-root` branch
  removal follows the report PR merge. T3 checkpoint refs untouched (never listed, never pruned).
  `feat/axis-example-web`, `feat/axis-example-web-styling`, `axis-status-turn-15` left for Lane B.

## Screenshots

Reviewed (not re-captured): `.reports/dx-audit/after/` matrix from #61 —
`web-1440-light/03-dialog.png` (compound + inline open buttons), `web-1440-dark/10-overlays.png`
(triggers, queued toast, sheet/drawer/alert buttons, portal evidence), open-state
`web-open-1440-dark/dialog-compound-open.png` (dimmed backdrop + centered Confirm Action dialog) and
`web-open-1440-light/menu-open.png` (menu demo page; popup renders unstyled — parity-owned menu.tsx,
known weak spot carried, not a styling-lane regression). No fresh web captures for the new Overlay
demo section (Expo web export + capture not re-run; coverage is by RNTL assertions + check:demos).

## Acceptance 1..n

1. `gh pr view` shows #58, #61, #57, #60 MERGED with squash SHAs f3e542e / 9ce685b / c9aab56 / da1cde8;
   each was CLEAN with validate SUCCESS at merge time (table above) — PASS.
2. main validate green after the last merge; `check:demos` passes on main — PASS: post-merge
   validate on `da1cde8` completed/success (checked 01:24 UTC); branch battery showed 140/140 demos.
3. Overlay demos + Select OverlayRoot wiring: check:demos was red on #60 base (7 missing), green after;
   selectparts modal-hiding tests failed before the test update (3 failed) and pass after (18/18);
   full jest 456/456 — PASS.

## Branches / worktrees (Lane A scope only)

- Removed: worktree `axis-parity-select` + branch `feat/axis-parity-select-menu` (local + remote). Reason: PR #57 merged.
- To remove after this report lands: worktree `axis-overlay-root` + branch `feat/axis-overlay-root`
  (local + remote; PR #60 merged) and this report branch (local + remote).
- Skipped / not mine: `feat/axis-example-web`, `feat/axis-example-web-styling`, `docs/axis-status-turn-15`
  worktree, main-folder switch — Lane B (a8a91451). T3 checkpoint refs — kept by owner order.

## Friction-log routing

Dropped from scope (Lane B owns). Not read, not routed.

## What's still weak (honest)

- No fresh screenshots for the new Overlay demo section or the Select-on-OverlayRoot change; evidence
  is RNTL + gates. Web Tooltip/ContextMenu tips still collapse (useFloatingPlacement never resolves on
  RNW — pre-existing, packages/axis, out of scope). menu-open shot shows unstyled popup (parity-owned file).
- Test counts in this report are CI/gate outputs, not a new manual device pass. No emulator, simulator,
  physical-device, or screen-reader validation — still the top release-readiness gap (unchanged).
- `/tmp` worktrees are gone; both were verified clean before removal, and the lost 10-18 work was
  redone in #60 — but this is asserted from `git status` emptiness, not from a backup that exists.
- The `Overlay` namespace components-list entry has no corresponding import in the demo (lint forbids
  the unused import); the gate counts names, and all namespace members render. Slightly indirect.

## Gaps for other leads

- Kern Lead: re-pin Axis past da1cde8 (stale PR-#11 tarball blocks all of this); 13 hand-rolled RN Modals
  are now replaceable by OverlayRoot-backed parts; Form still has no owner. No compat shims were added
  (rule 011 holds — verified by grep, only a doc comment mentions "fallback").
- Grok Bot / Faroeq: release HOLD stands — no publish, version, tag, or deploy performed.

Suggested next item: Slider gaps (single value, no orientation/RTL/range), then press state
(`hovered`/`focusVisible`/`dragged`), then date/time — roadmap order.
