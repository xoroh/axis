# Report — 2026-10-19-axis-docs-batch4

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-19-axis-docs-batch4
Branch: `docs/axis-docs-batch4` (worktree `~/Desktop/Business/xoroh-monorepo/axis-docs4`, from `origin/main` @ `a9e0465` = #71 merge).
Prior steps this thread: marked #71 ready (mergeStateStatus CLEAN, validate SUCCESS), squash-merged (no --admin, no force-push), removed `axis-docs3` worktree + local/remote batch-3 branch, `main` synced to `a9e0465` (worktree list + clean status verified: only `main` + the other lane's `axis-webplace` remain). No subagent sessions used (in-thread extraction).

## Outcome

Done. `alert-dialog.md`, `drawer.md`, `sheet.md`, `portal.md`
rewritten to Base UI level from current source; `dialog.md` and
`popover.md` gained Overlay-hosting sections (OverlayRoot,
PortalHost, `useModal` opt-in, `modal` defaults) and lost their
stale bare-`Modal`-host language. Sheet documented as NOT on
OverlayRoot (own `Modal` host) with the why; AlertDialog
(forced blocking via `DialogRoot`) and Drawer (always modal)
documented on OverlayRoot. README index untouched
(`check:readme` holds at 48 rows — titles unchanged). No
`packages/axis/src/**` or `apps/example/**` changes. No
screenshots (no target doc uses them).

## PR

- https://github.com/xoroh/axis/pull/72 (draft; CI `validate` pending at write time — merge only on green)

## Commands run (real output, worktree `axis-docs4`)

- `git worktree add … axis-docs4 -b docs/axis-docs-batch4 origin/main` → HEAD `a9e0465`.
- `bun install --frozen-lockfile` → `893 packages installed`.
- `node scripts/check-readme.mjs` → `holds: 48 component notes (unique, sourced), README index in sync, no stray sections`.
- `node scripts/check-readme-examples.mjs` → `holds: 55 tsx blocks parse, axis imports resolve, component props exist` (was 43 — 12 new examples all pass).
- `bun run lint` → `Checked 202 files … No fixes applied.`
- `bun run check:demos` (apps/example) → `demo coverage holds: all 140 components demoed` + `web bundle assertions hold`.
- `git push -u origin docs/axis-docs-batch4` → new branch pushed.
- `gh pr create --draft` → PR #72.

## Acceptance (batch-4 brief)

1. Six docs at Base UI structure (intro, Source of truth,
   Install, Anatomy, Props per part with types/defaults from
   source, Examples, Accessibility, Composition) — PASS. All
   prop tables verified against current source in-thread
   (AlertDialog 118 lines, Drawer 216, Sheet 397 fully read;
   Dialog/Popover tables reconfirmed against `Dialog.tsx`
   monolith OverlayRoot block, `DialogRoot`/`PopoverRoot`
   `modal` defaults, parity rows §§ Dialog/Popover/Portal/gaps).
   12 new examples parse under check:readme-examples.
2. Dialog/popover gap closed — PASS. Both now explain
   OverlayRoot/OverlayPortal/PortalHost, the `useModal` opt-in
   (OverlayRoot-level, no family part takes it), and `modal`
   defaults (Dialog `true` / monolith always modal; Popover
   `false` + inline monolith). AlertDialog/Drawer on the stack
   documented; Sheet + Tooltip documented off it with reasons.
3. Gates — PASS locally, CI pending. `lint`, `check:readme`,
   `check:readme-examples`, `check:demos` all green (outputs
   above). CI `validate` on PR #72 was still pending when this
   report was written — merge only when green.

## What's still weak (honest)

- `BASE_UI_PARITY.md` still says `DialogPortal`/`PopoverPortal`
  are "RN `Modal` host(s)" — stale post-#60 (out of scope here;
  listed below). The six component docs are now correct; the
  parity record lags them.
- No fresh screenshots (none required — no target doc uses them).
- No device/simulator or screen-reader pass ever (program-level gap).

## Code / code-adjacent bugs found (listed, not fixed — out of scope)

1. **`docs/BASE_UI_PARITY.md` stale portal-host rows (post-#60).**
   § Dialog row: `DialogPortal` = "RN `Modal` host"; § Popover
   row: `PopoverPortal` = "RN `Modal` host when modal". Both now
   paint via `OverlayPortal` at `PortalHost` (Modal only via the
   `useModal` opt-in on direct `Overlay` compositions) —
   `Dialog.tsx:188-219,448-465`, `Popover.tsx:516-531,594-611`.
   (#68 fixed the Select/PortalHost rows; these two were missed.)
   Fix = reword two cells; docs-only, any docs lane can take it.
2. **`DialogRoot` pointless `void modal;` (`Dialog.tsx:407-452`).**
   Destructures `modal = true`, then `void modal;` (line 410),
   then passes `modal={modal}` to `OverlayRoot` (line 452). The
   `void` reads as "intentionally unused" while the value IS
   used two statements later — harmless at runtime, misleading to
   the next reader. Nit for the owning thread.
3. Tooltip monolith `placement` default (documented `"top"`,
   effective `"bottom"`) — NOT re-listed as new: already routed
   to the web-placement lane per batch-4 brief.

## Suggested next docs batch

1. Parity-record cleanup: fix the two stale portal-host cells
   (§§ Dialog, Popover) + reword the Portal § host-side cell if
   needed — 10-minute docs PR, unblocks "parity record matches main".
2. Remaining thin overlay-adjacent docs per `latest.md` item 2
   (Accordion, Avatar, Checkbox, Meter, Progress, NumberField,
   ContextMenu-splits are done here; Form still has no owner).
3. Slider gaps (Kern P1-1), then press state (P1-5) docs to match.
