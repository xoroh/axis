# 2026-10-19 Axis web placement — report

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-19-axis-web-placement
Worktree: `axis-webplace` on `fix/axis-web-placement` (from `origin/main`
`b85a5c3`, rebased onto `a9e0465` docs batch 3 — docs-only, no conflicts).

## Outcome

Floating overlays now position correctly on web (React Native Web) in
the Expo example app. Tooltip, ContextMenu, Popover, Menu and Select
popups open anchored to their trigger with real size; the menu popup
is styled; the #60 Overlay demo section and Select-on-OverlayRoot have
fresh screenshots in all four configs. Native behavior is unchanged
(the native `measure` + `absolute` path is byte-identical) and the
full gates pass.

## PR link

- PR 73 (this work): https://github.com/xoroh/axis/pull/73 —
  `fix/axis-web-placement` → `main` — OPEN as a draft, never to be
  merged by this thread (the lead merges).

## Root cause (observed, not assumed)

The final review's "never resolves on RNW" diagnosis is wrong in
mechanism on current `main` — the probe proved it. React Native Web
attaches `measure` to every View/Pressable host node
(`usePlatformMethods`), and `UIManager.measure` resolves
asynchronously, so anchors DID resolve: DOM dumps showed every
popup at `opacity: 1` with real size. The actual defect is the
coordinate space: `measure` reports **viewport** coordinates, and
the hook pairs them with `position: absolute` inside nested relative
boxes — so every popup rendered offset twice over (tooltip +155y,
menu +170y/+694x, select list and popover the same pattern). On top
of that, a genuine crash: `anchorRef.current?.measure(...)` throws
`TypeError: ...measure is not a function` for any anchor node
without `measure` (the optional chain guards the ref, not the
method) — reachable via `render`-substituted anchors and any future
host without platform methods.

Two approaches were tried and rejected with evidence:

1. `position: fixed` on the web path — defeated by the Expo scroll
   container, which carries an identity `transform: matrix(1,0,0,1,0,0)`;
   any non-`none` transform re-anchors fixed descendants to itself, so
   viewport coordinates still misplaced (verified in-page: css
   `top: 171px` rendered at `y: 306`).
2. Viewport coordinates + `absolute` — the double offset above.

What ships: the web path detects the element node by duck-typing
`getBoundingClientRect` (no DOM imports, no globals, no new host
bindings — boundary-clean), reads the anchor rect fresh at layout
time, and translates the viewport-space point by the popup's
containing-block origin — the offset parent read off the layout
event's own node, which is exactly the box `absolute` positions
against. Flip/clamp still run in viewport space before the
translation. Monoliths (popup in the anchor wrapper) and compounds
(popup in an in-box portal layer) share the one code path. Nodes with
neither shape keep the transparent-at-origin path instead of
crashing. The native branch is untouched.

Minimal call-site changes: none needed — the hook fix covers all
six families with zero component edits. Demo styling only
(`menu.tsx`, `list-select.tsx`, `overlays.tsx`, `popover.tsx`):
theme the menu/select demos, left-pin compound positioners with
`align="start"`, full-width monolith boxes via `width: "100%"`,
tooltip tip style.

## Commands run with real output

- `bun install --frozen-lockfile` → `893 packages installed`
- `bun run build` → DTS success (`index` 218.76 KB ESM / 273.57 KB
  CJS, `models` 3.03 KB / 38.26 KB)
- `bun run --filter @xoroh/axis typecheck` → exit 0
- `bun run --filter @xoroh/axis-example typecheck` → exit 0
- `bun run lint` (`biome check .`) → `Checked 206 files … No fixes
  applied.`
- `bun run --filter @xoroh/axis test` (vitest) → `Test Files 28
  passed`, `Tests 259 passed` (254 existing + 5 new)
- `bun run --filter @xoroh/axis test:jest` (RNTL) → `Test Suites 57
  passed`, `Tests 461 passed`
- `bun run --filter @xoroh/axis check:boundary` → `boundary holds:
  models pure; components RN-host-only; internals unexported.`
- `bun run --filter @xoroh/axis-example check:demos` → `demo
  coverage holds: all 140 components demoed` + `web bundle assertions
  hold` → exit 0
