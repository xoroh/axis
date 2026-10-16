# Research: scope — what belongs in Axis vs Kern

Date: 2026-10-16. Read-only; no edits/commits/branches/pushes. Other threads active.
Repos inspected: `~/Desktop/Business/xoroh-monorepo/axis`, `~/Desktop/Business/xoroh-monorepo/kern`.
Output: `axis/.reports/research-scope-axis-vs-kern.md` (untracked, do not commit).

Rule being applied: **Axis** = unstyled RN primitives, Base UI counterpart, token-free, must never depend on Kern. **Kern** = multi-design-system platform (web + native); each design system owns its components; M3 first; Kern consumes Axis. Enforced by `axis/packages/axis/scripts/check-boundary.mjs` (behavior models pure; components may import only `react`, approved RN host bindings, relative `src/`; forbidden: Kern packages, `react-dom`, expo, browser globals, token references) and Kern-side `check:consumption` / `check:primitives` / `check-layers` gates (public-entry-only `@xoroh/axis` imports).

## 1. Findings with evidence

1. **All 66 Axis components are currently unstyled and token-free.** Spot reads of `Fab.tsx` ("Shape, size system, elevation, and color are caller decisions"), `Badge.tsx` ("No pill shape, no colors, no positioning"), `TopAppBar.tsx` ("no scroll elevation, no menu handling — those are design-system and shell decisions"), plus a repo-wide signal (no `variant/size/color/tone/elevation/token/theme` props except `Loader size|color` passthrough to RN `ActivityIndicator` and `Fab size:number` square-dp box) confirm the boundary is intact. Styling surface is caller-owned `style` / `*Style` props typed as plain RN `StyleProp`s. So even the "B" candidates below are *currently* behavior/structure shells — moving them is about **ownership of the pattern**, not about stripping styles today.
2. **Axis's own parity docs agree only 5 families are `aligned`.** `axis/docs/BASE_UI_PARITY.md` records per-component Base UI parity tables only for Dialog, Menu, Switch, Checkbox, Toggle = `aligned`; everything else = `pending` (systematic native deviations D1–D10: no `data-*`, no `keepMounted`/`container`, no Dialog `Viewport`, no focus-trap/nested-overlay/hover-traversal/transitions/inline-menu portal). `axis/docs/COVERAGE.md` marks all 66 `complete` (impl+test+docs) but `Scroll Area` and `Preview Card` = `na-native` ("native ScrollView covers it; no wrapper adds value" / "hover-only pattern, no touch equivalent"), and explicitly states "Kern keeps its own M3 implementations regardless of this table; nothing here replaces a design-system component."
3. **Kern at HEAD does not import Axis *components* — only behavior hooks/models.** Full grep (excluding `node_modules`/`dist`): `packages/kern/src` (3 files) imports `useControllableState`, dismiss-policy helpers, portal/presence/press/positioning/slot/a11y helpers; `packages/kern-native/src` (27 files) overwhelmingly imports `useControllableState` (21 files), plus `useSelection` (4), dismiss trio, `mergeSlotProps/SlotProps`, `useRovingModel`, overlay-modality, time utils. Zero `export ... from "@xoroh/axis"` re-exports; zero `@xoroh/axis/<subpath>` deep imports; `apps/mobile` zero imports. Dependency is a pre-publish vendored tarball (`file:../../vendor/axis/*.tgz`, swapping to semver at first authorized publish). Consequence: **moving/removing Axis *components* breaks nothing in Kern at HEAD**; the risk is to *external* Axis consumers, hence deprecation discipline still required. The contract draft (`kern/docs/architecture/axis-contract.md`, DRAFT 2026-10-16, owner approval required) codifies this: Kern takes behavior from Axis, values from `ResolvedTheme`.
4. **Kern already owns the M3 styled layer.** `kern/packages/kern-native/src/components/` (~130 files) and `kern/packages/kern/src/components/` (~90 files) each implement their own `fab` (M3 sizes `default|small|medium|large|icon`, colors `surface|primary|secondary|tertiary|*-fill` with `fabColorRoles`), `extended-fab`, `top-app-bar`, `navigation-bar/rail/drawer/menu`, `card`, `badge`, `chip`, `snackbar`, `segmented-button`, `bottom-sheet-surface`, `sheets`, etc. `kern-material-3` is token/theme projection only (no `components/` dir). So every "B" move has a natural home: a Kern M3 component that *consumes* the retained Axis primitive/hook underneath.
5. **Reference inventories confirm the A/B split.** Base UI lists 37 unstyled parts-based components (verified at `https://base-ui.com/react/overview/quick-start`); rn-primitives lists 27 core + portal/slot/hooks ("Radix UI powers the web side; native implementations power the rest", `https://rnprimitives.com/`); Radix documents ~30 headless primitives (`https://www.radix-ui.com/primitives/docs/overview/introduction`, `https://github.com/radix-ui/primitives`); React Aria covers 50+ style-free components/hooks including `isPending` Button, Calendar, TagGroup (`https://react-spectrum.adobe.com/react-aria/`, `https://react-spectrum.adobe.com/react-aria/Button.html`); RN core covers Pressable, Modal, ScrollView, FlatList/SectionList/VirtualizedList, RefreshControl, TextInput, Switch, ActivityIndicator, KeyboardAvoidingView, StatusBar, Alert/ActionSheetIOS/ToastAndroid (`https://reactnative.dev/docs/components-and-apis`); the standard mobile bottom-sheet primitive is `@gorhom/bottom-sheet` (`https://github.com/gorhom/react-native-bottom-sheet`, docs `https://gorhom.dev/react-native-bottom-sheet/`).

