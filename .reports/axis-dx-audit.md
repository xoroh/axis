# Axis DX audit — developer adopting today (read-only)

Date: 2026-10-16. Auditor stance: outside developer, fresh checkout, no code
changes, no PRs. Repo: `xoroh/axis` @ `7c97560` (`main`).
Deliverable screenshots: `.reports/dx-audit/` (this directory's siblings).

**Heads-up on a moving tree.** The first directory listing in this session
showed 3 demos (`button`, `dialog`, `switch`); HEAD commit `7c97560`
("example app covers every component … (#51)", 22:55, minutes before this
audit) had already landed 14 family demos covering all 103 barrel exports.
All findings below are against the 14-demo tree. `git status` at end of
audit is clean except this report directory (plus one pre-existing
untracked file from another agent, untouched).

Reference baselines used for grading: **Base UI** docs
(`base-ui.com/react/components/*` — hero live demo, Anatomy, 3–11
examples per component, per-part API reference with types/defaults/
state/`data-*`/CSS vars, centralized a11y handbook) and
**rn-primitives** (install tabs + one minimal snippet + per-part prop
table with `Web Only`/`Native Only` tags, no live demos, ~no a11y
content). Axis's own bar is contract §9 (`docs/COMPONENT_CONTRACT.md`):
purpose + install snippet + minimal example + full prop table +
accessibility section + controlled/uncontrolled examples.

## 1. Quick start from scratch (temp dir, reproduced)

| Step | Result |
|---|---|
| `bun add @xoroh/axis react react-native` in empty dir | **FAILS**: `404 https://registry.npmjs.org/@xoroh%2faxis`. Package is `version 0.0.0`, `docs/RELEASING.md` = owner-gated HOLD, "nothing is published yet". The README install path is a dead end today. |
| `bun install --frozen-lockfile` (repo root) | OK, 879 installs, no changes. |
| `bun run --filter @xoroh/axis build` | OK (ESM+CJS+DTS, ~16 s). |
| `bun run lint` | Passes with **1 warning**: unused imports (`Pressable`, `ScrollView`) in `apps/example/src/demos/switch.tsx:3` — ships in the example app. |
| `bun run typecheck` | Passes (exit 0). |
| `bun run test:all` | **Did not finish in 240 s**: vitest leg passed (15 files, 163 tests), jest leg (30+ `*.rntest.tsx` suites) still running at cutoff. Spot-check `jest src/toast.rntest.tsx`: 8/8 pass in ~11 s — works, just slow at full scale. |
| `bun run check:demos` (example) | Passes: "all 103 components demoed". Verified the gate is real (parses barrel exports vs `components:` lists). |

## 2. Expo example app — run + screenshots

`apps/example/README.md` is honest: `expo start --web` needs
`react-native-web`, "not installed — native first". Reproduced:

- `bunx expo start --web` (pristine repo): **errors immediately** —
  `Install react-dom@19.2.3, react-native-web@^0.21.2`. No code was
  changed; a throwaway copy in `/tmp` got the two extra deps instead.
- `expo export --platform web` on the `/tmp` copy: **builds** (518 KB).
- List screen renders (`00-expo-demo-list.png`: "Axis examples (14)").
- **Every Axis demo screen crashes at runtime in the Expo web bundle**:
  `Uncaught TypeError: Cannot read properties of null (reading
  'useCallback')` (Button) / `'useState'` (Switch) — React dispatcher
  is null while the reconciler is rendering. Same components render
  fine under plain Node SSR with a single React copy (all 14 OK), so
  this smells like duplicate-React/module-interop in the Metro web
  bundle, not broken components — but it is **unresolved and needs an
  owner repro**. Net: there is currently **no working web preview**.
- iOS simulator: N/A on Linux. No Android AVD/adb in this environment.
  `docs/COMPATIBILITY.md` honestly states: no emulator, simulator,
  physical-device, or screen-reader validation has ever been performed.

**Screenshot method (labeled honestly).** Desktop-browser tooling was
unreachable, and Expo web crashes, so `demo-*.png` are static
server-renders of the **actual demo `render()` functions** (esbuild +
`react-native-web`, single React, `/tmp`-only harness, repo untouched).
Modal/`Modal`-host content (Dialog/Popover/Menu/overlays) mounts via
effects on-device, so closed-state shots show triggers only — expected,
not a component bug. Filenames:

- `00-expo-demo-list.png` — real Expo web export, the 14-demo list.
- `demo-switch/button/dialog/selection/entry/list-select/ranges/display/disclosure/overlays/menu/dropdown/bars/popover.png` — SSR of each demo.

**What the screenshots reveal (unstyled-by-design pushed past useful):**

- `demo-switch`: track/thumb are transparent `View`s — **invisible**.
  A new user sees two labels and nothing else (DOM is correct:
  `role="switch"`, labels, tabindex).
- `demo-selection`: Checkbox, CheckboxGroup items, RadioGroup items all
  **invisible** (no caller `boxStyle`/indicator styles in the demo);
  only Toggle/ToggleGroup text shows.
- `demo-display`: `Loader` renders an **unbounded full-width ring**
  (no size → ~390 px); Avatar (remote URI, no size/fallback visible),
  AspectRatio box, Progress, Meter, Separator render **nothing visible**.
- `demo-disclosure`: Tabs triggers are childless
  (`<TabsTrigger value="a" accessibilityLabel="Alpha" />`) — tab row
  is nearly invisible; accordion/collapsible show headers only.
- `demo-overlays`: Toast/Sheet/Drawer/AlertDialog all
  `defaultOpen={false}` → render `null`; shot is three anchor texts.
  No open-state variant exists for any overlay demo.
- `demo-ranges` (best of the set): Calendar grid, NumberField
  steppers, TimePicker all render; Slider track invisible.
- `demo-entry` renders well (Field/Input/Textarea/NumberField/OtpField/
  Search all visible).
- Typo, real: `popover.tsx:22` `title: "Popover"` — visible in the
  Expo list shot and the demo header. (Reported, not fixed: read-only.)
- Console warning while rendering `list-select`: React "Unexpected
  text node: Sort by" — the Select placeholder string sits directly
  under a `View`. Harmless on native, noise on web.

## 3. Component docs — grades (10 core)

Scale: **Strong / Adequate / Thin / Missing**, per dimension.

| Component (doc lines) | API clarity | Examples | A11y | Visual demo |
|---|---|---|---|---|
| Button (30) | Thin — inline prop list, no table, no types/defaults/requiredness | Thin — 1 minimal snippet (Base UI: 3+ incl. loading/disabled) | Thin — busy-announce noted inline, no section | Adequate — 3 states, cramped inline layout |
| Checkbox (58) | **Strong** — full 11-row table + controlled & uncontrolled snippets; best of the set | Adequate — no labeling/form-integration example (Base UI's core checkbox story) | Thin — role/state inline, no section | Poor — checkbox invisible (no `boxStyle` in demo) |
| Switch (63) | Strong — same table shape as Checkbox | Adequate — controlled+uncontrolled, no form context | Adequate-minus — trailing paragraph, still no section | Poor — track/thumb invisible |
| Dialog (49) | Thin — inline `DialogProps` + per-part one-liners, **no prop table** for monolith or parts; monolith style props unexplained | Thin — one compound snippet, no controlled/open example | Thin — role/scrim/deferrals inline, no section | Adequate — closed trigger only; **plus point**: parity pointer to `BASE_UI_PARITY.md` |
| Popover (44) | Thin — same shape as Dialog | Thin — compound only, no monolith anchor/content example | Thin — honest no-role note is good, but no section | Adequate — anchor + trigger only |
| Menu (50) | Adequate — monolith + compound + checkbox/radio/filter/submenu mapping all described; still no tables | Adequate — one compound snippet; nothing on controlled/positioned/async use | **Missing-to-Thin** — no roles/states documented anywhere; biggest a11y hole for a menu | Adequate — triggers only |
| Select (19) | Thin — inline lists only; `Select` marked `pending` in parity with no pointer here | **Missing** — zero snippets | Missing — one role aside, nothing on labeling/announcement | Adequate-minus — closed trigger+inputs render; placeholder warning (see §2) |
| Tabs (10) | Missing — one-liner per part; no value/defaultValue/onValueChange semantics | Missing | Missing — one deferral line (roving deferred) | Poor — triggers childless, near-invisible |
| Toast (12) | Thin — inline list; duration/action documented in prose, no table | Missing — no open/duration/action example | Thin — one live-region line, no section | Missing — `defaultOpen={false}` renders `null`; nothing to see |
| Field (8) | Missing — shortest doc; "no validation logic" is the only behavior note | Missing | Thin — one error-announcement line | Adequate — visible inside Entry demo, but error state not demonstrated |

Cross-cutting, all 10: **no install snippet, no purpose heading, no
dedicated Accessibility section, no tested-fixture pointer** — i.e.
none satisfies contract §9 as written (Checkbox/Switch come closest).
Only dialog/menu/popover link out to `BASE_UI_PARITY.md`, which is
itself excellent (D1–D10 deviations + per-part tables for
Dialog/Menu/Switch/Checkbox/Toggle/Popover). Select/Tabs/Toast/Field
sit in parity's "pending" buckets with no in-doc pointer. Against
rn-primitives, Axis prose is more honest (deferrals with rationale,
verified-against-RN claims) but rn-primitives wins on install guidance
and per-part prop tables with platform tags; against Base UI, Axis is
a full tier below on every dimension except deviation documentation.

## 4. Ranked gaps that would stop adoption

1. **P0 — Not installable.** `0.0.0`, unpublished, `bun add` 404s.
   Every other gap is moot until a version exists. (Known/owner-gated,
   but it is the adoption blocker.)
2. **P0 — No way to see it.** Web preview broken two layers deep
   (missing deps by design → runtime dispatcher crash with deps added);
   no simulator/emulator/device evidence anywhere in the repo's own
   history. An adopter must wire Expo Go + local packing before first
   paint. Owner repro of the Metro-web crash needed regardless —
   if web is permanently out of scope, say so in the example README
   next to the current note.
3. **P1 — Docs below both bars.** 8/10 without real prop tables, 8/10
   without an Accessibility section, 4/10 (Select, Tabs, Toast, Field)
   with zero examples, 10/10 without install snippets. Contract §9
   already requires all of this — enforcement, not new policy, is the
   fix. Suggested order: Select → Tabs → Toast → Field (thinnest
   first), then tables+sections for Dialog/Popover/Menu/Button.
4. **P1 — Demos prove "unstyled" by being invisible.** Minimum caller
   styles (a gray track, a box border, a Loader size, tab labels as
   children) would keep the unstyled contract while making demos do
   their job. Add one open-state overlay demo (Toast with
   `defaultOpen` is the cheapest). Fix "Popover" typo, the Switch
   demo lint warning, childless Tabs triggers.
5. **P2 — Complex-component depth missing.** No controlled/positioned/
   nested/stacked/async/action examples and no keyboard/focus/SR maps
   for Menu, Select, Popover, Toast, Dialog — exactly the content that
   makes Base UI adoptable. The parity doc covers *what differs* but
   not *how to use*; component docs should link it (only 3/10 do).
6. **P3 — Contributor loop friction.** Full `test:all` exceeds 240 s
   (jest scale); consider sharding/documenting the expected wall time
   so contributors don't read it as a hang.

## 5. What's genuinely good (adoptability assets)

- Naming + API semantics mirror Base UI (`open`/`defaultOpen`/
  `onOpenChange`, `checked`/`defaultChecked`/`onCheckedChange`,
  compound part names) — the core adoption bet is coherent and the
  parity record documents every deviation with a native reason.
- Honest docs: deferrals named with rationale, "verified against RN
  0.87 types" claims, compatibility labeled policy-not-proof.
- Testing is real: 163 vitest + per-component RNTL suites
  (7–12 tests on complex families), boundary gate, publint/attw in
  slice validation, demo-coverage gate enforced in CI and verified
  working here.
- 14 family demos covering all 103 exports with stable slugs and a
  machine-checked registry is a better starting point than
  rn-primitives' single-snippet pages — it needs styling passes, not
  new structure.

## Appendix — verification log

- `bun install --frozen-lockfile` clean; `build` OK; `lint` 1 warning
  (`switch.tsx:3`); `typecheck` exit 0; `test:all` vitest 163 pass,
  jest leg incomplete at 240 s; single jest file 8/8 in ~11 s.
- `bun add @xoroh/axis` in empty dir: 404 (evidence of P0-1).
- `expo start --web` pristine: missing-deps error (evidence of P0-2a).
- `/tmp` copy + `react-dom` + `react-native-web`: export OK, list
  renders, demo screens throw dispatcher-null (CDP stack captured:
  `Button` → react `useCallback` with null dispatcher; same-component
  SSR with one React copy renders all 14 — evidence of P0-2b).
- Read in full: all 14 demos, `registry.ts`, `check-demo-coverage.mjs`
  (ran: pass), 10 component docs above, `BASE_UI_PARITY.md`,
  `COMPONENT_CONTRACT.md` (§9 quoted), `COVERAGE.md` (all 10
  `complete`), `COMPATIBILITY.md` (no-device-validation statement).
- Repo files changed: none. Untracked additions: this directory only.
  `/tmp` scratch (`axis-example-web`, `axis-shots`, `axis-qs`) holds
  all throwaway scaffolding.
