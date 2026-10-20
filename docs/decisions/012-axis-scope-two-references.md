# 012. Axis scope: two references, four verdicts

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-19.

## Context

The Phase 1 scope audit (PR #77) counted 140 exported component symbols,
across 48 families and found the tree fully unstyled — but several families sit
in neither Base UI nor rn-primitives. The owner set two references and four
verdicts and signed off the resulting move table.

## Scope of this record

This ADR and the Phase 1 scope audit it builds on are scope and inventory
checks: which families Axis keeps, and how their anatomy maps onto
Base UI and rn-primitives (plus a grep-level unstyled check). They
are **not** behaviour reviews — they do not verify runtime
behaviour, gesture handling, measurement, focus/dismiss wiring,
platform accessibility mapping, or keyboard handling. Behaviour
review per family now lives in `docs/BASE_UI_PARITY.md` (rn-primitives
behaviour review plus real-device
testing are release-ready scope).

## Decision

What belongs in Axis is defined by two live references, both verified
2026-10-19 (Base UI `@base-ui/react` 1.9.0 per the docs badge;
rn-primitives "Unstyled on purpose … zero styles"):

- **Base UI** (`https://base-ui.com/react/overview/quick-start`, 37 components)
- **rn-primitives** (`https://rnprimitives.com/`, 27 core + Portal/Slot/Hooks/Types/Utils)

Rule: anything in Base UI **or** rn-primitives may stay **if it ships unstyled**.
Anything else stays only with a behavior-only reason Axis can own
(KEEP-RN). Styled, composite, or reason-less families move out
(MOVE-OUT). Nothing is deleted outright — moves land in consuming
design systems.

Verdicts:

- **KEEP-PARITY** — in Base UI and/or rn-primitives (named per family).
- **KEEP-RN** — outside both, with a one-line behavior-only reason.
- **STRIP** — stays, with listed styles/content to strip.
- **MOVE-OUT** — a consuming design system owns it, built on named Axis primitives.

## Agreed table

| Family | Verdict | What Axis provides |
|---|---|---|
| Overlay | KEEP-RN | No change (shared modality/dismissal/scroll-lock root). |
| Search | MOVE-OUT | Removed. Downstream rebuilds on Axis `Input` + `Field` + `Button`. |
| Loader | MOVE-OUT | Removed. `Progress` gains Base UI-exact indeterminate (`value={null}`); the `indeterminate` boolean is cut. |
| Text | MOVE-OUT | Export/docs/demo removed. Internals already use RN `Text` directly (verified: zero internal Axis-`Text` imports). |
| Trigger | drop export | Export/docs/demo removed. Verified zero internal imports, so pure removal (no internalization). `usePress`, `mergeSlotProps`, `SlotProps` stay exported. |
| Textarea | fold into Input | `Input` gains `multiline`, `autoGrow`, `minRows`/`maxRows`, `onHeightChange`. Textarea export/docs/demo removed; input docs/demo updated. |
| Sheet | fold into Drawer | Base UI exact names: `snapPoints`, controlled `snapPoint` + `onSnapPointChange` (NOT `activeSnapPoint`), swipe-to-dismiss with `dismissable`, modal + non-modal. |
| Calendar | remove + model | Component removed. New `./models` `calendar` model (RN-free): month-grid generation, roving focus + keys (arrows/PageUp/PageDown/Home/End), min/max + `isDateDisabled`, single + range selection, locale, `firstDayOfWeek`, dir. Existing behavior/tests move, not rewritten. |
| TimePicker | remove | Component removed. `time` model stays; `TimePickerValue`/`TimePickerFormat` stay exported (moved into the `time` model if they live in the component). |
| OtpField | fix | Capture `TextInput` becomes behavior-hidden but focusable (minimal layout only, caller-overridable) + test. |

## Verify results (condition 1, checked live before any change)

- **Drawer snapPoints: CONFIRMED.** `https://base-ui.com/react/components/drawer`
  documents `snapPoints` (0–1 fractions or px, `'148px'`/`'30rem'` strings),
  `snapPoint`, `defaultSnapPoint`, `onSnapPointChange`, `snapToSequentialPoints`,
  `swipeDirection`, `modal={false}` non-modal, swipe-to-dismiss. Sheet fold proceeds.
- **OtpField: CONFIRMED** in Base UI (`.../otp-field`: Root/Input/Separator, `length`,
  `autoSubmit`, `onValueComplete`, `mask`). Axis OtpField stays.
- **Button / Autocomplete: CONFIRMED** in Base UI (live docs nav on three fetched
  pages; Autocomplete is Base UI's distinct-from-Combobox component).
- **Progress indeterminate: CONFIRMED** (`.../progress`: `value: number | null`,
  "indeterminate when value is null"). Axis adopts `value={null}` exactly.
- **Search / Loader / Text / Trigger / Textarea / Calendar / TimePicker: CONFIRMED
  in neither reference** (absent from all fetched Base UI navs and the rn-primitives
  core/shared lists). Moves/folds proceed per the table above.
- **Downstream impact: none.** No consumer imports Axis components directly
  (models/hooks only, re-verified 2026-10-19).

## Consequences

- `docs/BASE_UI_PARITY.md`, `docs/COVERAGE.md`, the package README index
  (`check:readme`) are updated with each move.
- CHANGELOG `Unreleased` carries one migration line per removed/renamed export.
  This is a deliberate, scoped exception to the "stays empty" convention: with
  breaking pre-1.0 cuts landing, the migration record must be readable where
  consumers look. Versions and publishes go through the release pipeline
  (`docs/RELEASING.md`).
- If a later family turns out to be in neither reference, it returns through
  KEEP-RN (with reason) or MOVE — recorded here, not silently kept.

## Status

Accepted. Executes as PRs A–E on the scope lane (removals + Progress null-value;
Textarea→Input; Sheet→Drawer; calendar model + Calendar/TimePicker removal;
OtpField fix + final parity docs); each squash-merged green.