## 2. Reference inventories (summary)

### 2.1 Base UI — 37 components (all unstyled, parts-based)

Source: `https://base-ui.com/react/overview/quick-start`, map `https://base-ui.com/llms.txt`, pages `https://base-ui.com/react/components/{slug}` (e.g. `.../dialog`).
Accordion (`Root/Item/Header/Trigger/Panel`), Alert Dialog, Autocomplete (`Root/Input/Portal/List/Row/Empty/Status` — distinct from Combobox), Avatar (`Root/Image/Fallback`), Button, Checkbox (`Root/Indicator`), Checkbox Group, Collapsible, Combobox (`Root/Input/Trigger/Portal/Backdrop/Positioner/Popup/List/Row/Empty/Status/Clear/Collection`), Context Menu, Dialog (`Root/Trigger/Portal/Backdrop/Viewport/Popup/Title/Description/Close` + `createHandle()`), Drawer (swipe-to-dismiss/snap; guideline: use Drawer not Dialog when gestures needed), Field (`Root/Label/Control/Description/Error/Validity`), Fieldset (`Root/Legend`), Form, Input, Menu, Menubar, Meter (`Root/Track/Indicator/Label/Value`), Navigation Menu, Number Field (`Root/Group/Input/Increment/Decrement/ScrubArea`), OTP Field (`Root/Input`), Popover, Preview Card, Progress, Radio Group, Scroll Area (`Root/Viewport/Scrollbar/Thumb/Corner`), Select, Separator, Slider, Switch (`Root/Thumb`), Tabs, Toast (`Provider/Root/Title/Description/Close/Action/Viewport` + `toast.add()`), Toggle, Toggle Group, Toolbar, Tooltip (`Provider/Root/Trigger/Portal/Positioner/Popup/Arrow`). Utils only: `useRender` (`https://base-ui.com/react/utils/use-render`), `mergeProps`, Direction/CSP providers.

### 2.2 rn-primitives — 27 core + 5 shared (headless Radix ports)

Source: `https://rnprimitives.com/`, repo `https://github.com/roninoss/rn-primitives`. Core: accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, select, separator, slider, switch, table, tabs, toast, toggle, toggle-group, toolbar, tooltip. Shared: hooks (`https://rnprimitives.com/hooks`), portal (`Portal/PortalHost`, `https://rnprimitives.com/portal`), slot (`asChild`), types, utils. Styled skin (not new behavior): `founded-labs/react-native-reusables` (`https://github.com/founded-labs/react-native-reusables`, docs `https://reactnativereusables.com/docs`) — shadcn-style Nativewind wrappers (`badgeVariants`, `buttonVariants`) around the headless ports, covering Badge, Card, Skeleton, Textarea, Typography, etc.

### 2.3 Radix Primitives — ~30 headless

Index `https://www.radix-ui.com/primitives/docs/components/`, intro `https://www.radix-ui.com/primitives/docs/overview/introduction`. accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, form, hover-card, label, menubar, navigation-menu, one-time-password-field, password-toggle-field, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, toggle, toggle-group, toolbar, tooltip. Deltas vs Base UI: Radix lacks Drawer, Autocomplete/Combobox split, Field/Fieldset/Input, Meter, Checkbox Group; uniquely lists Form, OTP field, Password Toggle field.

### 2.4 React Aria — 50+ style-free components/hooks (mobile-parity-relevant subset)

Base `https://react-spectrum.adobe.com/react-aria/`, e.g. `https://react-spectrum.adobe.com/react-aria/Button.html` (`isPending`: "Pending buttons remain focusable, but are otherwise disabled… announced to assistive technologies"). Actions/overlays: Button (`isPending`), ToggleButton, Link, Dialog, Modal, Popover, Tooltip, Toast, Menu, Select, ComboBox, Autocomplete. Collections: ListBox, GridList, Table, Tree, TagGroup, Disclosure, Virtualizer. Forms: TextField, SearchField, NumberField, Checkbox/CheckboxGroup, RadioGroup, Switch, Slider, Calendar/RangeCalendar, DateField/DatePicker/DateRangePicker, TimeField, ColorField/ColorPicker, FileTrigger, DropZone. Feedback/nav: ProgressBar, ProgressCircle, Meter, Tabs, Breadcrumbs.

### 2.5 React Native core + standard mobile primitives

