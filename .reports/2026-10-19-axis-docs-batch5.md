# Report — 2026-10-19-axis-docs-batch5

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-19-axis-docs-batch5
Branch: `docs/axis-docs-batch5` (worktree `~/Desktop/Business/xoroh-monorepo/axis-docs5`, from `origin/main` @ `3dca152` = #72 merge).
Prior steps this thread: marked #72 ready (mergeStateStatus CLEAN, validate SUCCESS), squash-merged (no --admin), removed `axis-docs4` worktree + local/remote branch, `main` synced to `3dca152` (worktree list + clean status pasted in thread). No subagent sessions used (in-thread extraction).

## Outcome

Done. `docs/BASE_UI_PARITY.md` Dialog/Popover portal-host cells
fixed (Portal host-side cell verified current, untouched); the 8
thinnest eligible component docs rewritten to Base UI level from
current source. README index untouched (`check:readme` holds at
48 rows — titles unchanged). No `packages/axis/src/**` or
`apps/example/**` changes. No screenshots (no target doc uses
them).

## PR

- https://github.com/xoroh/axis/pull/74 (draft; CI `validate` pending at write time — merge only on green)

## Commands run (real output, worktree `axis-docs5`)

- `git worktree add … axis-docs5 -b docs/axis-docs-batch5 origin/main` → HEAD `3dca152`.
- `bun install --frozen-lockfile` → `893 packages installed`.
- `node scripts/check-readme.mjs` → `holds: 48 component notes (unique, sourced), README index in sync, no stray sections`.
- `node scripts/check-readme-examples.mjs` → `holds: 73 tsx blocks parse, axis imports resolve, component props exist` (was 55 — 18 new examples all pass).
- `bun run lint` → `Checked 202 files … No fixes applied.`
- `bun run check:demos` (apps/example) → `demo coverage holds: all 140 components demoed` + `web bundle assertions hold`.
- `git push -u origin docs/axis-docs-batch5` → new branch pushed.
- `gh pr create --draft` → PR #74.

## Thinness survey (line count + missing sections)

Ranked `docs/components/*.md` by `wc -l` (all thins = one
`##` title + Source-of-truth line + short paragraph + generic
Composition stub; missing Install/Anatomy/per-part Props/
Examples/Accessibility). Excluded per brief: slider, accordion,
avatar, checkbox, meter, progress, number-field, combobox,
autocomplete, select, calendar, time-picker, toast; plus all
batches 1–4 docs (tabs, field, button, dialog, popover, menu,
dropdown-menu, context-menu, tooltip, overlay, alert-dialog,
drawer, sheet, portal).

Chosen 8 (strictly the 8 lowest line counts among the
eligible; tie at 20 lines broken alphabetically):

| Doc | Lines | Reason |
|---|---|---|
| aspect-ratio | 16 | thinnest tier; stateless ratio box, clamp rule undocumented |
| fieldset | 16 | thinnest tier; legend/group structure, no-role rationale missing |
| loader | 16 | thinnest tier; busy-state announcement undocumented |
| table | 18 | 4-part anatomy (Header/Row/Cell + `header` state) flattened to a paragraph |
| collapsible | 19 | 3-part compound (Root/Trigger/Panel) flattened; open/disabled state tables missing |
| label | 19 | nativeID association contract undocumented |
| separator | 19 | orientation decision + `accessible={false}` rationale missing |
| search | 20 | controlled query/submit/clear-affordance tables missing (alphabetical tie-break over text/toggle-group/toolbar) |

Next-thinnest eligible left for batch 6: text, toggle-group,
toolbar (20), input, navigation-menu, textarea, trigger (22),
menubar (25), checkbox-group (28), toggle (41), radio-group
(51), switch (72).

## Acceptance (batch-5 brief)

1. Parity fix with quoted source — PASS. `DialogPortal` cell:
   "RN `Modal` host" → "`OverlayPortal` at `PortalHost`"
   (sources: `Dialog.tsx:200` `<OverlayPortal>`, `:228`
   "Portal (the overlay root at `PortalHost`)",
   `:519-534` `DialogPortal` returns `<OverlayPortal
   testID>`). `PopoverPortal` cell likewise
   (`Popover.tsx:594-611`, in-box branch + `<OverlayPortal
   testID>`); attached `PopoverBackdrop` "without a Modal
   host" → "without an overlay host" (same claim, same block).
   Portal host-side cell verified current as written and left
   untouched.
2. 8 thinnest to Base UI level — PASS. Each has full anatomy as
   exported, per-part props tables with exact types/defaults
   from source (all 8 sources read in full in-thread:
   AspectRatio 113, Fieldset 106, Loader 110, Table 246,
   Collapsible 305, Label 97, Separator 88, Search 156 lines),
   state shapes, `render`/static-`style` composition with the
   empty-state form called out per part, `data-*` absence,
   accessibility grounded in host props, 18 parsing examples,
   Base UI structure throughout.
3. Gates — PASS locally, CI pending. `lint`,
   `check:readme`, `check:readme-examples`, `check:demos` all
   green (outputs above). CI `validate` on PR #74 was still
   pending when this report was written — merge only when green.

## What's still weak (honest)

- No fresh screenshots (none required — no target doc uses them).
- No device/simulator or screen-reader pass ever (program-level gap).
- During this batch I caught one of my own examples
  pre-gate: a Label example using `accessibilityLabelledBy` on
  `Input`, which `Input` does not accept — replaced with a
  gate-passing adjacent layout before committing. The gate
  would have caught it; the habit should be verify-first.

## Code / code-adjacent bugs found (listed, not fixed — out of scope)

1. **Residual parity staleness (same class, left for follow-up
   per scope).** `MenuPortal` cell (§ Menu,
   `docs/BASE_UI_PARITY.md:89`) still says "RN `Modal` host
   (native body-append equivalent)" — `MenuPortal` returns
   `<OverlayPortal>` when modal, in-box `View` otherwise
   (`Menu.tsx:1096-1118`, quoted in the batch-3 report). D10
   (`:27`) claims portal-host painting is "deferred until a
   consumer needs it" — the Portal model exists and compound
   menus use it. `TooltipPortal` cell (`:196`) references the
   "overlay-root adoption seam" note, which is now a
   deliberate-never, not a seam. Small reword job; suggest
   folding into the next parity touch.
2. `DialogRoot` pointless `void modal;` (`Dialog.tsx:410` vs
   `:452`) — already logged in batch 4, not repeated as new.

## Suggested next docs batch

1. Next-thinnest eligible: text, toggle-group, toolbar, input,
   navigation-menu, textarea, trigger, menubar (8 lowest
   remaining; checkbox-group/toggle/radio-group/switch after).
2. Residual parity staleness (item 1 above) — 10-minute fix.
3. Excluded-family docs unlock as their code lanes land
   (slider, accordion, avatar, checkbox, meter, progress,
   number-field, combobox, autocomplete, calendar/time-pickers).
