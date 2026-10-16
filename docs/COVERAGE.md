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
| Checkbox Group | missing | |
| Radio Group | complete | single-select group + items, RNTL 8 |
| Toggle | complete | pressed-state button, RNTL 7 |
| Toggle Group | missing | |
| Slider | missing | drag value; native gesture work |
| Button | complete | press/disabled/loading + busy, RNTL 7 |
| Icon Button | missing | |
| Link Button | missing | |
| Loading Button | missing | |
| Split Button | missing | |
| Pressable/Trigger primitive | missing | shared press host |
| Chip | missing | |
| FAB family | missing | deferred: design-system-shaped; needs contract review |
| Field | missing | label/control wiring |
| Fieldset | missing | |
| Label | complete | nativeID association, RNTL 2 |
| Input | missing | |
| Textarea | missing | |
| Number Field | missing | |
| OTP Field | missing | segmented entry |
| Search | missing | |
| Autocomplete | missing | adapted: native list overlay |
| Combobox | missing | adapted: entry + native popup |
| Select | missing | adapted: picker/action-sheet pattern |
| Calendar | missing | date grid |
| Time Picker | missing | entry/pick + validation |
| Accordion | missing | |
| Collapsible | missing | |
| Tabs | missing | |
| Pagination | missing | |
| Carousel | missing | swipe/scroll + indicators |
| Toolbar | missing | |
| Navigation Bar/Rail/Drawer | missing | destinations + active state |
| Navigation Menu | missing | adapted: stacked nav, not flyout |
| Top App Bar | missing | |
| Menubar | missing | adapted: simplify desktop bar |
| Dialog | missing | adapted: modal sheet pattern |
| Alert Dialog | missing | blocking confirm + trap |
| Sheet/Drawer | missing | bottom sheet + detents |
| Menu | missing | popup + dismiss |
| Context Menu | missing | adapted: long-press trigger |
| Popover | missing | adapted: custom positioner |
| Tooltip | missing | adapted: long-press replaces hover |
| Preview Card | na-native | hover-only pattern, no touch equivalent |
| Progress (linear/circular) | missing | |
| Meter | missing | |
| Skeleton | missing | |
| Loader/Loading Indicator | missing | |
| Snackbar/Toast | missing | adapted: native timing |
| Badge | missing | |
| Empty State | missing | |
| Avatar | missing | |
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
