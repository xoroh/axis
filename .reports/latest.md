# Status report — 2026-10-19 03:20 CEST (Axis cleanup Lane B + consolidation)

Supersedes the 02:50 CEST turn-15 note. Cleanup Lane B (owner
priority 02:58/02:59 CEST): zero open PRs, only `main` on the
remote, clean tree. All feature work was on hold during cleanup;
docs batch 2 was triaged on content and MERGED. Full evidence:
`.reports/axis-status-2026-10-19.md` (component-by-component
parity, 37 Base UI components) and
`.reports/2026-10-19-axis-cleanup.md` (triage table + verification
output).

## Done (on main ea44c0f)
- #58 web demo PR 1 + #61 styling pass (merged; Expo web demo runs,
  open-state overlay evidence in).
- #59 docs batch 1 (Tabs/Toast/Field, Base UI level — merged).
- #63 docs batch 2 (Button/Dialog/Popover, Base UI level — merged;
  triaged MERGE, screenshot commit dropped, shots stay out of main
  per batch-1 precedent). 6 of ~46 docs now at Base UI level.
- Cleanup: ~38 stale remote branches deleted, 12 gone-remote locals
  + review-58 + merged-PR locals deleted, old untracked shots
  deleted, no stashes, no patch archive.

## Open PRs (Lane A; release HOLD still stands)
| PR | State / blocker |
|---|---|
| #57 parity Select/Combobox/Tooltip/Menu | Lane A merges. Review fixes pushed; needs CLEAN + validate SUCCESS. |
| #60 overlay root | Lane A merges after #57 (Menu.tsx overlap). Was CI-red on demos; Lane A resolves. Migrates Dialog/Popover/Menu/Drawer onto OverlayRoot — prop tables in #63 describe pre-#60 API; expect a small docs follow-up if #60 changes `*Props`. |

## Remaining program (in order)
1. Docs batch 2: DONE (#63 merged 2026-10-19). Caveat: #60 may
   change Dialog/Popover `*Props` — re-check tables post-#60, one
   small follow-up PR if needed.
2. Parity leftovers (#57 open + after): Select `multiple`,
   `alignItemWithTrigger`, scroll arrows; Combobox/Autocomplete onto
   the new collection/typeahead models; compound parts for
   Accordion, Avatar, Checkbox, Meter, Progress, NumberField,
   ContextMenu, Drawer; Form (no owner); docs batch 3 (next item —
   likely Select/Menu/Tooltip/Overlay, which #57/#60 just changed).
3. Slider: orientation/vertical/RTL, range/multi-thumb,
   Track/Thumb parts (Kern P1-1).
4. Press state: `hovered`/`focusVisible`/`dragged` beyond `pressed`
   (Kern P1-5).
5. Date/time: Calendar locale/week-start/range/min-max/keyboard
   grid; Time Picker dial (Kern P1-2/P1-3).
6. Kern friction entries (from
   `kern-axis-adopt/.reports/axis-api-friction.md`, 2 entries):
   - Entry 1 (pack-vendor 127/`tsup: command not found` in a clean
     worktree; proposes a pre-check with a "run `bun install`
     first" hint): NOT covered by #57 (parity parts) or #60
     (overlay root) — neither touches `scripts/pack-vendor.mjs`.
     Backlog: one small PR on the script.
   - Entry 2 (`ToastViewport` render-prop `style` untyped
     (`SlotProps.style` is `unknown`); proposes
     `StyleProp<ViewStyle>` on native): NOT covered by #57 or #60
     — neither touches `slot`/toast viewport types. Backlog: type
     the slot style prop (check web target before widening).

## Release readiness (0.1.0 with Kern): NOT READY
Blockers in order: #57 + #60 open; 40 of ~46 docs still thin;
no device or screen-reader pass ever run; dependency advisories
unverified; Kern still pins a stale Axis tarball (re-vendor after
#57/#60); npm trusted publishing held (no versions/tags/publish
without explicit authorization). Release HOLD stands.

## Tree state (this branch merges LAST, after #60)
- Remote: only `main` + Lane A feat branches until #57/#60 land,
  then only `main`.
- No stashes. No patch archive (`.team/archive/axis-2026-10-19`
  removed after use — triage rule is MERGE-or-DROP, no parking).
- No untracked files outside `.gitignore` (old shots deleted;
  useful reports ride this PR).
