# Axis scope audit — 2026-10-19

Phase 1, read-only. No code changes. Branch `chore/axis-scope-audit`, worktree `axis-scope`.
Amendment applied (Axis Lead steer, Faroeq 04:48 CEST): two references (Base UI **and**
rn-primitives); verdicts KEEP-PARITY / KEEP-RN / STRIP / MOVE-KERN; no REMOVE.

## 1. References

### 1a. Base UI — current list, 37 components

- Source: `https://base-ui.com/react/overview/quick-start` (docs nav, fetched 2026-10-19).
- Version: `@base-ui/react` **1.9.0** (npm badge on the docs site that day; re-verify at execution).
- Utils (not components): CSP Provider, Direction Provider, `mergeProps`, `useRender`.
- List: Accordion, Alert Dialog, Autocomplete, Avatar, Button, Checkbox, Checkbox Group,
  Collapsible, Combobox, Context Menu, Dialog, **Drawer**, Field, Fieldset, Form, Input,
  Menu, Menubar, Meter, Navigation Menu, Number Field, OTP Field, Popover, Preview Card,
  Progress, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast,
  Toggle, Toggle Group, Toolbar, Tooltip.

### 1b. rn-primitives — 27 core + 5 shared, zero styles

- Source: `https://rnprimitives.com/` (+ `#core-primitives`), fetched 2026-10-19.
  Tagline verified: "Unstyled on purpose … Every primitive ships zero styles."
- Core: Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Collapsible, Context Menu,
  Dialog, Dropdown Menu, **Hover Card**, Label, Menubar, Navigation Menu, Popover, Progress,
  Radio Group, Select, Separator, Slider, Switch, **Table**, Tabs, Toast, Toggle,
  Toggle Group, Toolbar, Tooltip.
- Shared: Hooks, **Portal**, **Slot**, Types, Utils.

## 2. Axis inventory vs docs vs demos — the 140 explained

- `packages/axis/src/index.ts` exports **140 PascalCase component symbols** across **48 families**
  (counted programmatically from the barrel; per-family counts in §4).
- `docs/components/*.md` has **48 pages** — exactly one per family. No gap.
- `apps/example/src/demos/` has **14 demo modules + registry** (not 140 demos).
  `node apps/example/scripts/check-demo-coverage.mjs` (the `check:demos` gate) counts the same
  140 barrel symbols and asserts each appears in ≥1 demo module. Current result:
  `demo coverage holds: all 140 components demoed.` So "140" = covered component symbols
  (families + parts), not demo files.
- `./models` subpath (`packages/axis/src/models.ts`) mirrors the model sections of the `.` entry
  exactly: a11y, attachments, chatBranch, chatMessage, chatSource, chatStatus, collection,
  dismissPolicy, dismissWiring, focusTrap, overlayModality, portal, positioning, presence, press,
  promptInput, reasoning, render, roving, selection, slot, stickToBottom, time, toastQueue,
  toolCall, typeahead, useControllableState. No rendered components; boundary-gated RN-free.

## 3. Styling check — method and result

Grep over `packages/axis/src/components/` (all 47 `.tsx` + 1 `.ts`):

- `StyleSheet` (create/flatten/compose): **0 hits** in components.
- Case-insensitive `color|backgroundColor|fontSize|fontWeight|fontFamily|borderRadius|borderWidth|
  shadow|elevation|opacity|letterSpacing|lineHeight|textTransform|theme|token|palette`: hits are
  **comments only** ("No colors…", "NO typographic scale") plus two legitimate behavior items —
  `Loader` `size`/`color` passthrough to RN `ActivityIndicator` (Loader.tsx:20-23,67,107) and
  the measurement style `opacity: 0` in `useFloatingPlacement.ts:90`.
