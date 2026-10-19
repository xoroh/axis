# Status report — 2026-10-19 (final-review refresh, on main 81437e9)

Supersedes the 03:40 CEST turn-15 note, which carried a duplicated
intro paragraph, two overlapping Done sections (0638a61 + ea44c0f),
and stale "#57/#60 open" blockers. Cleaned here; no content lost.
Full evidence: `.reports/axis-status-2026-10-19.md`
(component-by-component parity, 37 Base UI components),
`.reports/2026-10-19-axis-cleanup.md` (triage table + verification
output), and `.reports/2026-10-19-axis-integration-overlay-root.md`
(Lane A merge record). Independently verified by
`.reports/2026-10-19-axis-final-review.md`.

## Done (on main 81437e9)

- #58 web demo PR 1 + #61 styling pass (merged; Expo web demo runs,
  light/dark theme + open-state overlay evidence under
  `.reports/dx-audit/after/`).
- #59 docs batch 1 (Tabs/Toast/Field, Base UI level — merged).
- #63 docs batch 2 (Button/Dialog/Popover, Base UI level — merged;
  triaged MERGE from the closed #62 head: docs byte-identical,
  screenshot commit dropped, shots stay out of main per batch-1
  precedent). 6 of 47 component docs now at Base UI level.
- #57 parity (Select + Tooltip compound parts, Menu filter +
  submenus, `collection` + `typeahead` models — Combobox stays
  monolith — merged). #60 overlay root (Dialog/Popover/Menu/Drawer
  plus Select onto OverlayRoot/OverlayPortal — merged).
- #64 status refresh, #65 integration report, #66 cleanup-report
  verification appendix (all merged).
- Verified post-#60: `Dialog*Props`/`Popover*Props` unchanged by
  #60 (host-only migration) — #63 prop tables stand, no docs
  follow-up needed.
- Cleanup: remote only `main`; local only `main`; single checkout;
  no stashes; no untracked files outside `.gitignore`; no patch
  archive (`.team/archive/axis-2026-10-19` removed after use —
  triage rule stayed MERGE-or-DROP).

## Open PRs: NONE — all merged (release HOLD still stands)

| PR | State |
|---|---|
| #58 web demo, #61 styling | MERGED (f3e542e, 9ce685b). |
| #59 docs batch 1, #63 docs batch 2 | MERGED (ae91995, ea44c0f). #62 closed, superseded by #63. |
| #57 parity | MERGED (c9aab56). |
| #60 overlay root | MERGED (da1cde8) after #57, per plan. |
| #64 status, #65 integration report, #66 verification appendix | MERGED (2331a27, 0638a61, 81437e9). |

## Remaining program (in order)

1. Docs batch 3 (next item — Select/Menu/Tooltip/Overlay, the
   families #57/#60 just changed).
2. Parity leftovers: Select `multiple`, `alignItemWithTrigger`,
   scroll arrows; Combobox/Autocomplete onto the new
   collection/typeahead models; compound parts for Accordion,
   Avatar, Checkbox, Meter, Progress, NumberField, ContextMenu,
   Drawer; Form (no owner).
3. Slider: orientation/vertical/RTL, range/multi-thumb,
   Track/Thumb parts (Kern P1-1).
4. Press state: `hovered`/`focusVisible`/`dragged` beyond `pressed`
   (Kern P1-5).
5. Date/time: Calendar locale/week-start/range/min-max/keyboard
   grid; Time Picker dial (Kern P1-2/P1-3).
6. Kern friction entries (from
   `kern-axis-adopt/.reports/axis-api-friction.md`, 2 entries):
   - Entry 1 (pack-vendor fails cryptically in a clean worktree
     without `bun install` / with `npm` missing; proposes a
     pre-check with a "run `bun install` first" hint): neither #57
     nor #60 touches `scripts/pack-vendor.mjs`. Backlog: one
     small PR on the script.
   - Entry 2 (`ToastViewport` render-prop `style` untyped
     (`SlotProps.style` is `unknown`); proposes
     `StyleProp<ViewStyle>` on native): neither #57 nor #60
     touches `slot`/toast viewport types. Backlog: type the slot
     style prop at the component layer (keep the model
     platform-neutral per ADR 007; check web target before
     widening).

## Release readiness (0.1.0 with Kern): NOT READY

Blockers in order: 41 of 47 docs still thin; no device or
screen-reader pass ever run; dependency advisories unverified;
Kern still pins a stale Axis tarball (re-vendor past #60);
npm trusted publishing held (no versions/tags/publish without
explicit authorization). Release HOLD stands.

## Tree state

- Remote: only `main`. Local: only `main`.
- Single checkout on `main`, synced with `origin/main`.
- No stashes. No patch archive. No untracked files outside
  `.gitignore`.
