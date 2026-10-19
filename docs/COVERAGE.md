# Axis component coverage inventory

Status key: `complete` (implemented + tested + documented) · `partial`
(implemented but incomplete) · `missing` · `na-native` (no meaningful
native equivalent, reason given) · `deferred` (concrete blocker given).

Behavior models are listed for traceability; they are not components.
Sources: RNP catalogue (`roninoss/rn-primitives`), Base UI catalogue
(composition/API reference only — no web implementation code), and
`packages/kern-native` consumer needs.

## Rendered components

| Component | Status | Notes |
|---|---|---|
| Switch | complete | First slice; Pressable + role/state, controlled/uncontrolled, RNTL 7 |
| Checkbox | complete | Pressable + box/check views, controlled/uncontrolled, RNTL 7 | |
| Checkbox Group | complete | multi-select group, RNTL 7 |
| Radio Group | complete | single-select group + items, RNTL 8 |
| Toggle | complete | pressed-state button, RNTL 7 |
| Toggle Group | complete | pressed-state set, RNTL 5 |
| Slider | complete | PanResponder drag + actions, RNTL 9 |
| Button | complete | press/disabled/loading + busy, RNTL 7 |
| Field | complete | compound Root/Label/Control/Description/Error/Validity + monolith adapter, RNTL 22 |
| Form | complete | submit gating + server errors + validate/clear actions, RNTL 13 |
| Fieldset | complete | legend group (in fieldset suite), RNTL 3 |
| Label | complete | nativeID association, RNTL 2 |
| Input | complete | controlled/uncontrolled entry + multiline/autoGrow/rows, RNTL 10 |
| Number Field | complete | compound parts + scrub + hold + locale, RNTL 38 |
| OTP Field | complete | segmented entry + auto-submit, RNTL 10 |
| Autocomplete | complete | filter-as-type + commit, RNTL 8 |
| Combobox | complete | filterable single-select via the shared `collection` match, RNTL 9 |
| Select | complete | single-select dropdown + compound parts (value-label registry + `items` table), RNTL 24 |
| Accordion | complete | single-expand disclosure, RNTL 7 |
| Collapsible | complete | single disclosure unit, RNTL 6 |
| Tabs | complete | tablist/triggers/panels, RNTL 7 |
| Toolbar | complete | oriented group, RNTL 5 |
| Drawer | complete | edge-anchored panel + bottom-sheet snap points/drag/swipe-dismiss/modal, RNTL 17 |
| Navigation Menu | complete | top bar + single-open flyout panels, RNTL 9 |
| Menubar | complete | command bar composing DropdownMenu (single-open coordination), RNTL 9 |
| Dialog | complete | modal + scrim dismissal, RNTL 8 |
| Alert Dialog | complete | blocking Dialog wrapper, RNTL 5 |
| Menu | complete | popup menu + items + checkbox/radio + filter parts (`Input`/`Clear`/`Empty`), RNTL 42 |
| Context Menu | complete | long-press popup menu, RNTL 5 |
| Popover | complete | anchored overlay + scrim, RNTL 7 |
| Dropdown Menu | complete | submenu cascade (single dismissal stack), RNTL 10 |
| Tooltip | complete | long-press + measured placement + compound parts + provider delay groups, RNTL 13 |
| Scroll Area | na-native | native ScrollView covers it; no wrapper adds value |
| Preview Card | na-native | hover-only pattern, no touch equivalent |
| Progress (linear/circular) | complete | determinate/indeterminate + value, RNTL 3 |
| Meter | complete | gauge readout, RNTL 2 |
| Snackbar/Toast | complete | timed auto-dismiss + live region, RNTL 7; queued toasts via `ToastProvider` + `useToast` + `ToastViewport` (toast-queue suite) |
| Portal/Portal host | complete | standalone `PortalHost` + `Portal` over the shared registry, RNTL 7 |
| Avatar | complete | image + fallback, RNTL 3 (in display suite) |
| Aspect Ratio | complete | ratio box, RNTL 3 |
| Separator | complete | silent divider, RNTL 2 |
| Table | complete | header/row/cell parts, RNTL 5 |

## Behavior models (traceability, not components)

`useControllableState`, `selection`, `press`, `roving`, `focusTrap`,
`dismissPolicy`, `dismissWiring`, `overlayModality`, `portal`,
`positioning` (rect math public; clamp/origin internal),
`presence`, `time`, `number` (locale parse/format + step math),
`form` (error maps + emptiness), `calendar` (grid, keys, selection,
locale —
moved from the removed component, ADR-012), `slot`, `toastQueue`,
`a11y` — all present with unit tests.
Chat models (ADR 010; contract: `docs/AI_CHAT_MODELS.md`; parity:
new surface, no Base UI counterpart): `chatStatus` (shared
generation vocabulary), `stickToBottom`, `chatMessage`, `toolCall`,
`attachments`, `promptInput`, `chatBranch`, `chatSource`,
`reasoning` (auto-open helper over the existing `Collapsible` —
no new primitive) — all present with unit tests.
`collection` (registry + match + filter/lookup — transferred with
real consumers: Combobox filtering, menu filter parts, select
label lookup), `typeahead` (buffer + prefix/cycle match; no part
forwards keys yet — first consumer is hardware-keyboard
forwarding) — both present with unit tests.
`mergeRefs` — gated, transfer only with a real consumer.

## Policy

- A row becomes `complete` only with implementation + RNTL behavior
  tests + docs + boundary-clean review. Never mark by export alone.
- `na-native` and `deferred` rows require a reason and a re-review
  trigger. Deferral is not abandonment.
- Kern keeps its own M3 implementations regardless of this table;
  nothing here replaces a design-system component.