Index `https://reactnative.dev/docs/components-and-apis`. Interaction: Pressable (`.../pressable`, primary), Button, legacy Touchables, TouchableNativeFeedback (Android). Overlays: Modal (`.../modal`), Alert, ActionSheetIOS, ToastAndroid, deprecated DrawerLayoutAndroid. Lists/scroll: ScrollView, FlatList, SectionList, VirtualizedList, RefreshControl, KeyboardAvoidingView, InputAccessoryView (iOS). Inputs/indicators: TextInput, Switch, ActivityIndicator, Image. Chrome/safe-area: StatusBar, deprecated SafeAreaView → `react-native-safe-area-context` (`SafeAreaProvider/useSafeAreaInsets`). System: AppState, AccessibilityInfo (`.../accessibilityinfo`), Dimensions, `useWindowDimensions`, `useColorScheme`, Appearance, Keyboard, BackHandler, Linking, Animated, LayoutAnimation, PanResponder. Community standards: `react-native-reanimated` (`https://docs.swmansion.com/react-native-reanimated`), `react-native-gesture-handler` (`https://docs.swmansion.com/react-native-gesture-handler`), `@gorhom/bottom-sheet` v5 (`BottomSheetModal`, snap points, keyboard handling), `@rn-primitives/portal` (`PortalHost/Portal`, `hostName`).

## 3. Placement table — all 66 Axis components

Verdicts: **(A)** keep in Axis — true behavior primitive with a Base UI / Radix / rn-primitives / React Aria / RN-standard equivalent. **(B)** move to Kern's M3 system — design-system pattern/chrome with no headless equivalent (M3 owns color/shape/type/elevation/IA). **(C)** unclear — needs owner decision, reasoning given. Counts: **A 45 · B 15 · C 6 = 66.**