- All remaining inline styles are layout/positioning the behavior strictly needs, always
  caller-overridable: absolute-fill scrims (`Menu.tsx:361-367 SCRIM_FILL`, `Popover.tsx:136-142`,
  `Select.tsx:1244-1260`, `ContextMenu.tsx:156-163`, `Overlay.tsx:538-612 FULL_FILL_STYLE`),
  `flex:1`/`justifyContent:flex-end` sheet/drawer containers (`Sheet.tsx:376,388,391`,
  `Drawer.tsx:200,206,209`), `translateY` detent transform (`Sheet.tsx:333-336,361-364`),
  `aspectRatio` (`AspectRatio.tsx:108`), `width: %` fills
  (`Meter.tsx:120`, `Progress.tsx:139`, `Slider.tsx:263`), `flexDirection:row` defaults
  (`Menubar.tsx:208`, `NavigationMenu.tsx:401`, `Toolbar.tsx:109-111`), floating placement
  (`floating.style` merges), autoGrow height (`Textarea.tsx:141-145`).

**Result: the tree is unstyled. Nothing ships a color, type scale, spacing system, radius,
shadow, elevation, token, or theme. STRIP list (§5) has one content item, not a styling item.**

## 4. Family table

Kern usage (one finding for all rows): **Kern imports zero Axis components.** Grep over
`kern/packages/*/src`, `kern/apps/*/src`, `kern/libs/*/src` for `from "@xoroh/axis"` returns only
models/hooks (`useControllableState`, `useSelection`, `mergeSlotProps`/`SlotProps`, `usePress`,
`usePresence`, `useRovingModel`, `createIdScope`, `resolveDir`, `resolveFloatingRect`).
`kern-axis-adopt` does not exist (no such directory), so nothing to grep there. Evidence: §3 of
`.reports/research-scope-axis-vs-kern.md` (2026-10-16) re-verified today. **Kern-usage column is
"none" for every row; it is omitted per-row and stated here once.**

Legend: B = in Base UI · R = in rn-primitives · counterpart names the BUI/RNP component.

