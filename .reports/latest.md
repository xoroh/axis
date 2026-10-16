# Status report — 2026-10-16 (Axis completion program, turn 3)

## Owner direction applied (supersedes the readiness verdict)
- Axis mirrors Base UI as closely as RN allows (names, compound
  parts, props, controlled patterns, render composition,
  data-state where meaningful; every deviation documented).
- `rn-primitives` (MIT) + mature RN libraries: implementation
  references only — no dependency, no wholesale copying.
- No MCP server or CLI for Axis: nothing to drop (the contract
  already excludes both; verified by grep — single exclusion line).
- PR #20 (readiness report) closed as superseded: its verdict
  predates the alignment program. The parity check will land in a
  rewritten readiness report at the end, not now.

## Done this turn
- Alignment slice 1 (PR #21 OPEN, CI running): shared
  `render`-prop composition (`resolveRender`/`resolveStyle` over
  the `slot` merge; className→undefined; function styles carry
  part state) with vitest suite (7 tests), Dialog compound parts
  (Root/Trigger/Portal/Backdrop/Popup/Title/Description/Close —
  RNTL 11, monolith suite still green), contract §11 (parity
  rules), `docs/BASE_UI_PARITY.md` (Dialog aligned, systematic
  deviations D1–D10), README anatomy, changeset. Monolith
  `Dialog` unchanged. Local: typecheck/lint/boundary/vitest/jest
  green.
- Key design rulings (all documented in-file): `keepMounted`
  dropped (untestable — invisible modal subtrees hide from RNTL
  like the platform hides them); `data-*` systematically absent
  (D1); same-index settle reports nothing (shared hook
  `Object.is` semantic); cascade paths stay internal
  (from Batch M, unchanged).

## Remaining program (Base UI alignment, family by family)
1. Menu family (Menu/DropdownMenu/NavigationMenu/Menubar):
   Root/Trigger/Portal/Backdrop/Positioner/Popup/Item/Submenu/
   Group parts + render composition on existing parts.
2. Popover, Select, Combobox, Tooltip, Dialog-adjacent overlays
   (AlertDialog, Sheet as Drawer-like? — Base has Drawer with
   snap points: map our Sheet).
3. Controls (Switch, Checkbox, Radio, Slider, Tabs, etc.):
   parts + render + state objects where Base defines them.
4. Then: rewrite `.reports/axis-release-ready.md` WITH the
   per-component Base UI parity check, and stop for owner
   confirmation. Kern untouched until then.

## Standing constraints (unchanged)
- Small PRs, merge routine ones on green CI; trees clean/pushed;
  no branches deleted. No Kern/token deps. Release HOLD: no
  publish, tags, or version bumps.
