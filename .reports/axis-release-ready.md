# Axis release-readiness report

Verdict: **Axis is release-ready** — all planned components, tests,
CI, and release-flow preconditions verified green on main
`e5de22a51d809306d9a9110bdd97c17536ee3d33` (2026-10-16). Publication
itself remains owner-gated (release HOLD: no publish, no version
bumps, no tags performed here).

## 1. Inventory: no missing items

`docs/COVERAGE.md`: **63 `complete` rows, 0 `missing`, 0 `deferred`.**
Closed this program: Text, Settings Row, FAB family (Fab +
ExtendedFab), Sheet/Drawer (Sheet), Dropdown Menu, Navigation Menu,
Pressable/Trigger (Trigger — recorded evaluate-vs-Button/Switch
decision), Navigation Bar/Rail/Drawer, Top App Bar, Menubar.
Standing ruled rows unchanged: `na-native` (Scroll Area, Preview
Card) and gated `collection`/`mergeRefs` (transfer only with a real
consumer — none exists).

## 2. Tests (all on main, this report)

- jest (RNTL, public-entry imports only): **54 suites / 362 tests pass**
- vitest (models + registries): **14 files / 154 tests pass**
- `bun test tests/`: pass
- Boundary gate + mutation suite: **pass + 26/26**
- `biome check .` (163 files): clean; `tsc --noEmit`: clean

## 3. CI

`CI` workflow (validate: install → tests → lint → typecheck →
package test → RN jest → boundary+mutations → build → publint/attw):
**green on every coverage-batch PR (#12–#19) and on the main pushes
that merged them** (latest: run 38922896929, success).

## 4. Release flow

Releases are manual by design (`docs/RELEASING.md` — no release
workflow exists). Preconditions verified:
- Real source, single `.` entry with ESM+CJS+d.ts, tests: yes
- Manifest (`@xoroh/axis`, `exports`, `files`, repo URL, MIT): yes
- Changesets: 17 pending `minor` entries (unpublished per HOLD)
- `bun install --frozen-lockfile`: clean, no changes
- `npm pack --dry-run`: 7 files (`dist/` ×4 + README + LICENSE +
  package.json), **no `src/` leak**

## 5. Independence (Kern may consume Axis, never the reverse)

- Runtime dependencies: **none** (peers only: `react>=18`,
  `react-native>=0.86 <0.89`, declared at first component per
  contract §10)
- Boundary gate (two-zone rule): models platform-neutral,
  components RN-host-only — enforced mechanically, green
- Public entry surface: **247 exported names** (`dist/index.d.ts`
  trailing export list — the figure Kern's consumption gate reads)

## 6. Known limits (unchanged, not blockers)

- No emulator/simulator/physical-device or screen-reader runs
  anywhere (methodology: RNTL + contract tests only, labeled so).
- `collection`/`mergeRefs` stay gated in both repos.
- Deferred-with-rationale items inside shipped components (Sheet:
  no animation/back-handler/focus-trap; menus: no hover/keyboard/
  portal) are documented in component headers, not gaps.

## 7. Handoff for the kern cutover

- Re-vendor from this SHA: `e5de22a51d809306d9a9110bdd97c17536ee3d33`
- Expected Kern-side effects (for the deletion-PR author): export
  count moves 199 → 247; new barrels (Text, SettingsRow, Fab,
  ExtendedFab, Sheet, DropdownMenu, NavigationMenu, Trigger,
  TopAppBar, NavigationBar/Rail/Drawer, Menubar) available to
  Kern-native/web consumers and the site primitives docs.
- Owner confirmations still required: (a) this readiness verdict,
  (b) the kern-primitives deletion PR (unmerged), (c) first publish
  + semver spec swap under separate release authorization.