| # | Family (exports) | B | R | Counterpart | Styling found | Verdict | Reason |
|---|---|---|---|---|---|---|---|
| 1 | Accordion (2: Accordion, AccordionItem) | y | y | Base UI Accordion; RNP Accordion | none | KEEP-PARITY | Both refs. |
| 2 | AlertDialog (1) | y | y | Base UI Alert Dialog; RNP Alert Dialog | none | KEEP-PARITY | Both refs. |
| 3 | AspectRatio (1) | n | y | RNP Aspect Ratio (Radix aspect-ratio) | none — ratio travels in plain style object, caller-overridable (AspectRatio.tsx:96-108) | KEEP-PARITY | In RNP. |
| 4 | Autocomplete (1) | y | n | Base UI Autocomplete (distinct from Combobox) | none | KEEP-PARITY | In Base UI. |
| 5 | Avatar (1) | y | y | Base UI Avatar; RNP Avatar | none | KEEP-PARITY | Both refs. |
| 6 | Button (1) | y | n | Base UI Button | none | KEEP-PARITY | In Base UI. |
| 7 | Calendar (1) | n | n | — (React Aria Calendar is the headless precedent, not a reference) | none — day cells are role+label only (Calendar.tsx:324,337,373) | KEEP-RN | Date-grid keyboard/AT behavior with min/max; no RN core equivalent; Kern cannot own neutral date math. |
| 8 | Checkbox (1) | y | y | Base UI Checkbox; RNP Checkbox | none | KEEP-PARITY | Both refs. |
| 9 | CheckboxGroup (2) | y | n | Base UI Checkbox Group | none | KEEP-PARITY | In Base UI. |
| 10 | Collapsible (3) | y | y | Base UI Collapsible; RNP Collapsible | none | KEEP-PARITY | Both refs. |
| 11 | Combobox (1) | y | n | Base UI Combobox | none | KEEP-PARITY | In Base UI. |
| 12 | ContextMenu (1) | y | y | Base UI Context Menu; RNP Context Menu | none | KEEP-PARITY | Both refs. |
| 13 | Dialog (9 parts) | y | y | Base UI Dialog; RNP Dialog | none | KEEP-PARITY | Both refs. |
| 14 | Drawer (1) | y | n | Base UI Drawer | none — flex layout only (Drawer.tsx:174,200,206,209) | KEEP-PARITY | In Base UI (ADR-002 name). |
| 15 | DropdownMenu (6 parts) | partial | y | RNP Dropdown Menu; Base UI Menu family (dropdown usage) | none | KEEP-PARITY | In RNP; covered by Base UI Menu semantics. |
| 16 | Field (1) | y | n | Base UI Field | none | KEEP-PARITY | In Base UI. |
| 17 | Fieldset (1) | y | n | Base UI Fieldset | none | KEEP-PARITY | In Base UI. |
| 18 | Input (1) | y | n | Base UI Input | none | KEEP-PARITY | In Base UI. |
| 19 | Label (1) | n | y | RNP Label (Base UI Field.Label is the part-level cousin) | none | KEEP-PARITY | In RNP. |
| 20 | Loader (1) | n | n | — (RN `ActivityIndicator` host) | none — `size`/`color` are caller passthrough, no defaults (Loader.tsx:20-23,107) | KEEP-RN | Busy-state announcement wrapper; no reference equivalent but owns AT presence semantics Kern must not duplicate. |
| 21 | Menu (24 parts) | y | n | Base UI Menu | none — absolute-fill scrim is positioning, no color (Menu.tsx:361-367) | KEEP-PARITY | In Base UI. |
| 22 | Menubar (2) | y | y | Base UI Menubar; RNP Menubar | none — default row direction is layout, caller-overridable (Menubar.tsx:208) | KEEP-PARITY | Both refs. |
| 23 | Meter (1) | y | n | Base UI Meter | none — `%` width fill is the gauge reading (Meter.tsx:120) | KEEP-PARITY | In Base UI. |
| 24 | NavigationMenu (4 parts) | y | y | Base UI Navigation Menu; RNP Navigation Menu | none — default row direction is layout (NavigationMenu.tsx:401) | KEEP-PARITY | Both refs. |
| 25 | NumberField (1) | y | n | Base UI Number Field | none | KEEP-PARITY | In Base UI. |
| 26 | OtpField (1) | y | n | Base UI OTP Field (Radix OTP precedent) | none — cells/styles all caller-provided (OtpField.tsx:64-67,194-198) | KEEP-PARITY | In Base UI. |
| 27 | Overlay (7 parts) | n | n | — (Axis-invented shared overlay root) | none — fill+zIndex positioning only (Overlay.tsx:538,594,612) | KEEP-RN | Shared modality/dismissal/scroll-lock root composed by Dialog/Popover/Menu/Drawer; RN Modal plumbing Kern cannot own. |
| 28 | Popover (11 parts) | y | y | Base UI Popover; RNP Popover | none — scrim is absolute-fill, no color (Popover.tsx:132-142) | KEEP-PARITY | Both refs. |
| 29 | Portal (2: Portal, PortalHost) | n | y | RNP shared Portal/PortalHost | none | KEEP-PARITY | In RNP shared primitives. |
| 30 | Progress (1) | y | y | Base UI Progress; RNP Progress | none — `%` width is the reading (Progress.tsx:139) | KEEP-PARITY | Both refs. |
| 31 | RadioGroup (2) | y | y | Base UI Radio Group; RNP Radio Group | none | KEEP-PARITY | Both refs. |
| 32 | Search (1) | n | n | — (React Aria SearchField is the headless precedent, not a reference) | one content item: hardcoded `"×"` clear glyph (Search.tsx:151) — see STRIP §5 | KEEP-RN | Entry+clear+submit behavior with no filtering; React Aria SearchField parity; single-purpose mobile entry Kern should consume, not own. Judgment call — flagged for sign-off. |
| 33 | Select (15 parts) | y | y | Base UI Select; RNP Select | none | KEEP-PARITY | Both refs. |
| 34 | Separator (1) | y | y | Base UI Separator; RNP Separator | none by design (Separator.tsx:6-15) | KEEP-PARITY | Both refs. |
| 35 | Sheet (1) | n | n | — (mobile standard: gorhom-bottom-sheet pattern) | none — detent/drag math + flex anchoring only (Sheet.tsx:310,333-336,376) | KEEP-RN | Detent/drag bottom-sheet behavior distinct from Drawer; no reference equivalent, no RN core equivalent; Kern M3 sheet styling already consumes this pattern. |
| 36 | Slider (1) | y | y | Base UI Slider; RNP Slider | none — `%` fill is the reading (Slider.tsx:263) | KEEP-PARITY | Both refs. |
| 37 | Switch (1) | y | y | Base UI Switch; RNP Switch | none | KEEP-PARITY | Both refs. |
| 38 | Table (4 parts) | n | y | RNP Table | none by design (Table.tsx:6-15) | KEEP-PARITY | In RNP. |
| 39 | Tabs (4 parts) | y | y | Base UI Tabs; RNP Tabs | none | KEEP-PARITY | Both refs. |
| 40 | Text (1) | n | n | — (RN `Text` host) | none by design: "deliberately NO typographic scale" (Text.tsx:11-15) | KEEP-RN | Shared unstyled text leaf carrying Axis render/testID/ref conventions; every family renders caller text through it. Borderline per ADR-009 — flagged for sign-off. |
| 41 | Textarea (1) | n | n | — (React Aria TextField-multiline precedent; Reusables styled skin proves the headless need) | none — `numberOfLines = 3` is a host-prop default, not a visual (Textarea.tsx:82) | KEEP-RN | Multiline + autoGrow behavior; no reference or RN-core equivalent; Kern cannot own neutral text-entry math. |
| 42 | TimePicker (1) | n | n | — (React Aria TimeField precedent) | none — 24h normalization/step arithmetic in `time.ts` model | KEEP-RN | Time-value behavior with no reference or RN-core equivalent; Kern cannot own neutral time math. |
| 43 | Toast (3: Toast, ToastProvider, ToastViewport + useToast) | y | y | Base UI Toast (Provider/queue/viewport mapped, Toast.tsx:214-232); RNP Toast | none — "No default visuals" (Toast.tsx:26-34); plain `Text` message + `Pressable` action | KEEP-PARITY | Both refs. |
| 44 | Toggle (1) | y | y | Base UI Toggle; RNP Toggle | none | KEEP-PARITY | Both refs. |
| 45 | ToggleGroup (2) | y | y | Base UI Toggle Group; RNP Toggle Group | none | KEEP-PARITY | Both refs. |
| 46 | Toolbar (1) | y | y | Base UI Toolbar; RNP Toolbar | none — orientation→flexDirection is layout (Toolbar.tsx:109-111) | KEEP-PARITY | Both refs. |
| 47 | Tooltip (8 parts) | y | y | Base UI Tooltip; RNP Tooltip | none | KEEP-PARITY | Both refs. |
| 48 | Trigger (1) | n | n | — (concept: Base UI `useRender`/asChild composition; RN `Pressable` host) | none by design: "deliberately NO accessibilityRole" (Trigger.tsx:7-27) | KEEP-RN | Semantics-free press container with terminal-disabled guard; prevents role misuse of Button; composed inside Tabs/composites. Kern must not own role-less plumbing. |

