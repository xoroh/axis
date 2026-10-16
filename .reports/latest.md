# Status report — 2026-10-16 (Axis completion program, turn 7)

## Done this turn
- **PR #30 merged** (owner-approved): Menu compound parts.
- **Q5 closed**: `Drawer` is the edge-anchored panel;
  `NavigationDrawer` warn-once alias until removal; `Sheet`
  kept (detents/snap/drag genuinely different — recorded).
  PR #32 merged green.
- **PR #33 OPEN (large — for owner review/merge): Menu
  follow-ups.** Shared item-activation hook (Item/LinkItem
  differ in role only); `MenuLinkItem`, `MenuGroup`/
  `MenuGroupLabel`, `MenuArrow` (caller-positioned,
  documented); non-modal roots (`modal={false}`: in-box
  portal, no scrim, trigger toggles; outside-press limitation
  documented). RNTL +5 (full jest 56/408 green locally).
  Parity rows updated (checkbox/radio/filter/submenu-alias
  still pending).
- Positioning model `align`/`alignOffset` shipped inside #30
  (unit-tested, default center = zero regression).

## Decisions with rationale
1. **Single shared menu context + monolith no-op anchor
   registrar** (from #30): provably zero monolith behavior
   change, proven by its untouched green suite.
2. **Shared `useMenuItemActivation` hook** instead of a
   duplicated LinkItem body. *Rationale: the select/click/
   close sequence in two places is the silent-drift shape the
   slot model exists to prevent.*
3. **`MenuLinkItem` without `href`.** *Rationale: no URL
   handling exists on native; navigation is caller behavior —
   a decorative href prop would be dishonest API.*
4. **Non-modal = no-Modal in-box portal** (not just no
   scrim). *Rationale: a Modal still traps touches even
   without a scrim; true non-modal must paint in-box like the
   monolith.*
5. **`MenuGroup` renders all panels when open** (caller error
   of two panels shows both). *Rationale: visible over
   silent — dropping would hide caller bugs.*
6. **Q5 scoping: `Sheet` kept, not aliased.** *Rationale:
   detents + snap index + drag satisfy the owner's
   genuinely-different test.*

## No architecture conflicts escalated
Nothing this turn needed owner arbitration beyond the queued
large PR itself.

## Remaining program
1. Menu checkbox/radio/filter parts + submenu-alias evaluation.
2. Popover, Select, Combobox, Tooltip, controls families with
   parity rows; planned slices (focus containment, nested
   coordination, createHandle, transitions, README-example
   gate).
3. Q7 README split; Q6 example app (both with owner).
4. Rewrite readiness report WITH full parity, stop for
   confirmation. Kern untouched.

## Standing constraints (unchanged)
- Release HOLD: no publish/tags/versions. No Kern/token deps.
  No branches deleted. Behind-main races by rebase, never
  `--admin`. Small green PRs merged by agent; large ones
  reported for owner merge.
