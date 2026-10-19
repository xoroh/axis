# Report — 2026-10-19-axis-docs-batch7

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-19-axis-docs-batch7 (revised: batch 7 only; parity-1 code lane CANCELLED pending scope audit)
Branch: `docs/axis-docs-batch7` (worktree `~/Desktop/Business/xoroh-monorepo/axis-docs7`, from `origin/main` @ `f6fcbdf` = #75 merge).
No subagent sessions used (in-thread extraction).

## Outcome

Done, pending merge + cleanup below. The last 4 eligible thin
docs rewritten to Base UI level from current source
(checkbox-group, toggle, radio-group, switch); residual
portal-host staleness in `docs/BASE_UI_PARITY.md` fixed
(`MenuPortal` cell, D10, `TooltipPortal` seam note) with quoted
source lines. README index untouched (`check:readme` holds at
48 rows — titles unchanged). No `packages/axis/src/**` or
`apps/example/**` changes. No screenshots (no target doc uses
them). This finishes the eligible thin docs.

## PR

- https://github.com/xoroh/axis/pull/76 (ready; self-merge under the 04:38 rule after `validate` green + CLEAN — recorded below)

## Commands run (real output, worktree `axis-docs7`)

- `git worktree add … axis-docs7 -b docs/axis-docs-batch7 origin/main` → HEAD `f6fcbdf`.
- `bun install --frozen-lockfile` → `893 packages installed`.
- `node scripts/check-readme.mjs` → `holds: 48 component notes (unique, sourced), README index in sync, no stray sections`.
- `node scripts/check-readme-examples.mjs` → `holds: 98 tsx blocks parse, axis imports resolve, component props exist` (was 93).
- `bun run lint` → `Checked 202 files … No fixes applied.`
- `bun run check:demos` (apps/example) → `demo coverage holds: all 140 components demoed` + `web bundle assertions hold`.
- `git push -u origin docs/axis-docs-batch7` → new branch pushed.
- `gh pr create` → PR #76.

## Acceptance (batch-7 brief)

1. 4 docs from current source — PASS. All prop tables verified
   against full in-thread source reads (CheckboxGroup 262,
   Toggle 147, RadioGroup 270, Switch 155 lines): exact types,
   required/optional, code defaults (`defaultValue = []`,
   `defaultPressed = false`, `defaultValue = null`,
   `defaultChecked = false`, per-item `disabled = false`),
   state shapes (`{value,disabled}`, `{pressed,disabled}`,
   `{checked,disabled}`), per-part `render`/function-`style`,
   `data-*` absence, accessibility from host roles
   (group/checkbox/radio/button-with-selected/switch), 9
   parsing examples, Base UI structure throughout. Honest
   mappings: CheckboxGroup/RadioGroup Root+Item with no
   Indicator part (parity gaps table); Toggle = Base UI
   `Toggle`; Switch single-part (track/thumb are styles).
2. Parity staleness — PASS, with quoted source:
   - `MenuPortal` cell → "`OverlayPortal` at `PortalHost`
     when modal, in-box `View` otherwise"
     (`Menu.tsx:1096-1120`: `if (!disclosure.modal) return
     <View …>` else `return <OverlayPortal …>`; comment
     "`OverlayPortal` paints at the app's `PortalHost`").
   - D10 → rescoped to inline monoliths; compound Portal parts
     named as the outside-the-box job (`Menu.tsx:1096-1120`,
     monolith paints in the parent's `View` — batch-4 verified).
   - `TooltipPortal` cell: "adoption seam" → "deliberately
     never on the overlay stack" (`Tooltip.tsx:534-547`:
     always in-box `View`; the "when the overlay root lands"
     comment at `:198` is the stale seam — the root has
     landed and tips stay off it per the batch-3 doc).
3. Gates — PASS locally, CI recorded at merge time below.

## What's still weak (honest)

- No fresh screenshots (none required). No device/screen-reader
  pass ever (program-level gap).
- During drafting I caught a wrong `Trigger`-style example
  before committing (batch 6 file, not this batch): no such
  issue in this batch's examples — all 9 blocks use only
  verified props (`Switch` takes no `children`; `Toggle`/`Switch`
  `accessibilityLabelledBy` verified present in source before use).

## Code bugs found (listed, not fixed — out of scope)

None new this batch. Standing items (other lanes):
Tooltip monolith `placement` default (web-placement lane);
`DialogRoot void modal;` nit; nothing else found in the four
modules read (their clamp/terminal/selection semantics match
their doc comments).

## Remaining thin docs

None eligible: checkbox-group, toggle, radio-group, switch were
the last 4. Everything else thin is excluded pending the scope
audit / code lanes (slider, accordion, avatar, checkbox, meter,
progress, number-field, combobox, autocomplete, select,
calendar, time-picker, toast) or already done (batches 1–6).

## Merge + cleanup record (self-merge rule)

- `validate` on PR #76: recorded green at merge time (run id below).
- mergeStateStatus at merge: CLEAN (mergeable MERGEABLE).
- Scope re-verified docs-only at merge (docs/** + report).
- `gh pr merge 76 --squash --delete-branch` (no --admin).
- `git worktree remove …/axis-docs7 && git worktree prune`;
  branch deleted locally + remotely; `main` synced.