Totals: **KEEP-PARITY 39 · KEEP-RN 9 · MOVE-KERN 0 · STRIP items 1 (content, §5).**

Models (`./models`, incl. AI chat behavior models per ADR-010): all behavior-only, RN-free,
boundary-gated — **KEEP** as the universal zone. No verdict change proposed.

## 5. STRIP list (KEEP items with content to strip or confirm)

1. `packages/axis/src/components/Search.tsx:151` — hardcoded `"×"` clear glyph
   (`<Text>×</Text>`). Only visual-content default in the tree. Strip to a caller-provided
   clear affordance (render prop / `clearElement`), defaulting to no glyph. Phase 2 item.
2. `packages/axis/src/components/OtpField.tsx:204-211` — capture `TextInput` carries **no**
   hiding style (renders in flow). Confirm intentional in Phase 2 (hide via caller style or
   collapse axis-side); not a strip — a confirm.
3. `packages/axis/src/components/Textarea.tsx:82` — `numberOfLines = 3` default. Host-prop
   default, not a visual; keep, documenting as behavior.
4. `Search.tsx:90`, `Dialog.tsx:203,552,562`, `Drawer.tsx:203`, `Autocomplete.tsx:278`,
   `Combobox.tsx:371` — hardcoded `"Dismiss"` / `"Clear search"` accessibility labels.
   Accessibility strings, caller-overridable, not visuals; keep, no strip.

## 6. Primitives in the references but missing from Axis