| # | Axis component | Verdict | Equivalent (evidence) | Reasoning |
|---|---|---|---|---|
| 1 | Accordion | A keep | Base UI Accordion; Radix; rn-p | Composite single-expand state (`value/onValueChange`); behavior, not chrome. |
| 2 | AlertDialog | A keep | Base UI Alert Dialog; Radix; rn-p | Thin `Dialog` specialization (`dismissable=false` forced); belongs with Dialog. |
| 3 | AspectRatio | A keep | Radix aspect-ratio; rn-p | Stateless layout primitive; DS-neutral. |
| 4 | Autocomplete | A keep | Base UI Autocomplete (distinct from Combobox); React Aria Autocomplete | Text+list state split, `options/onCommit`; keep. |
| 5 | Avatar | A keep | Base UI Avatar (`Root/Image/Fallback`); Radix; rn-p | Image-with-fallback behavior; no size/shape props in Axis. |
| 6 | Badge | B move | None headless (only styled Reusables `badgeVariants`) | M3 Badge (dot/count, placement/color) is DS chrome; Axis shell is an adornment slot. Move to Kern M3 Badge; M3 consumes no Axis hook (or generic `Text`). |
| 7 | ButtonGroup | C unclear | No Base UI equiv. (closest: Toolbar `Group`) | Honest group-role container today, but overlaps M3 SegmentedButton/ButtonGroup IA. Decide: keep as generic group primitive vs move to M3. Leaning: keep only if a second DS reuses it; else move. |
| 8 | Button | A keep | Base UI Button; React Aria Button (`onPress/isPending`) | Core press primitive (`onPress/disabled/loading` busy announce). |
| 9 | Calendar | A keep | React Aria Calendar/RangeCalendar (Base UI has none — document gap) | Date grid + `value/month/min/max` behavior; no RN core equiv. Keep as the Aria-parity primitive. |
| 10 | Card | B move | None headless (only styled Reusables Card) | Slots (`header/media/actions`) withcaller styles, but Card container spec (shape/elevation/padding) is per-DS. Move to Kern M3 Card. |
| 11 | Carousel | B move | None headless; M3 Carousel exists | `index/loop` paging is real behavior but presentation (dots, peek, breakpoints) is DS-owned; RN impl is a FlatList-paging detail. Move to Kern M3 Carousel built on Axis-agnostic list primitives. |
| 12 | CheckboxGroup | A keep | Base UI Checkbox Group; React Aria CheckboxGroup | Multi-select toggle (`value: string[]`); keep. |
| 13 | Checkbox | A keep | Base UI; Radix; rn-p; parity `aligned` | Keep. |
| 14 | Chip | B move | None headless (closest: React Aria TagGroup — collection, not chip) | M3 Assist/Filter/Input/Suggestion chips carry iconography/elevation/type specs per variant. Axis `selected/onRemove/onPress` behavior ports cleanly into Kern M3 Chip. Move. |
| 15 | Collapsible | A keep | Base UI; Radix; rn-p | Single-disclosure unit; keep. |
| 16 | Combobox | A keep | Base UI Combobox; React Aria ComboBox | Keep (parity `pending`, but headless equiv. exists). |
| 17 | ContextMenu | A keep | Base UI Context Menu; Radix; rn-p | Long-press open; keep. |
| 18 | Dialog | A keep | Base UI Dialog; Radix; rn-p; parity `aligned` | Keep (monolith + compound). |
| 19 | DropdownMenu | A keep | Radix dropdown-menu; rn-p; Base UI Menu family | Cascade/submenu dismissal stack; keep. |
| 20 | EmptyState | B move | None headless | Title/description/action slots with no behavior; copy/icon/illustration guidance is per-DS. Move to Kern M3 EmptyState (or shared Kern pattern, not Axis). |
| 21 | ExtendedFab | B move | None headless; M3 Extended FAB | Label+icon press with M3 size/color/elevation spec. Axis version is a clean behavior donor (press/label/disabled/busy). Move; Kern M3 already implements `extended-fab`. |
| 22 | Fab | B move | None headless; M3 FAB (`default/small/medium/large/icon`, container/fill colors per `kern-native/.../fab.tsx`) | Same as above. Move; trivial (behavior-only shell). |
| 23 | Fieldset | A keep | Base UI Fieldset (`Root/Legend`) | Keep. |
| 24 | Field | A keep | Base UI Field (`Root/Label/Control/Description/Error/Validity`) | Keep (Axis subset: label/children/error + polite announce). |
| 25 | IconButton | C unclear | No standalone Base UI equiv.; M3 IconButton exists | Axis is Button-shaped with label-required warning — genuinely generic icon-press a11y behavior — but M3 IconButton (standard/tonal/outlined, sizes) will duplicate the name. Decide: (i) keep thin Axis `IconButton` + Kern `M3IconButton` wrapper, or (ii) move and have M3 own it. Recommend (i) only if the generic is reused outside M3; else move. |
| 26 | Input | A keep | Base UI Input; React Aria TextField | Keep. |
| 27 | Kbd | B move | None (HTML `<kbd>` display convention) | No shortcut engine, no behavior; typography/display pattern. Move to Kern (typography) or drop. |
| 28 | Label | A keep | Radix Label; rn-p Label; Base UI Field Label | `nativeID ↔ accessibilityLabelledBy` association; keep. |
| 29 | LinkButton | C unclear | React Aria Link (semantic link vs button); RN Linking | Role distinction (link vs button) is real behavior, but visual "button-that-looks-like-a-link" is a DS pattern overlapping M3 TextButton. Decide: keep a generic `Link` primitive in Axis vs move link-styled-button to M3. |
| 30 | ListItem | C unclear | No Base UI equiv.; closest React Aria ListBox option / M3 List Item | Axis hybrid (leading/trailing slots; `Pressable` only if `onPress`; no fake affordance) is good generic row behavior — but M3 List Item (headline/supporting/trailing, dividers, selection) owns the IA. Decide: keep generic row in Axis and let M3 ListItem wrap it, or move wholesale. |
| 31 | Loader | A keep | RN `ActivityIndicator` (`https://reactnative.dev/docs/activityindicator`) | Thin host passthrough (`size/color` forwarded, not system values); keep. |
| 32 | LoadingButton | B move | React Aria `isPending` is a *Button state*, not a separate component | A separate `LoadingButton` component is a DS convenience (default `loading=true`, no spinner). Move: fold into Kern M3 Button as `loading/isPending` state per React Aria guidance; do not enshrine a second Axis button. |
| 33 | Menubar | A keep | Base UI Menubar; Radix; rn-p | Single-open composition over DropdownMenu; keep. |
| 34 | Menu | A keep | Base UI Menu; parity `aligned` | Keep. |
| 35 | Meter | A keep | Base UI Meter; React Aria Meter | Gauge readout; keep. |
| 36 | NavigationBar | B move | None headless; M3 Navigation Bar (bottom tabs, first-item default, no deselect) | Tab-bar IA + M3 active-indicator/shape spec is DS-owned. Move to Kern M3 NavigationBar. |
| 37 | NavigationDrawer | C unclear | Base UI Drawer (gestural) vs M3 Navigation Drawer (modal/dismissable/side IA) | Axis `Drawer`/`NavigationDrawer` alias conflates two things: generic drawer behavior (Modal+scrim, `open/onDismiss/side`) and M3 navigation IA. Recommend split: keep generic `Drawer` behavior in Axis, move `NavigationDrawer` chrome/IA to Kern M3. Needs owner confirmation. |
| 38 | NavigationMenu | A keep | Base UI Navigation Menu; Radix; rn-p | Single-open flyout nav panels; keep (distinct from Menubar command menus). |
| 39 | NavigationRail | B move | None headless; M3 Navigation Rail | Currently a thin wrapper over NavigationBar (vertical default, item alias) — trivially movable. Move. |
| 40 | NumberField | A keep | Base UI Number Field; React Aria NumberField | Input+steppers, `min/max/step`, NaN→null; keep. |
| 41 | OtpField | A keep | Base UI OTP Field; Radix OTP field | Single-hidden-Input fanning to cells; keep. |
| 42 | Pagination | C unclear | No Base UI/Radix equiv.; web-pagination pattern | `page/pageCount/onPageChange` state is generic, but chrome (ellipsis math deliberately excluded, previous/next labels, indicator `children`) overlaps DS pagination specs. Decide: keep headless page-state primitive vs move to Kern. Leaning move unless a second consumer needs the generic. |
| 43 | Popover | A keep | Base UI Popover; Radix; rn-p | Tap-toggle + placement; keep. |
| 44 | Progress | A keep | Base UI Progress; React Aria ProgressBar/Circle; rn-p | Determinate/indeterminate + clamp; keep. |
| 45 | RadioGroup | A keep | Base UI; Radix; rn-p | Single-select replacing; keep. |
| 46 | Search | A keep | React Aria SearchField | Input+clear affordance, `onSubmit`; no filtering inside; keep. |
| 47 | Select | A keep | Base UI Select; Radix; rn-p | Keep. |
| 48 | Separator | A keep | Base UI; Radix; rn-p | Keep (direction via caller style is correct RN adaptation). |
| 49 | SettingsRow | B move | None headless; settings-list IA pattern | Title/description/control row with conditional Pressable; control-independence rule ports cleanly. This is app-settings IA, per-DS. Move to Kern M3 (SettingsRow/ListItem family). |
| 50 | Sheet | A keep | Base UI Drawer (cousin) + standard mobile pattern `@gorhom/bottom-sheet` (detents/drag/keyboard, `https://gorhom.dev/react-native-bottom-sheet/`) | Generic detent/drag bottom-sheet behavior distinct from Drawer (Axis docs: "Sheet stays separate (detents/drag)"). Keep the headless behavior; M3 ModalBottomSheet styling lives in Kern (`sheet-surface`, `bottom-sheet-surface` already exist there). |
| 51 | Skeleton | B move | None headless (only styled Reusables Skeleton) | Silent placeholder dims via `style`; shimmer/pulse/animation spec is per-DS. Move to Kern M3 Skeleton. |
| 52 | Slider | A keep | Base UI Slider; Radix; rn-p; React Aria Slider | PanResponder drag + `min/max/step`; keep. |
| 53 | SplitButton | B move | None headless | Two-button row (`onPress/onSecondaryPress`, shared disabled, never-crossing paths) is a button-bar pattern, not a primitive. Move to Kern M3 SplitButton. |
| 54 | Switch | A keep | Base UI; Radix; rn-p; parity `aligned` | Keep. |
| 55 | Table | A keep (structural) | rn-p Table; React Aria Table/GridList (RN defines no table roles — Axis correctly structural only) | Keep as structure (`Header/Row/Cell`, `header?` flag); document that roles are intentionally absent on RN. |
| 56 | Tabs | A keep | Base UI Tabs; Radix; rn-p | Keep. |
| 57 | Textarea | A keep | React Aria TextField (multiline); Reusables Textarea | Multiline Input + `autoGrow`; keep. |
| 58 | Text | A keep | RN `Text` host (`https://reactnative.dev/docs/text`); explicitly "NO type scale" | Host passthrough; keep. |
| 59 | TimePicker | A keep | React Aria TimeField/DatePicker (always-24h-internally + normalize/format/step) | Keep. |
| 60 | Toast | A keep | Base UI Toast; React Aria Toast; rn-p | `open/duration/action/onAction` + polite announce; keep. Note: M3 Snackbar is separate (Kern already has `snackbar`) — do not conflate. |
| 61 | ToggleGroup | A keep | Base UI; Radix; rn-p | Multi-press toggle; keep. |
| 62 | Toggle | A keep | Base UI; Radix; rn-p; parity `aligned` | Keep. |
| 63 | Toolbar | A keep | Base UI Toolbar; Radix; rn-p | Container + orientation→flexDirection; roving traversal deferred (documented); keep. |
| 64 | Tooltip | A keep | Base UI Tooltip (Provider pattern); Radix; rn-p | Long-press toggle + placement, no hover/scrim on touch; keep. |
| 65 | TopAppBar | B move | None headless; M3 Top App Bar (center/small/medium/large/expressive, scroll-elevation) | Header-role chrome with leading/title/actions slots and no navigation behavior of its own — app chrome owned per-DS/shell. Move to Kern M3 TopAppBar. |
| 66 | Trigger | A keep | RN Pressable (`https://reactnative.dev/docs/pressable`); Base UI `useRender`/asChild composition concept | Semantics-free Pressable for caller-asserted roles; keep. |

