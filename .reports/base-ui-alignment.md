# Report: Base UI alignment pass

Date: 2026-10-16. Branch: `feat/axis-baseui-alignment`
(worktree `/tmp/opencode/axis-baseui-align`). One PR, no merge —
Axis Lead reviews and merges. No publishing, no deploys, no
backward compatibility (hard cuts only, per ADR 011).

Scope source: `.reports/research-scope-axis-vs-kern.md` + owner
direction in `docs/BASE_UI_PARITY.md`. Checked against
`docs/VISION.md` (principles 1, 2, 5) and ADRs
001, 002, 006, 007, 009, 011.

## What landed

1. **Universal `render` + function-`style` composition.** Every
   rendered part now accepts `render` (element or `(props, state)`
   via the shared `render`/`slot` models) and value-or-function
   `style` where the part carries interaction state; stateless parts
   keep a static `style` (the `DialogTitle` precedent). Each part
   exports its state type (`ButtonState`, `SwitchState`, … — 40+
   new exports). `Button` composition closes the recorded gap the
   parity doc called out.
2. **`Input`/`Textarea` hard-cut to `onValueChange`** (contract §6;
   `Search` already used it). Host `TextInput` still receives RN
   `onChangeText`. Six internal consumers + two suites updated.
3. **`AlertDialog` rebuilt on the compound Dialog parts**
   (was monolith-only); all five existing behavior tests pass
   unchanged, plus `role="dialog"` added to compound
   `DialogPopup` (monolith parity).
4. **Toast queue** (scope item §4.16 / Q5): new pure
   `toastQueue` model (both barrels, unit-tested) + rendered
   `ToastProvider` (no element), `useToast()` manager
   (`add`/`dismiss`/`clear`; throws outside the provider),
   `ToastViewport` (oldest-first, optional `limit`). Mapping
   documented: queued `Toast` = Root, children = Title/Description,
   action = Action, timer = Close. Snackbar stays Kern-owned.
5. **Standalone Portal host** (scope item §4.20): `PortalHost`
   (`name?`) + `Portal` (`hostName?`) over the existing portal
   registry — its first real consumer. In-box painting (Menu
   precedent); no-match renders inline, never dropped.
6. **Docs**: parity record rewritten (universal composition,
   Button/Toast/Portal rows, Input rename, remaining
   compound-anatomy gaps table with blockers — mostly
   `collection` transfer); COVERAGE rows for Portal + queue;
   per-component notes (scripted Composition section + hand
   updates for button/toast/input/textarea/portal); changeset
   (minor, unpublished).

## Validation (all green)

`bun run test` · `bun run lint` (1 pre-existing warning in
`apps/example`, untouched) · `typecheck` · package `test`
(170) · `test:jest` (52 suites, 403 tests, incl. 4 new suites:
`renderparity`, `disclosureparity`, `toastqueue`,
`portalhost`, ~90 new tests) · `check:boundary` ·
`check:readme` (index regenerated, 47 rows) · `build` ·
`check:publish` (publint + attw).

## Deliberately not in this PR

Full compound anatomy for Select/Combobox/Tooltip/Field/etc.
(composition is aligned; anatomy gaps recorded with blockers —
needs `collection`, portal positioning, or a second consumer);
`Form`, virtualized/scroll primitives, gesture/Reanimated work
(all gated per the scope report). No tokens expended beyond this
report — work is complete, nothing was cut for length.

## Addendum: merge with main (conflict resolution)

main had moved (#49 reports, #50 AI chat models) so #53 showed
DIRTY. Merged `origin/main` into the branch (merge commit, no
rebase): four content conflicts, all keep-both-sides —
`index.ts`/`models.ts` (my `toastQueue` block beside main's
`toolCall` + chat-model blocks; models-parity gate holds),
`docs/COVERAGE.md` (my `toastQueue` model note beside main's chat
models paragraph), `docs/BASE_UI_PARITY.md` (my Toast/Portal/Input
sections beside main's AI-chat section). Main added pure models
only — no rendered parts, so nothing new needed the
render/function-style pattern. Full suite re-run green (vitest 25
files/237 tests incl. main's chat suites, jest 403, typecheck,
lint, boundary, readme, build, publint+attw). No code of this
branch changed by the merge beyond conflict markers.
