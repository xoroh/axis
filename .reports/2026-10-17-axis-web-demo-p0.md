# 2026-10-17 Axis Web Demo P0 — report

## Outcome

P0 styling pass (PR 2) complete and open for review. The Expo web demo loads with zero console errors; every demo visibly renders at 1440 + 390 in light + dark; every overlay opens via an explicit button with screenshots as evidence. Scope held: `list-select.tsx`, `menu.tsx`, and the Tooltip block of `overlays.tsx` are byte-identical to HEAD (parity thread, PR 57 still open); `packages/axis/**` and `docs/**` untouched.

## PR link

- PR 2 (this work): https://github.com/xoroh/axis/pull/61 — `feat/axis-example-web-styling` → `feat/axis-example-web` — OPEN, unmerged (never merge own PR).
- PR 1 (stacked base, pre-existing): https://github.com/xoroh/axis/pull/58 — `feat/axis-example-web` — OPEN.
- Thread-PR linking via `link_pull_request` was unavailable in this environment (no such tool exposed); both URLs are recorded here instead.

## Commands run + real output

- `bun run --filter @xoroh/axis-example typecheck` → `Exited with code 0`
- `bun run lint` → `Checked 193 files in 458ms. No fixes applied.`
- `bun run --filter @xoroh/axis-example check:demos` → `demo coverage holds: all 107 components demoed.` + `web bundle assertions hold: web deps present, Metro single-React pinned, hooks safe.` → `Exited with code 0`
- `bun run test` → `2 pass, 0 fail`
- `bun run --filter @xoroh/axis typecheck` → `Exited with code 0`
- Fail-before proof (base `82c3179`): `package.json` contains 0 of `react-dom`/`react-native-web`; no `metro.config.js`; `App.tsx` calls `{demo.render()}` directly — i.e. `check-web-bundle.mjs` fails 4 ways before PR 1, passes after.
- Browser capture (Playwright + headless Chrome vs Metro on `:8091`): full matrix clean on initial load; 28 console errors total, all `Unexpected text node: Sort by` from parity-owned `list-select.tsx` when navigating to that demo (out of scope, PR 57). Targeted re-capture of `context-menu-open` in all 4 configs: `ERRORS (0)`.
- `git push -u origin feat/axis-example-web-styling`; `gh pr create --base feat/axis-example-web` → PR 61.

## Screenshots

All under `.reports/dx-audit/after/` (this PR adds them):

- Demo matrix: `web-1440-light/`, `web-1440-dark/`, `web-390-light/`, `web-390-dark/` — `00-demo-list.png` + `01-switch` … `14-popover`.
- Open overlays: `web-open-1440-light/`, `web-open-1440-dark/`, `web-open-390-light/`, `web-open-390-dark/` — `dialog-compound-open`, `dialog-inline-open`, `sheet-open`, `drawer-open`, `alert-dialog-open`, `context-menu-open`, `tooltip-open-long-press`, `toast-queued-open`, `popover-inline-open`, `popover-compound-open`, `popover-modal-open`, `menu-open`, `dropdown-open`, `dropdown-submenu-open`, `select-open`, `combobox-open`, `autocomplete-open`.
- Verified by reading: Switch/Checkbox/Radio (04-selection), Progress/Meter/Loader (08-display), Slider (07-ranges), Tabs (09-disclosure), Dialog/Sheet/Drawer/AlertDialog open states, ContextMenu post-fix (visible box, light + 390), dark-mode + 390 variants spot-checked.

## Acceptance 1..n

1. `expo start --web` loads the demo with no console errors; screenshot proves it — **PASS** (initial load: 0 errors; `00-demo-list.png` × 4 configs).
2. Screenshots at 1440 and 390, light and dark, show each listed control and each overlay opened via its button — **PASS with noted exceptions**: Switch, Checkbox, Radio, Progress, Meter, Slider, Loader, Tabs all visibly render; every overlay has an open button and open-state shot. Exceptions: Tooltip tip never becomes visible on web (gesture/measurement issue, see weak spots); ContextMenu box renders but its Close affordance is clipped on 1440-light.
3. Example typecheck, `check:demos`, CI green; a check that fails before and passes after — **PASS** (all gates green; `check-web-bundle.mjs` fail-before demonstrated on base, passes on branch).

## What's still weak (honest)

- Tooltip on web: long-press fires but the tip never appears — `useFloatingPlacement` `measure()` never resolves on react-native-web, so the tip stays at `opacity: 0`. Needs a `packages/axis` fix (out of scope, owned with overlay-root thread PR 60).
- ContextMenu open box is small and its inner Close button is clipped on desktop (visible, but cramped).
- Calendar/TimePicker render as stacked text rows on web — present but ugly; native-first components with no web layout polish.
- Navigating to the List select demo logs `Unexpected text node: Sort by` console errors (parity-owned `list-select.tsx`, PR 57) — the one console-noise source left, and it blocks a clean "zero errors everywhere" claim until PR 57 merges.
- Old `overlay-*.png` files from the PR 1 capture still sit in `web-open-1440-light/` alongside the new names; harmless but untidy (kept for PR 1 diff history — can delete on merge).

## Gaps for other leads

- Parity thread (PR 57): fix the `Sort by` bare-text-node console error in `list-select.tsx`; after merge, this thread can re-style that demo + `menu.tsx` + Tooltip block and re-capture.
- Overlay-root thread (PR 60): web `measure()`-based placement (Tooltip/ContextMenu/Select/Popover positioning) needs a react-native-web-safe measurement path.
- Kern: no missing Kern part for this task — demos are caller-styled per VISION principle 3 (Kern → Axis, never reverse); no `kern-pending/` entry needed. Stated explicitly so the release hold stays clean.

## Suggested next item

After PR 57 merges: small follow-up styling the three held-out areas (`list-select.tsx`, `menu.tsx`, Tooltip block) + deleting the stale `overlay-*.png` files + one re-capture, then hand the demo URL to Kern for the Expo 57 host proof (Kern roadmap Phase 2–3).