Rationale for the B set as a whole: each names an M3-spec'd component (FAB/Extended FAB, TopAppBar, NavigationBar/Rail, Chip, Card, Badge, EmptyState, Skeleton, SettingsRow, LoadingButton, SplitButton, Kbd-as-typography, Carousel) whose visual/IA contract (sizes, tones, shapes, elevation, type scale, placement, motion) can only be satisfied per design system. Axis's current shells are valuable *donors* (press/label/disabled/busy, slots, conditional-Pressable rules) — port the behavior into Kern M3 components that consume retained Axis primitives/hooks (`Button`, `useControllableState`, `usePress`, etc.), exactly as Kern's `fab.tsx`/`extended-fab`/`top-app-bar` already do.

## 4. Primitives Axis is MISSING (that Base UI / RN standards have)

Numbered, with the canonical source and recommended disposition:

1. **Form** — Base UI Form (`https://base-ui.com/react/components/form`), Radix Form, React Aria form semantics. Axis has Field/Fieldset/Input but no Form (submission, validation wiring). Recommend: add headless `Form` to Axis (A-track).
2. **ScrollArea / ScrollView primitive** — Base UI Scroll Area (`Root/Viewport/Scrollbar/Thumb/Corner`); RN ScrollView (`https://reactnative.dev/docs/scrollview`). Axis marks Scroll Area `na-native`, but a thin RN `ScrollView` behavior/a11y wrapper (keyboard, paging, indicators) may still warrant an Axis primitive; at minimum document the "use RN ScrollView directly" guidance. Recommend: C — decide explicitly, don't leave implicit.
3. **PreviewCard / HoverCard** — Base UI Preview Card, Radix Hover Card, rn-p `hover-card`. Axis marks `na-native` (hover-only). Correct for touch, but web-parity consumers (Kern web) still need it. Recommend: keep out of Axis native; ensure Kern web covers it (`preview-card` already exists in `kern/src/components`).
4. **PasswordToggleField** — Radix `password-toggle-field`. Axis Input has `secureTextEntry` but no show/hide toggle behavior. Recommend: add to Axis Input family or as small behavior (A-track).
5. **Link (standalone)** — React Aria Link, Base UI Toolbar Link / NavigationMenu Link. Axis only has `LinkButton` (button-shaped). Recommend: resolve with §3 #29 — likely add a standalone `Link` primitive to Axis.
6. **TagGroup** — React Aria TagGroup (the headless counterpart to chips/tags). If Chip moves to M3, Axis still wants the generic multi-tag selection behavior only if two DSs need it; otherwise leave to Kern. Recommend: C.
7. **Disclosure** — React Aria Disclosure (header/trigger/panel distinct from Collapsible details semantics). Axis Collapsible covers most; document equivalence or add alias. Recommend: docs-only.
8. **Breadcrumbs** — React Aria Breadcrumbs. No Axis equiv. Recommend: Kern pattern (B-track), not Axis, unless generic behavior emerges.
9. **DatePicker / DateRangePicker / full month-grid Calendar** — React Aria DatePicker/DateRangePicker/Calendar. Axis Calendar is day-select + month nav; full picker (fields, segments, validation, ranges) is missing. Recommend: extend Axis Calendar family (A-track) or explicitly defer.
10. **ColorField / ColorPicker** — React Aria. Missing. Recommend: defer unless a consumer appears (gated, per contract discipline).
11. **FileTrigger / DropZone** — React Aria. No RN-meaningful equiv. (document picker/share flows differ). Recommend: out of scope; document.
12. **Virtualized collections (FlatList/SectionList/VirtualizedList)** — RN FlatList (`https://reactnative.dev/docs/flatlist`), SectionList, VirtualizedList; React Aria Virtualizer. Axis Carousel/Table/Tabs manage selection but Axis has no virtualized-list behavior primitive. Recommend: C — decide whether Axis stays deliberately un-virtualized (caller uses RN lists directly) or adds a thin behavior wrapper.
13. **Pull-to-refresh (RefreshControl)** — RN RefreshControl (`https://reactnative.dev/docs/refreshcontrol`). Missing. Recommend: thin Axis behavior or documented RN-direct guidance.
14. **KeyboardAvoiding / SafeArea / StatusBar** — RN KeyboardAvoidingView, SafeAreaContext (`SafeAreaProvider/useSafeAreaInsets`), StatusBar (`https://reactnative.dev/docs/statusbar`). Pure-mobile primitives with no Base UI counterpart; Axis has none. Recommend: add thin Axis-safe wrappers or documented guidance (A-track, mobile-standard rule).
15. **System hooks: AppState, AccessibilityInfo, Dimensions/useWindowDimensions, Keyboard, BackHandler** — RN APIs (`https://reactnative.dev/docs/accessibilityinfo`, etc.). Axis has `a11y` helpers but no lifecycle/dimension/keyboard/back-handler models. Recommend: add only with a proven consumer (gated, per contract).
16. **Overlays: Alert/ActionSheetIOS/Share, Snackbar vs Toast** — RN Alert, ActionSheetIOS, Share; M3 Snackbar (Kern already has `snackbar`); Base UI Toast `Provider/Viewport + toast.add()` object API. Axis Toast is single-toast state (`open/duration/action`), no queue/viewport/object API. Recommend: extend Toast toward provider+queue (A-track) or explicitly scope Axis Toast to single-shot and leave queueing to Kern.
17. **SegmentedButton** — M3 Segmented Button; Kern web already has `segmented-button`. No Axis equiv. (ButtonGroup is not it). Recommend: Kern M3 component (B-track), possibly consuming a retained generic group primitive.
18. **BottomSheetModal full pattern** — `@gorhom/bottom-sheet` (`BottomSheetModal`, snap points, `BottomSheetFlatList/ScrollView`, keyboard handling). Axis Sheet covers detents/drag/Modal+scrim basics; full modal/sheet-list/keyboard integration is missing. Recommend: extend Sheet (A-track) with gorhom-parity notes, keeping M3 styling in Kern.
19. **Gesture/Reanimated integration** — `react-native-gesture-handler`, `react-native-reanimated`. Axis Slider/Sheet/Carousel use PanResponder/Modal basics; no gesture-handler/reanimated-backed primitives. Recommend: gated — add only with consumer + compat proof (peers `rn>=0.86<0.89`).
20. **FocusTrap / PortalHost / standalone Portal** — Base UI Dialog `Viewport`/Portal model; `@rn-primitives/portal` (`PortalHost/Portal`). Axis has `DialogPortal`/`MenuPortal` per-component and internal `portal`/`presence`/`overlayModality` models, but no standalone exported Portal host. Recommend: promote per `axis-contract.md` gated `collection`/`mergeRefs`-style discipline — only with proven consumer.
21. **Autocomplete/Combobox/Select `Collection`/filter parts** — Base UI Combobox `Collection`, Menu filter parts; Axis Menu docs note "filter parts deferred (needs `collection`)". Recommend: keep deferred until the `collection` gate passes; track as the known parity gap.

