# Status report — 2026-10-16 (Axis completion program, turn 6)

## Done this turn
- **PR #30 OPEN (large — for owner review/merge, not merged by
  agent): Base UI alignment slice 2, Menu family.** Compound
  parts (Root/Portal/Backdrop/Positioner/Popup/Separator) with
  `render` composition + value-or-function styles; Trigger/Item
  extended in place with zero monolith behavior change
  (monolith + dropdown/nav/menubar suites green unmodified);
  positioning model `align`/`alignOffset` (unit-tested);
  DialogRoot `onDismiss` consistency. RNTL 12 new (full jest
  56 suites / 403 tests green locally). Parity row aligned.
- Earlier turns' merges confirmed on main (through #28).

## Decisions with rationale (small/medium, per mandate)
1. **Single shared menu context** (not separate monolith/
   compound contexts): both roots fill the same disclosure
   type; monolith provides a no-op anchor registrar so the new
   trigger registration cannot move its measured anchor.
   *Rationale: one state shape, zero monolith behavior change
   provable by its untouched suite.*
2. **Monolith `Menu` tree byte-identical** (in-box scrim,
   partition, labels); compound `Portal` uses `Modal`.
   *Rationale: existing consumers keep exact behavior;
   escaping clipped parents is the compound's raison d'être.*
3. **`MenuItem.value` optional + `onClick`/`closeOnClick` added**
   (Base shape) while `onSelect(value)` stays. *Rationale:
   pre-1.0 parity with compat; cascade identity (DropdownMenu)
   still needs values. Fire order: onSelect → onClick → close.*
4. **`highlighted` = pressed** in item state (no hover/keyboard
   on touch). *Rationale: only observable highlight signal;
   recorded as the touch adaptation.*
5. **Positioning `align` defaults to center** (historical
   behavior — zero regression by construction), `alignOffset`
   additive. *Rationale: Base parity without disturbing the
   five existing positioned families.*
6. **No new `modal` prop on MenuRoot** (compound always
   presents a Backdrop; non-modal deferred with the
   press-capture reason). *Rationale: matches Base default;
   the variant needs press-capture that would hijack touches.*
7. **Checkbox/Radio/Group/LinkItem/Arrow/Filter parts deferred
   to later slices** (recorded in parity, not silent).
   *Rationale: each needs its own controlled-state API design;
   lumping them here would halve the review quality.*
8. **`MenuTrigger.children` made optional** (render can supply
   content). *Rationale: required-children + render is
   contradictory API.*

## No architecture conflicts escalated
Nothing this turn needed owner arbitration beyond the queued
large PR itself.

## Remaining program
1. Menu follow-ups (checkbox/radio/group/link/filter parts).
2. Popover, Select, Combobox, Tooltip, controls families with
   parity rows.
3. Planned (from quality bar): focus containment, nested
   coordination, createHandle, transitions, README-example
   accuracy gate.
4. Rewrite readiness report WITH full parity, stop for
   confirmation. Kern untouched.

## Standing constraints (unchanged)
- Release HOLD: no publish/tags/versions. No Kern/token deps.
  No branches deleted. Behind-main races by rebase, never
  `--admin`. Open owner calls: Q5–Q7 + release timing.
