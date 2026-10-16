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
| Toggle Group | missing | |
| Slider | complete | PanResponder drag + actions, RNTL 9 |
| Button | complete | press/disabled/loading + busy, RNTL 7 |
| Icon Button | missing | |
| Link Button | missing | |
| Loading Button | missing | |
| Split Button | missing | |
| Pressable/Trigger primitive | missing | shared press host |
| Chip | missing | |
| FAB family | missing | deferred: design-system-shaped; needs contract review |
| Field | complete | label/control/error row, RNTL 2 (in input suite) |
| Fieldset | complete | legend group, RNTL 2 (in textarea suite) |
| Label | complete | nativeID association, RNTL 2 |
| Input | complete | controlled/uncontrolled entry, RNTL 5 |
| Textarea | complete | multiline + auto-grow, RNTL 4 |
| Number Field | complete | Input+Button composition, RNTL 7 |
| OTP Field | complete | segmented entry + auto-submit, RNTL 7 |
| Search | missing | |
| Autocomplete | missing | adapted: native list overlay |
| Combobox | missing | adapted: entry + native popup |
| Select | missing | adapted: picker/action-sheet pattern |
| Calendar | complete | UTC date grid, RNTL 7 |
| Time Picker | complete | Input+Button composition, RNTL 6 |
| Accordion | complete | single-expand disclosure, RNTL 7 |
| Collapsible | complete | single disclosure unit, RNTL 6 |
| Tabs | complete | tablist/triggers/panels, RNTL 7 |
| Pagination | missing | |
| Carousel | missing | swipe/scroll + indicators |
| Toolbar | missing | |
| Navigation Bar/Rail/Drawer | missing | destinations + active state |
| Navigation Menu | missing | adapted: stacked nav, not flyout |
| Top App Bar | missing | |
| Menubar | missing | adapted: simplify desktop bar |
| Dialog | complete | modal + scrim dismissal, RNTL 8 |
| Alert Dialog | missing | blocking confirm + trap |
| Sheet/Drawer | missing | bottom sheet + detents |
| Menu | missing | popup + dismiss |
| Context Menu | missing | adapted: long-press trigger |
| Popover | missing | adapted: custom positioner |
| Tooltip | complete | long-press + measured placement, RNTL 4 |
| Preview Card | na-native | hover-only pattern, no touch equivalent |
| Progress (linear/circular) | complete | determinate/indeterminate + value, RNTL 3 |
| Meter | missing | |
| Skeleton | missing | |
| Loader/Loading Indicator | missing | |
| Snackbar/Toast | complete | timed auto-dismiss + live region, RNTL 7 |
| Badge | complete | adornment, RNTL 1 (in display suite) |
| Empty State | missing | |
| Avatar | complete | image + fallback, RNTL 3 (in display suite) |
| Aspect Ratio | missing | |
| Card | missing | |
| Separator | complete | silent divider, RNTL 2 |
| Table | missing | |
| List Item | missing | |
| Settings Row | missing | deferred: Kern-shell-shaped; review need |
| Kbd | missing | display only |
| Text | missing | deferred: typographic scale is design-system territory; review need |

## Behavior models (traceability, not components)

`useControllableState`, `selection`, `press`, `roving`, `focusTrap`,
`dismissPolicy`, `dismissWiring`, `overlayModality`, `portal`,
`positioning` (rect math public; clamp/origin internal),
`presence`, `time`, `slot`, `a11y` — all present with unit tests.
`collection`, `mergeRefs` — gated, transfer only with a real consumer.

## Policy

- A row becomes `complete` only with implementation + RNTL behavior
  tests + docs + boundary-clean review. Never mark by export alone.
- `na-native` and `deferred` rows require a reason and a re-review
  trigger. Deferral is not abandonment.
- Kern keeps its own M3 implementations regardless of this table;
  nothing here replaces a design-system component.