## 5. What Kern currently imports from Axis (breakage analysis)

Method: grep `@xoroh/axis` across `kern` excluding `node_modules`/`dist`; `export ... from axis` check; contract read (`kern/docs/architecture/axis-contract.md` DRAFT).

- `packages/kern/src` (3 files): `menu-family.tsx` (`useControllableState`); `sheet-family.tsx` (`A11yDir`, `createDismissPolicy`, `dismissBranchesFor`, `shouldDismissOn`, `useControllableState`); `presentation.tsx` (`A11yDir`, `createIdScope`, `createPortalRegistry`, `DismissBranches`, `DismissWiringOptions`, `dismissBranchesFor`, `mergeSlotProps`, `nextTrapIndex`, `Placement`, `resolveAutofocus`, `resolveDir`, `resolveFloatingRect`, `resolvePortalTarget`, `shouldDismissOn`, `usePresence`, `usePress`).
- `packages/kern-native/src` (27 files): dominant `useControllableState` (21 files: autocomplete, checkbox, chip, collapsible, combobox, extended-fab, icon-button, layouts, pagination, radio-group, search, select, slider, switch, tabs, time-picker, toggle, tooltip, etc.); `useSelection` (accordion, checkbox-group, toggle-group, web-parity); `useRovingModel` (carousel, time-picker); dismiss trio (sheet-surface); `mergeSlotProps/SlotProps` (button, icon-button, presentation); overlay-modality (overlay-surfaces); time utils + `useControllableState`/`useRovingModel` (time-picker); full presentation-model set (presentation).
- `libs/kern-primitives`: zero Axis imports (frozen legacy donor). `apps/mobile`: zero. `apps/site`: docs/examples/generated only. `kern-cli`: scaffold path strings only.
- Re-exports: **none** (`export ... from "@xoroh/axis"` returns zero hits). No deep subpath imports (gated to public entry `.`).

