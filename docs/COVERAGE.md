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
| Icon Button | complete | label-required pressable, RNTL 5 |
| Link Button | complete | link-role button, RNTL 5 |
| Loading Button | complete | forced loading, RNTL 5 |
| Split Button | complete | dual press paths, RNTL 6 |
| Button Group | complete | layout container, RNTL 5 |
| Pressable/Trigger primitive | deferred | evaluate raw-Pressable need vs Button/Switch coverage |
| Chip | complete | select/remove, RNTL 7 |
| FAB family | missing | deferred: design-system-shaped; needs contract review |
| Field | complete | label/control/error row, RNTL 2 (in input suite) |
| Fieldset | complete | legend group, RNTL 2 (in textarea suite) |
| Label | complete | nativeID association, RNTL 2 |
| Input | complete | controlled/uncontrolled entry, RNTL 5 |
| Textarea | complete | multiline + auto-grow, RNTL 4 |
| Number Field | complete | Input+Button composition, RNTL 7 |
| OTP Field | complete | segmented entry + auto-submit, RNTL 7 |
| Search | complete | composed entry + clear/submit, RNTL 4 |
| Autocomplete | complete | filter-as-type + commit, RNTL 8 |
| Combobox | complete | filterable single-select, RNTL 9 |
| Select | complete | single-select dropdown, RNTL 8 |
| Calendar | complete | UTC date grid, RNTL 7 |
| Time Picker | complete | Input+Button composition, RNTL 6 |
| Accordion | complete | single-expand disclosure, RNTL 7 |
| Collapsible | complete | single disclosure unit, RNTL 6 |
| Tabs | complete | tablist/triggers/panels, RNTL 7 |
| Pagination | complete | bounded navigation, RNTL 4 |
| Carousel | complete | paged content, RNTL 6 |
| Toolbar | complete | oriented group, RNTL 5 |
| Navigation Bar/Rail/Drawer | deferred | app-shell navigation patterns; dedicated design slice |
| Navigation Menu | deferred | flyout adaptation needs navigation design; after Menu proves out |
| Top App Bar | deferred | app chrome; dedicated design slice |
| Menubar | deferred | desktop bar pattern; dedicated design slice |
| Dialog | complete | modal + scrim dismissal, RNTL 8 |
| Alert Dialog | complete | blocking Dialog wrapper, RNTL 5 |
| Sheet/Drawer | deferred | bottom-sheet detents + gestures are a dedicated slice (PanResponder sheet pattern) |
| Menu | complete | popup menu + items, RNTL 8 |
| Context Menu | complete | long-press popup menu, RNTL 5 |
| Popover | complete | anchored overlay + scrim, RNTL 7 |
| Dropdown Menu | deferred | submenu cascade needs positioning design; after Menu proves out |
| Tooltip | complete | long-press + measured placement, RNTL 4 |
| Scroll Area | na-native | native ScrollView covers it; no wrapper adds value |
| Preview Card | na-native | hover-only pattern, no touch equivalent |
| Progress (linear/circular) | complete | determinate/indeterminate + value, RNTL 3 |
| Meter | complete | gauge readout, RNTL 2 |
| Skeleton | complete | silent placeholder, RNTL 1 |
| Loader/Loading Indicator | complete | busy indicator, RNTL 1 |
| Snackbar/Toast | complete | timed auto-dismiss + live region, RNTL 7 |
| Badge | complete | adornment, RNTL 1 (in display suite) |
| Empty State | complete | nothing-here frame, RNTL 2 |
| Avatar | complete | image + fallback, RNTL 3 (in display suite) |
| Aspect Ratio | complete | ratio box, RNTL 3 |
| Card | complete | slot container, RNTL 1 |
| Separator | complete | silent divider, RNTL 2 |
| Table | complete | header/row/cell parts, RNTL 5 |
| List Item | complete | pressable/static rows, RNTL 3 |
| Settings Row | missing | deferred: Kern-shell-shaped; review need |
| Kbd | complete | key hint, RNTL 1 |
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