- Fail-before proof (pre-fix source `a9e0465` restored over the new
  test file, then reverted): vitest `3 failed | 2 passed` — all three
  web-shape tests throw `TypeError:
  anchorRef.current?.measure is not a function`; with the fix all 5
  pass. The same pair was shown under RNTL first (2 failed / 4
  passed), then moved to vitest — see "test placement" below.
- Web capture: `bun scripts/capture-web.mjs` vs Metro on `:8091`
  (Playwright + headless Chromium) → 56 screenshots, 4 configs.
  Console errors: 36× `BackHandler is not supported on web and should
  not be used.` (pre-existing, `Overlay.tsx`, out of scope) and zero
  of anything else (no new errors, no `Unexpected text node`).
- `gh pr create --draft` → PR 73 (link above).

## Screenshots

Under `.reports/2026-10-19-axis-web-placement/<config>/`
(`web-1440-light`, `web-1440-dark`, `web-390-light`, `web-390-dark`;
`00-demo-list.png` + 13 open states each):

- `overlays-tooltip-open`, `overlays-tooltip-compound-open` — tips
  directly above/below their anchors, styled (monolith) / compound.
- `overlays-contextmenu-open` — box under the trigger card, styled,
  Close affordance visible.
- `overlays-overlay-open` — the #60 Overlay Root section open with
  backdrop (fresh evidence).
- `menu-open` — left-pinned under the trigger, styled (the
  previously unstyled popup).
- `menu-inline-open`, `menu-filterable-open` — monolith box and
  filter menu open and styled.
- `list-select-open` — full-width list directly below the trigger
  row. `list-select-compound-open` — Select-on-OverlayRoot popup
  left-pinned under its trigger (fresh evidence).
- `list-select-combobox-open` — options panel below the input row.
- `popover-inline-open`, `popover-compound-open`,
  `popover-modal-open` — anchored boxes, modal with backdrop.
- Judged as a user: every popup is visibly attached to its trigger
  at both widths, both themes.

## Acceptance 1..4

1. Web popups anchored with real size, desktop + mobile, light +
   dark, each one open — **PASS** (56 screenshots, user-eye-checked).
2. Native unchanged + fail-before test — **PASS with one deviation**:
   the native path is byte-identical and all 461 RNTL tests pass
   unchanged; the new 5-case suite fails before (3× TypeError) and
   passes after. Deviation: it runs under vitest, not RNTL/jest —
   the boundary gate reserves jest proofs for the public entry and
   the web anchor shape is unreachable through it (verified: RNTL
   host refs always carry `measure`). No public export was added
   (out of scope); see "test placement" in weak spots.
3. Fresh Overlay section + Select-on-OverlayRoot shots; menu-open
   styled — **PASS**.
4. Every gate green — **PASS**, except CI which the lead confirms on
   the PR (all local gates green: lint, both typechecks, vitest,
   jest, boundary, demos, build).

## What's still weak (honest)

- Test placement: the hook contract is proven in vitest with a
  minimal `react-native` mock, not RNTL — the boundary rule forces
  that (see above). If the lead wants an RNTL proof, `useFloatingPlacement`
  must be barrel-exported: a public API change needing an explicit
  decision. The suite itself is honest (3 fail before, 5 pass after).
- `BackHandler is not supported on web` warns 36× when OverlayRoot
  opens on web (`Overlay.tsx` — out of scope, pre-existing).
- Dual React Native copies (example `0.86.3` vs axis `0.87.1`) make
  their style types mutually unassignable, so shared demo style
  consts are annotated with axis prop types instead of `ViewStyle`
  (works, but the duplication is a smell worth aligning).
- The OverlayRoot demo popup's lower half tucks under the next card
  on web — the inline portal layer sizes to the card, and the demo
  tree is identical natively, so this is shared demo geometry, not a
  web regression.
- Combobox option rows render bare (no option styling exists in the
  component API — styling them needs a public prop, out of scope).
- One measurement per activation: scrolling after open detaches the
  popup from its anchor (same class as the native single-measure
  behavior, now documented in the hook comment).
- No device/emulator/screen-reader pass — standing gap, unchanged.

## Suggested next item

Lead decision: accept vitest coverage for `useFloatingPlacement`
(status quo, no API change) or promote the hook to the barrel for an
RNTL proof. After that: align the example/axis React Native copies,
then the standing device/a11y pass.