**Breakage verdict: moving any B-list *component* breaks nothing in Kern at HEAD** — Kern consumes Axis hooks/models, not Axis components, and already implements its own M3 components. Migration risk sits with external Axis consumers and with name collisions (e.g. Kern `fab` vs Axis `Fab`), handled by the deprecation plan below.

## 6. Migration steps (no breaking without deprecation)

Follow existing Axis precedents (`NavigationDrawer` warn-once alias of `Drawer`; `Switch` deprecated `value` aliases) and the contract's single-package/public-entry discipline.

For each B move (Badge, Card, Carousel, Chip, EmptyState, Fab, ExtendedFab, Kbd, LoadingButton, NavigationBar, NavigationRail, SettingsRow, Skeleton, SplitButton, TopAppBar):

1. **Build the Kern M3 receiver first.** Implement/confirm the M3 component in `kern/packages/kern-native/src/components/` (and web counterpart in `kern/packages/kern/src/components/` where applicable) consuming retained Axis primitives/hooks (`Button`, `useControllableState`, `usePress`, …) + `ResolvedTheme` values. No token reads in Axis; no behavior models in M3 — behavior stays in Axis, values stay in Kern.
2. **Deprecate in Axis (minor, non-breaking).** Mark the Axis export `@deprecated` (JSDoc + docs page banner) pointing to the Kern M3 receiver and the underlying Axis primitive; add a dev-only warn-once on use where the codebase already uses that pattern; keep the export, props, and behavior byte-identical.
3. **Codemod + docs.** Ship a rename/replace codemod (`AxisFab` → `M3Fab` or documented mapping), update `axis/docs/COVERAGE.md`, `BASE_UI_PARITY.md` (record as `moved-to-kern-m3`, not `pending`), and per-component docs with before/after examples.
4. **Hold the deprecation window.** Minimum two minor releases (or the period the owners set; never remove in a patch). Track adoption via the Kern gates (`check:consumption`) and external usage reports.
5. **Remove in the next major only.** Delete the Axis export, its tests move (or duplicate) to Kern, and the barrel (`packages/axis/src/index.ts`) drops the symbol. Publish as semver-major with a migration note. Never batch-remove B items and C decisions in the same major without separate notes.
6. ** record the contract.** Update `axis-contract.md` (Kern) disposition list and Axis `COMPONENT_CONTRACT.md` §11 (single-part APIs retained, never removed pre-1.0) compliance note for each removal.

For C items (ButtonGroup, IconButton, LinkButton, ListItem, NavigationDrawer, Pagination): **do not migrate** until owners pick (i) keep-generic-in-Axis, (ii) split (generic stays, DS chrome moves, as recommended for NavigationDrawer), or (iii) move wholesale. Record each decision in this report's successor + `BASE_UI_PARITY.md` before any deprecation.

