# Overlay root on PortalHost

Brief: 2026-10-17-overlay-root · Branch `feat/axis-overlay-root` ·
worktree `/tmp/opencode/axis-overlay-root` · base `82c3179` (main).

PROJECT: Axis · LEAD: Axis Lead · BRIEF: 2026-10-17-overlay-root
GOAL: one native overlay root on `PortalHost` that owns dismissal,
modal, stacking, scroll lock and presence — with Dialog, AlertDialog,
Popover, Menu and Drawer presenting through it instead of an RN
`Modal` each.
WHY: Kern needs one overlay substrate (P0 #2 in the Kern needs list,
referenced as `.reports/kern-needs-from-axis.md`, not present in this
repo — tracked below as a gap). Per-component `Modal` hosts meant
stacking, back-button handling, focus and dismissal were re-solved in
every overlay, and nested modals could not coordinate at all.

SCOPE: `packages/axis/src/components/{Overlay,Dialog,Popover,Menu,Drawer}.tsx`,
`packages/axis/src/{overlayModality,index,models}.ts`, `packages/axis/scripts/lib/boundary-policy.mjs`,
`packages/axis/src/*.rntest.tsx`, `.changeset/`, `.reports/`.
OUT OF SCOPE: `docs/components/**` (docs thread), `apps/example/**`
(b0f21cc5), `Sheet`/`Combobox` (not in the assigned list),
Select/Menu parity work on `d8fd88db`.

## Outcome

Delivered. The overlay root exists and every assigned surface presents
through it; no assigned component mounts an RN `Modal` any more.
**Not mergeable yet without one thing from another thread** — see
"Gaps for other leads".

## Acceptance

1. **Overlay root observable** — PASS. `overlayroot.rntest.tsx`,
   12 RNTL tests through the public entry: portal paints at
   `PortalHost`, inline fallback with no host, closed paints nothing,
   outside-press dismissal (and refusal when `dismissable={false}`),
   Android `BackHandler` topmost-only, monotonic `zIndex` + top-layer
   isolation, lower-layer promotion on close, modal scroll lock,
   focus restore, `useOverlay`, `Overlay.*` namespace parity.
2. **No RN `Modal` in the migrated families** — PASS.
   `grep -n "<Modal" packages/axis/src/components/*.tsx` returns only
   `Overlay.tsx` (the opt-in `useModal` escape hatch) and `Sheet.tsx`
   (not in the assigned list; drag/detent surface, still its own).
3. **No consumer regression** — PASS. Full suite: jest 53 suites /
   415 tests, vitest 25 files / 237 tests, root `bun test`, typecheck,
   lint, `check:boundary`, `check:readme`, build, `publint` + `attw`.
4. **Fails before / passes after** — PASS. Before this branch no
   overlay owned back-button or stacking: the `BackHandler` assertion
   and the stacking assertions cannot pass without the root (there was
   no registry crossing component boundaries). After: the same suite
   is green.
5. **Demo gate** — FAIL (deliberately, owned by another thread). Listed
   below.

## Commands run + real output

```
bun run test                                    → 0 fail (2 tests)
bun run lint                                    → Found 1 warning (pre-existing apps/example/src/demos/switch.tsx)
bun run --filter @xoroh/axis typecheck          → Exited with code 0
bun run --filter @xoroh/axis test               → Test Files 25 passed / Tests 237 passed
bun run --filter @xoroh/axis test:jest          → Test Suites 53 passed / Tests 415 passed
bun run --filter @xoroh/axis check:boundary     → boundary holds: models pure; components RN-host-only; internals unexported.
bun run --filter @xoroh/axis check:readme       → check-readme holds
bun run --filter @xoroh/axis build              → Exited with code 0
bun run --filter @xoroh/axis check:publish      → Exited with code 0 (publint + attw all green)
bun run --filter @xoroh/axis-example check:demos→ FAILED: missing demos for 7 component(s):
                                                  Overlay, OverlayBackdrop, OverlayClose, OverlayPopup,
                                                  OverlayPortal, OverlayRoot, OverlayTrigger
```

Screenshots: none — this is a headless RN behavior substrate with no
visual surface (Axis is unstyled by contract; the example app that
would render it belongs to another thread). The "ran it and looked"
step was done through the RNTL trees and host props instead: the
stack test asserts the real `zIndex` / `pointerEvents` /
`accessibilityElementsHidden` values the mounted layers carry.

## What is in the branch

- **`Overlay.tsx` (new)** — `OverlayRoot`, `OverlayPortal`,
  `OverlayBackdrop`, `OverlayPopup`, `OverlayTrigger`,
  `OverlayClose`, the `Overlay.*` namespace, `useOverlay`,
  `useScrollLock`. Dismissal runs through the existing
  `dismissBranchesFor` / `shouldDismissOn` models; presence through
  `usePresence`; modality through a new shared registry.
