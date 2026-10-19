# Report — 2026-10-19-axis-docs-batch6

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-19-axis-docs-batch6
Branch: `docs/axis-docs-batch6` (worktree `~/Desktop/Business/xoroh-monorepo/axis-docs6`, from `origin/main` @ `c858578` = #74 merge).
Prior step this thread: merged #74 under the 04:38 CEST
self-merge rule (diff verified docs-only: 1 parity + 8 docs +
report; `validate` SUCCESS, mergeStateStatus CLEAN;
`--squash --delete-branch`, no --admin), removed `axis-docs5`
worktree (`git worktree remove` + `prune`), deleted the
batch-5 branch locally and remotely, synced `main` to
`c858578`. Post-cleanup state pasted below. No subagent
sessions used (in-thread extraction).

Post-#74-cleanup state (main folder):

```
--- worktree list ---
/home/novexo/Desktop/Business/xoroh-monorepo/axis           c858578 [main]
/home/novexo/Desktop/Business/xoroh-monorepo/axis-webplace  16f96d7 [fix/axis-web-placement]
--- status ---
## main...origin/main
```

(Only `main` + the other lane's `axis-webplace`, untouched;
`main` clean and in sync.)

## Outcome

Done, pending merge + cleanup below. The next 8 thinnest
eligible docs rewritten to Base UI level from current source:
text, toggle-group, toolbar, input, navigation-menu, textarea,
trigger, menubar. README index untouched (`check:readme` holds
at 48 rows — titles unchanged). No `packages/axis/src/**` or
`apps/example/**` changes. No screenshots (no target doc uses
them).

## PR

- https://github.com/xoroh/axis/pull/75 (ready; self-merge under the 04:38 rule after `validate` green + CLEAN — recorded below)

## Commands run (real output, worktree `axis-docs6`)

- `git worktree add … axis-docs6 -b docs/axis-docs-batch6 origin/main` → HEAD `c858578`.
- `bun install --frozen-lockfile` → `893 packages installed`.
- `node scripts/check-readme.mjs` → `holds: 48 component notes (unique, sourced), README index in sync, no stray sections`.
- `node scripts/check-readme-examples.mjs` → `holds: 93 tsx blocks parse, axis imports resolve, component props exist` (was 73 — 20 new examples all pass).
- `bun run lint` → `Checked 202 files … No fixes applied.`
- `bun run check:demos` (apps/example) → `demo coverage holds: all 140 components demoed` + `web bundle assertions hold`.
- `git push -u origin docs/axis-docs-batch6` → new branch pushed.
- `gh pr create` → PR #75.

## Acceptance (batch-6 brief)

1. 8 docs from current source — PASS. All prop tables
   verified against full in-thread source reads (Text 106,
   ToggleGroup 266, Toolbar 139, Input 133, NavigationMenu 423,
   Textarea 147, Trigger 134, Menubar 215 lines): exact types,
   required/optional, code defaults
   (`defaultValue = []`/`""`, `secureTextEntry = false`,
   `editable = true`, `numberOfLines = 3`, `autoGrow = false`,
   `defaultOpenValue = null`, `orientation = "horizontal"` …),
   state shapes, render/static-style composition per part,
   `data-*` absence, accessibility from host props, 20 parsing
   examples, Base UI structure throughout. Base UI mapping
   honest per family (ToggleGroup Root/Item, Toolbar Root-only,
   Menubar Root + DropdownMenu-composed Menu, Trigger
   explicitly Axis-only anti-Button).
2. Same exclusions/scope as batch 5 — PASS. None of the 8 is
   in the excluded set; batches 1–5 untouched; diff is
   docs-only (verified before PR creation).
3. Gates — PASS locally, CI recorded at merge time below.

## What's still weak (honest)

- During drafting I caught a wrong `Trigger` example
  (`accessibilityRole` prop does not exist on `TriggerProps` —
  the host receives no role by design) before running gates;
  replaced with a `render`-element role assertion that the
  contract supports and the gate accepts. Same verify-first
  lesson as batch 5's `Label` catch.
- No fresh screenshots (none required). No device/screen-reader
  pass ever (program-level gap).

## Remaining thin docs (eligible, by line count)

After batch 6, the thinnest not-yet-done, non-excluded docs are:
checkbox-group (28), toggle (41), radio-group (51), switch (72).
Excluded pending code changes (do not touch): slider,
accordion, avatar, checkbox, meter, progress, number-field,
combobox, autocomplete, select, calendar, time-picker, toast.

Suggested batch 7: checkbox-group, toggle, radio-group, switch
(the last 4 eligible thins) + any parity follow-ups.

## Code bugs found (listed, not fixed — out of scope)

None new this batch. Previously logged (not repeated as new):
Tooltip monolith `placement` default (web-placement lane);
`DialogRoot void modal;` nit; residual parity staleness
(`MenuPortal` cell, D10, `TooltipPortal` seam note).

## Merge + cleanup record (self-merge rule)

- `validate` on PR #75: PASS (run 39191114153, 1m1s).
- mergeStateStatus at merge: CLEAN (mergeable MERGEABLE).
- Diff verified docs-only before merge (8 docs + report; no
  src/example changes).
- `gh pr merge 75 --squash --delete-branch` (no --admin).
- `git worktree remove …/axis-docs6 && git worktree prune`;
  branch deleted locally + remotely; `main` synced.