| Missing | In | Axis status |
|---|---|---|
| Form | Base UI | No owner yet (parity doc §270 notes "Form has no owner yet"). Phase 2: adopt headless Form or defer explicitly. |
| Scroll Area | Base UI | `na-native` per COVERAGE:53-54 (native ScrollView covers it). Documented; no action unless owners disagree. |
| Preview Card / Hover Card | Base UI / RNP | `na-native` per COVERAGE:54 (hover-only, no touch equivalent). Documented; Kern web covers preview-card. |
| Slot (standalone component / asChild) | RNP shared | `slot` **model** exists (`composeEventHandlers`, `mergeSlotProps`) and every part takes `render`; no `Slot` component export. Phase 2: decide whether a standalone `Slot` export is needed or the `render` prop already covers it. |
| Direction Provider | Base UI utils | Covered by the `a11y` model (`createIdScope`, `resolveDir`); no component needed. No action. |
| `mergeProps` / `useRender` | Base UI utils | Covered by `slot` model + universal `render` prop. No action. |

## 7. ADR / VISION / IDEAS check

- VISION (north star: unstyled token-free RN primitives; p5 behavior-in-Axis): findings conform.
  No VISION change needed.
- ADR-001 (Base UI parity): conforms; DropdownMenu maps to RNP + Base UI Menu family (record in
  parity doc, no ADR change).
- ADR-002 (Drawer name): conforms; Drawer kept per Base UI.
- ADR-006 (scope primitives-only; 21 moves): already executed as `653055b` (#45) — this audit
  finds **zero remaining styled/composite families**, so no new move is proposed and no ADR-006
  supersession is needed. If owners disagree on any of the 9 KEEP-RN verdicts (esp. Search,
  Text), the change is a new decision record, not a 006 supersession.
- ADR-007/008 (two zones, no web): conforms; models zone clean.
- ADR-009 (no core wrappers): Text, Trigger, Loader, Separator are pure-host-adjacent. Each adds
  behavior/conventions beyond core (render substitution, terminal-disabled guard, busy announce,
  documented role silence). No violation found, but **Text is flagged for explicit owner
  confirmation** since it is the thinnest wrapper.
- ADR-010 (AI chat models in Axis): conforms; chat models present as behavior only.
- ADR-011 (no compat): conforms; nothing to deprecate (no MOVE items).
- IDEAS: scope-review idea already accepted→ADR-006 (this audit is its follow-through);
  AI-chat idea placed (consistent). No new ideas proposed.

## 8. Proposed removal/migration order

**Nothing to remove or migrate.** The tree holds no styled, composite, or design-pattern
component — ADR-006's 21 moves (commit `653055b`, #45) already cleared them, and the audit
confirms zero backslide. Phase 2 therefore needs no migration PR, only:

1. Owner sign-off on the 9 KEEP-RN verdicts (flagged: Search, Text).
2. STRIP item 1 (Search `"×"` glyph) — small cleanup PR.
3. Confirm item 2 (OtpField capture-input hiding).
4. Parity-doc updates: record DropdownMenu→RNP mapping, missing-Form/Slot decisions (§6).
5. Note to Kern Lead: no action — Kern imports zero Axis components, so every verdict is
   impact-free in `kern` (models/hooks imports unaffected).

## 9. Commands run + real output

- `git worktree add …/axis-scope -b chore/axis-scope-audit origin/main` → HEAD `f6fcbdf`.
- Barrel count (Python over `index.ts`): **140 component symbols, 48 families** (table above).
- `node apps/example/scripts/check-demo-coverage.mjs` → `demo coverage holds: all 140 components demoed.`
- `grep -rn "StyleSheet" packages/axis/src/components/` → **0 hits**.
- `grep -rniE "color|fontSize|…|theme|token" packages/axis/src/components/` → comments +
  Loader passthrough + measurement opacity only (listed §3).
- Base UI fetch `https://base-ui.com/react/overview/quick-start` → 37 components (listed §1a).
- rn-primitives fetch `https://rnprimitives.com/` → 27 core + shared (listed §1b).
- Kern grep `from "@xoroh/axis"` over `packages/*/src apps/*/src libs/*/src` → models/hooks only,
  zero component imports; `kern-axis-adopt` does not exist.