## 7. Open questions (owner decisions needed)

1. **Fab/ExtendedFab/IconButton/LoadingButton/SplitButton/ButtonGroup:** is there a *generic* press-group primitive family worth keeping in Axis (press/label/disabled/busy + group role), with M3 owning all sizes/colors/elevations — or does even the generic belong in Kern? (Affects §3 #7, #25, #32, #53.)
2. **NavigationDrawer vs Drawer vs Sheet:** confirm the recommended split — generic `Drawer` behavior stays in Axis; `NavigationDrawer` IA/chrome moves to Kern M3; `Sheet` (detents/drag) stays. If instead all three move, Sheet's gorhom-parity work moves with them.
3. **ListItem vs SettingsRow vs M3 List Item:** one generic row (Axis) + two DS wrappers (Kern), or all rows in Kern? (Affects §3 #30, #49.)
4. **Chip/TagGroup:** does Axis need any generic tag-selection behavior, or is multi-tag selection M3-only? (Affects missing #6.)
5. **Toast queue/viewport:** extend Axis Toast toward Base UI `Provider/Viewport + toast.add()` or scope Axis to single-shot and leave queueing to Kern/Snackbar? (Affects missing #16.)
6. **ScrollArea/ScrollView/virtualized lists/RefreshControl/KeyboardAvoiding/SafeArea/StatusBar:** which mobile-standard primitives does Axis bless vs deliberately leave to RN-direct use? Currently implicit; make it explicit per missing #2, #12–14.
7. **Pagination/Carousel:** generic state-machine primitives in Axis, or DS-owned patterns in Kern? Carousel is tentatively B, Pagination tentatively C — confirm together since both are index-arithmetic state.
8. **Kbd/Text/Table/Toolbar:** confirm these stay (display/structure/container, explicitly style-free) rather than moving to Kern typography — the "no headless equivalent" test alone would move Kbd, but the same test spares Text/Table/Toolbar. State the display-primitive rule explicitly.
9. **Calendar/TimePicker scope:** full DatePicker/DateRangePicker parity (React Aria) in Axis, or day-picker-only with pickers in Kern? (Affects missing #9.)
10. **Contract gates:** confirm `collection`/`mergeRefs`/standalone-Portal promotion criteria and whether any B-move receiver is allowed to force-promote them (recommend: no — receivers must work with current public Axis API).

## 8. Sources cited

- Base UI quick-start + component map: `https://base-ui.com/react/overview/quick-start`, `https://base-ui.com/llms.txt`, `https://base-ui.com/react/components/dialog` (pattern for all `.../{slug}` pages).
- rn-primitives: `https://rnprimitives.com/`, `https://rnprimitives.com/portal`, `https://rnprimitives.com/hooks`, `https://github.com/roninoss/rn-primitives`.
- Reusables (styled, not headless): `https://github.com/founded-labs/react-native-reusables`.
- Radix: `https://www.radix-ui.com/primitives/docs/overview/introduction`, `https://www.radix-ui.com/primitives/docs/components/`, `https://github.com/radix-ui/primitives`.
- React Aria: `https://react-spectrum.adobe.com/react-aria/`, `https://react-spectrum.adobe.com/react-aria/Button.html` (`isPending`), `https://react-spectrum.adobe.com/react-aria/getting-started.html`.
- RN core: `https://reactnative.dev/docs/components-and-apis` (incl. `.../pressable`, `.../modal`, `.../flatlist`, `.../activityindicator`, `.../text`, `.../keyboardavoidingview`, `.../statusbar`, `.../refreshcontrol`, `.../accessibilityinfo`).
- Bottom sheet standard: `https://github.com/gorhom/react-native-bottom-sheet`, `https://gorhom.dev/react-native-bottom-sheet/`.
- Gesture/animation: `https://docs.swmansion.com/react-native-gesture-handler`, `https://docs.swmansion.com/react-native-reanimated`.
- M3 (pattern homes for B moves): `https://m3.material.io/components/floating-action-button/overview`, `https://m3.material.io/components/top-app-bar/overview`, `https://m3.material.io/components/navigation-bar/overview`, `https://m3.material.io/components/navigation-rail/overview`, `https://m3.material.io/components/navigation-drawer/overview`, `https://m3.material.io/components/chips/overview`, `https://m3.material.io/components/cards/overview`, `https://m3.material.io/components/badge/overview`, `https://m3.material.io/components/carousel/overview`.
- Local evidence: `axis/packages/axis/src/components/{Fab,Badge,TopAppBar}.tsx` header comments; `axis/packages/axis/scripts/check-boundary.mjs`; `axis/packages/axis/src/index.ts`; `axis/docs/BASE_UI_PARITY.md`; `axis/docs/COVERAGE.md`; `axis/docs/COMPONENT_CONTRACT.md`; `axis/packages/axis/README.md`; `axis/AGENTS.md`; `kern/docs/architecture/axis-contract.md` (DRAFT); `kern/packages/kern-native/src/components/fab.tsx`; `kern/packages/kern{,-native}/src/components/` listings; vendored dep `kern/packages/kern*/package.json` (`file:../../vendor/axis/*.tgz`).