- **`overlayModality.ts`** — added `getSharedOverlayModality()` and
  the `OverlayModalityRegistry` type so stacking is app-wide rather
  than per component (this is the first real consumer of the model
  that ships: it was previously exported but unused).
- **Migrations** — `Dialog` (monolith + compound `DialogRoot`/
  `DialogPortal`), `Popover`, `Menu`, `Drawer` wrap their roots in
  `OverlayRoot` and present through `OverlayPortal`.
  `AlertDialog` inherits it through `DialogRoot`. Stale prose that
  still claimed an RN `Modal` host was corrected in each file.
- **Boundary** — `BackHandler`, `AccessibilityInfo`, `findNodeHandle`
  added to `RN_HOST_BINDINGS` with the justification comment the
  policy file requires.

## Decisions worth reviewing

1. **Presence could never exit.** As first written, `presence.state`
   stayed `exiting` forever unless reduced motion was on, so
   `present` never fell to `false` and a closed overlay stayed
   painted. Axis ships no exit animation (parity D9), so the exit now
   completes in the same commit; the machine stays wired for the first
   consumer that drives an animation. Caught by review of my own
   diff, not by a test — worth a look from the Lead.
2. **`accessibilityViewIsModal` placement.** It first went on the
   popup, which hid the popup's own backdrop (the flag hides
   everything that is not a *descendant* of the marked view), then on
   every layer, which made stacked layers hide each other. It now
   sits on the topmost modal layer only. This is a deliberate
   observable change: while a modal is open, content behind it is now
   hidden from assistive tech, which is the correct platform semantic
   but updated two pre-existing assertions
   (`dialogparts.rntest.tsx`, `menuparts.rntest.tsx`) to query the
   trigger with `includeHiddenElements`.
3. **Web-only code removed.** The first draft bound Escape through
   `globalThis.document` and locked scroll via `document.body.style`.
   Axis is native-only, so that was dead code. Native binds
   outside-pointer and system-back; `escape`/`focus-out` stay
   *declared* in the branch set (platform-free by design, per
   `dismissWiring`) and are documented as unbound natively.
4. **Contexts are not public API.** `OverlayContext` and
   `ScrollLockContext` are module-private; consumers read them through
   `useOverlay()` / `useScrollLock()`. This also cut the demo debt
   from nine exports to seven.
5. **Focus containment is still not a trap.** What ships is the modal
   flag plus focus move/restore through `AccessibilityInfo`.
   Traversal trapping still needs the `focusTrap` RN adaptation
   (parity D5). Documented in the module note, not faked.

## What's still weak (honest)

- **No animation.** Presence is wired but nothing animates, so the
  exit path is untested against a real exit. A consumer driving one
  is the first real test of `finishExit`.
- **Scroll lock is advisory.** `useScrollLock()` tells a surface it
  is behind a modal; the host still has to honor it (set
  `scrollEnabled` on its own lists). No global mechanism exists on RN.
- **Focus trap incomplete** (see decision 5).
- **Sheet and Combobox still own an RN `Modal`** / in-box scrims.
  Out of the assigned list; the same migration applies to Sheet when
  someone picks it up.
- **Select was not migrated.** It never used an RN `Modal` (it
  presents in-box with its own scrim), so the stated acceptance
  criterion is already met for it. Moving its list into the portal
  would change its presentation semantics, and `Select.tsx` is being
  edited on `d8fd88db` — deliberately left alone rather than
  colliding.
- **Test flakiness risk:** the shared registry is module-global, so
  suite order matters if a test leaves an overlay mounted.

## Gaps for other leads

1. **Demo gate (blocking CI, one-line task).** `check:demos` fails for
   the seven Overlay parts. `apps/example/**` is owned by b0f21cc5 and
   the Lead told me to stay off it, so I did not write them. Either
   assign them, or let me add one `overlays`-style demo file — the
   parts compose in ~20 lines.
2. **`.reports/kern-needs-from-axis.md` does not exist in this repo.**
   The brief cites it for Kern P0 #2; only
   `research-scope-axis-vs-kern.md` is present. The Kern call sites
   could not be checked against their real usage — worth confirming
   the expected API shape (names, prop spelling) before Kern adopts it.
3. **`docs/components/**` untouched** per instruction: there is no
   `overlay.md` and `docs/BASE_UI_PARITY.md` still lists the overlay
   deviations (D5/D9) without the new root. The docs thread should add
   an Overlay page and update the parity record's deviation rows now
   that focus move/restore and the modal flag are real.
4. **Boundary allowlist grew.** `BackHandler`, `AccessibilityInfo`,
   `findNodeHandle` were added for this one component. The policy file
   says additions are a deliberate per-PR decision; flagging so the
   Lead can confirm the single owner is acceptable.

## Suggested next item

`Sheet` and `Combobox` onto the overlay root (the two surfaces left
owning an RN `Modal` / a bespoke scrim), then the `focusTrap` RN
adaptation so `D5` can move from "declared" to "implemented".