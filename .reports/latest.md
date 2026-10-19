# Status report — 2026-10-19 02:50 CEST (Axis consolidation, turn 15)

Supersedes the turn-14 report (2026-10-16). Consolidation only: no
merges, no publish, no version/tag, no new feature work. Full
component-by-component evidence: `.reports/axis-status-2026-10-19.md`
(untracked, main checkout; research thread 84e31a71, read-only).

## Done (on main 82c3179)
- #53 render composition + toast queue + PortalHost (merged
  2026-10-16 23:32 CEST, incl. its 3 review fixes: entry demos
  `onValueChange`, overlay/toast demos, changeset frontmatter).
- #54 README-example gate (Q15), #55 pack-vendor, #56 status,
  #51 demo-coverage gate, #50 AI chat models (ADR 010), #45 scope
  migration, #47 no-compat sweep, #44 models zone.
- Inventory: 37 Base UI components checked; Axis ships 35 of them
  (Form missing; Preview Card and Scroll Area na-native) plus the
  native extras (Sheet, Portal, Calendar, Time Picker, Search,
  Loader).

## Open PRs (all unmerged, release HOLD)
| PR | Branch @ head | CI | State / blocker |
|---|---|---|---|
| #58 web demo PR 1 | feat/axis-example-web @ 7844571 | validate green | CLEAN. Needs lead user-eye review of web screenshots, then merge |
| #61 web demo styling (PR 2) | feat/axis-example-web-styling @ 51a9e25 | no checks (base is #58 branch) | Stacked on #58; retarget to main after #58 lands. Known weak: Tooltip tip collapses on web, ContextMenu Close clipped, `Sort by` text-node warning (fixed in #57) |
| #57 parity Select/Combobox/Tooltip/Menu | feat/axis-parity-select-menu @ fc3a834 | validate green | CLEAN. Review fixes 1-5 pushed 2026-10-19 01:50 CEST; Select/Menu/Tooltip web screenshots still owed (gated on #58) |
| #60 overlay root | feat/axis-overlay-root @ 326563c | validate FAILS | `check:demos`: 7 Overlay exports lack demos. Overlay demo + Select OverlayRoot edits made 2026-10-18 were never committed and were lost when /tmp was wiped on reboot. Conflicts with #57 in Menu.tsx (real), index.ts/models.ts/menuparts (trivial) |
| #59 docs Tabs/Toast/Field | docs/axis-docs-batch1-select-tabs-toast-field @ d0dbb4f | validate green | CLEAN. Lead review, then merge |

## Remaining program (in order)
1. Web demo: review + merge #58, retarget #61 to main, review its
   screenshots, merge.
2. Render (#53): DONE.
3. Overlay root: merge #57 first (it rewrites Menu.tsx), then rebase
   #60, redo the 7 Overlay demos, wire Select into OverlayRoot, get
   validate green, merge.
4. Parity: #57 lands in step 3. Left after it: Select `multiple`,
   `alignItemWithTrigger`, scroll arrows; Combobox/Autocomplete onto
   the new collection/typeahead models; compound parts for
   Accordion, Avatar, Checkbox, Meter, Progress, NumberField,
   ContextMenu, Drawer; Form (no owner); docs batch 2
   (Select/Menu/Tooltip/Overlay) after #59.
5. Slider: orientation/vertical/RTL, range/multi-thumb, Track/Thumb
   parts (Kern P1-1).
6. Press state: `hovered`/`focusVisible`/`dragged` beyond `pressed`
   (Kern P1-5).
7. Date/time: Calendar locale/week-start/range/min-max/keyboard grid;
   Time Picker dial (Kern P1-2/P1-3).
8. Then Form/Link/PasswordToggle, transitions (D9), focus
   initial/final (D5), and the readiness report rewrite.

## Release readiness (0.1.0 with Kern): NOT READY
Blockers in order: open PRs above; #60 CI red; 40+ component docs
thin (only Tabs/Toast/Field at Base UI level via #59); no device or
screen-reader pass ever run; dependency advisories unverified; Kern
still pins a stale Axis tarball (re-vendor after merges); npm
trusted publishing needs owner `npm login`. Release flow itself
(workflow, changesets, publint/attw) is ready and held.

## Tree hygiene (report only, nothing deleted)
- Worktrees: main checkout on feat/axis-example-web-styling with
  untracked `.reports/` files; axis-vendor-clean (detached, untracked
  vendor/); /tmp/opencode/axis-overlay-root and axis-parity-select
  (clean, pushed; re-created 2026-10-19 01:18 CEST after reboot);
  /tmp/opencode/axis-web-demo is gone.
- No stashes. No unpushed commits on tracked branches. Local branch
  `review-58` (e48d1ef, no upstream) and 12 local branches whose
  remotes are gone (squash-merged PRs) remain; ~30 stale remote
  docs/feature branches from merged PRs remain.
