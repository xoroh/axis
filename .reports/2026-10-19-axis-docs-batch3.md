# Report — 2026-10-19-axis-docs-batch3

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-19-axis-docs-batch3
Branch: `docs/axis-docs-batch3` (worktree `~/Desktop/Business/xoroh-monorepo/axis-docs3`, from `origin/main` @ `b85a5c3`).
Inputs: `docs/VISION.md`, `docs/decisions/` (001–011 + README), `docs/IDEAS.md`, `.reports/latest.md`, `.reports/2026-10-19-axis-final-review.md`, current source on main.

## Outcome

Done. `select.md`, `menu.md`, `dropdown-menu.md`,
`context-menu.md`, `tooltip.md` rewritten to Base UI level from
the current post-#57/#60 source; new `overlay.md` added;
`packages/axis/README.md` index regenerated (Overlay row added;
ContextMenu → Context Menu title sync). No `packages/axis/src/**`
or `apps/example/**` changes. No screenshots (none of the six
docs use them — batch-1/2 precedent keeps shots out of main).

## PR

- https://github.com/xoroh/axis/pull/71 (draft; CI `validate` pending at write time — lead merges only on green)

## Commands run (real output, worktree `axis-docs3`)

- `git worktree add ~/Desktop/Business/xoroh-monorepo/axis-docs3 -b docs/axis-docs-batch3 origin/main` → HEAD `b85a5c3`.
- `node scripts/check-readme.mjs` → FAILED first: index stale (47 rows, expected 48). Ran `--write` → `check-readme: index rewritten (48 rows)`.
- `bun install --frozen-lockfile` → `893 packages installed` (scratch `node` lacked `typescript` for the examples gate before install; `bun` found at `~/.bun/bin`).
- `node scripts/check-readme-examples.mjs` → `holds: 43 tsx blocks parse, axis imports resolve, component props exist` (was 28 — 15 new examples all pass).
- `node scripts/check-readme.mjs` → `holds: 48 component notes (unique, sourced), README index in sync, no stray sections`.
- `bun run lint` → `Checked 202 files … No fixes applied.`
- `bun run check:demos` (apps/example) → `demo coverage holds: all 140 components demoed` + `web bundle assertions hold`.
- `git push -u origin docs/axis-docs-batch3` → new branch pushed.
- `gh pr create --draft` → PR #71.
- `gh pr checks 71` → `validate pending` (run 39189463971) at report time.

## Acceptance

1. **Anatomy + props + data/state + a11y + parsing examples, Base UI structure — PASS.** Each of the six docs has: full compound anatomy as exported in `packages/axis/src/index.ts`; a props table per part with exact types, required/optional, and defaults taken from source (destructuring lines quoted via extraction); state shapes; `render`/value-or-function-`style` composition + explicit `data-*` absence (contract §11, parity D1); accessibility section grounded in the host roles/labels in code; 3 parsing examples each (15 new blocks, gate-verified). Structure mirrors the batch-1/2 pattern (`dialog.md`/`popover.md`: intro, Source of truth, Install, Anatomy, Props, Examples, Accessibility, Composition).
2. **Overlay story + no compound Combobox/Autocomplete — PASS with one flagged gap.** Tooltip states it is not on OverlayRoot and why (non-modal hint must never trap touches; scrim/focus/scroll-lock would be all cost, no benefit). Select, Menu, and the new Overlay doc explain OverlayRoot, OverlayPortal, PortalHost, and the `useModal` opt-in; DropdownMenu/ContextMenu state explicitly that they are inline and not on the stack, with pointers. Combobox/Autocomplete appear only as non-compound references (Select filtering defers to Combobox's shared `collection` match). **Gap:** `dialog.md`/`popover.md` (batch 2, out of scope here) still describe a bare RN `Modal` host and never mention OverlayRoot/PortalHost — they predate the #60 framing. Suggest a follow-up touch to those two docs (see below).
3. **Gates — PASS locally, CI pending.** `lint`, `check:readme`, `check:readme-examples`, `check:demos` all green (outputs above). CI `validate` on PR #71 was still pending when this report was written — merge only when green.

## What's still weak (honest)

- No fresh screenshots (none required — no target doc uses them).
- No device/simulator or screen-reader pass ever (program-level gap, unchanged).
- `dialog.md`/`popover.md` don't mention OverlayRoot/PortalHost/`useModal` (out of scope; needs a batch-2 amendment).
- Monolith-vs-compound hosting split (inline monoliths vs OverlayRoot compounds) is now documented per family, but nothing enforces it — a future refactor could silently reunite them.

## Code bugs found (listed, not fixed — `src/` out of scope)

1. **Tooltip monolith `placement` default is `"bottom"` at runtime, `"top"` on paper.** `TooltipProps` documents Default `"top"`, but the monolith destructures `placement` bare (`Tooltip.tsx:109`) and passes it straight into `useFloatingPlacement`, whose own default is `"bottom"` (`useFloatingPlacement.ts`: `placement = "bottom"`). Only the compound `TooltipPositioner` applies `side ?? "top"` (`Tooltip.tsx:565`). So `<Tooltip content=…>` with no placement prefers bottom, contradicting the Props comment and the doc. One-line fix on the owning thread (`placement ?? "top"` at the monolith call site, or correct the comment).
2. **Stale Tooltip.tsx comments re: the overlay root.** Module/compound comments say "when the shared overlay root lands, tips can host there" / "overlay-root adoption seam" — post-#60 the overlay root HAS landed and tips deliberately stay off it (this batch documents the why). Comment-only cleanup, owning thread.
3. (Non-bug, verified accurate) Positioner `align`/`sideOffset`/`alignOffset` have no destructuring defaults in Select/Menu/Tooltip positioners, but the doc-stated `"center"`/`0`/`0` hold: `useFloatingPlacement` forwards them to `resolveFloatingSide`/`resolveFloatingRect`, which default `offset ?? 0`, `align ?? "center"`, `alignOffset ?? 0` (`positioning.ts:61-63`). Docs state effective defaults — correct.

## Suggested next docs batch

1. Batch-2 amendment: `dialog.md` + `popover.md` Overlay-hosting sections (OverlayRoot/PortalHost/`useModal`, `modal` defaults true/false) — small, high-value, closes acceptance-2 fully.
2. Drawer + Sheet + AlertDialog + Portal (portal.md is thin, 1 section + composition; drawer/sheet presumably thin too) — the remaining OverlayRoot families.
3. Then parity-leftovers docs (Accordion, Avatar, Checkbox, Meter, Progress, NumberField, ContextMenu-splits already done here) per `latest.md` item 2.
