# Base UI parity record

Owner direction 2026-10-16: Axis is the React Native counterpart of
Base UI and mirrors it as closely as React Native allows — same
component names, compound part structure, prop names and semantics,
controlled + uncontrolled patterns, `render`-style composition —
with every intentional deviation documented alongside its native
reason. `rn-primitives` (MIT, `roninoss/rn-primitives`) and other
mature RN libraries serve as implementation references for native
behavior, accessibility, gestures, and portals only: no dependency,
no wholesale copying.

rn-primitives reference: 1bebe66b12e7ddd3c313226e0bc2ee02b6e78ab4 (2026-08-08, upstream `main` HEAD at review time).
Overlays behaviour review (2026-10-19): Dialog, AlertDialog,
Popover, Tooltip, Portal, Overlay, Toast compared file-by-file
against that SHA; every remaining difference is a D-rule below.

Systematic deviations (recorded once here, not per component —
see contract §11):

| # | Deviation | Native reason |
|---|---|---|
| D1 | No `data-*` attributes on any part | RN hosts reject unknown props; no stylesheet engine consumes selectors. Same state objects flow through function `style`/`render` props. `className` on substituted elements overrides to `undefined`. |
| D2 | `Portal` has no `container` | No DOM to append to; RN `Modal` always presents at root level. |
| D3 | `Portal` has no `keepMounted` | Invisible modal subtrees hide from RNTL exactly like the platform hides them — an untestable keep-alive prop violates the contract's test requirements. Deferred until a device-verified strategy exists. |
| D4 | No `Viewport` part on Dialog | A Popup scrolls through caller `ScrollView` content; a positioning container with no positioning work is chrome. |
| D5 | No `initialFocus`/`finalFocus`, no `"trap-focus"` containment | Needs the `focusTrap` + `overlayModality` RN adaptation (no DOM tab order to borrow). Surfaces declare role + label; traversal stays with the host. **Retired for overlays 2026-10-19 (focus PR): the RN adaptation landed — `initialFocus`/`finalFocus` on roots/popups, iOS `accessibilityViewIsModal` on the top popup, Android app-root hiding via `useModalActive`, web `aria-modal` + Tab trap. Other lanes still carry D5 until their focus pass.** |
| D6 | No nested-overlay coordination | Nested Modals render independently; no parent dimming or dismissal-stack sharing. |
| D7 | No `createHandle` detached triggers | Needs an imperative registry owner; payload patterns unneeded pre-1.0. |
| D8 | No hover or keyboard traversal on menus/popups | No touch equivalent; `roving`/`collection` unadopted for these families (contract's conditional-keyboard rule). |
| D9 | No animation states (`transitionStatus`, starting/ending styles) | Surfaces mount/unmount synchronously (Accordion-panel precedent); `presence`-driven transitions wait for a consumer. |
| D10 | No `Modal`/`portal` host on inline (non-modal) menus | Non-modal menus paint inside the parent's box; painting outside it is the compound `Portal` parts' job (`OverlayPortal` at `PortalHost` when modal) — the Portal model they build on. |
| D11 (overlays) | Unmounted trigger restores nowhere on native | RN has no focusable-ancestor query; a stale restore target is a silent no-op, never a throw. On web the nearest focusable ancestor (stashed while open) takes focus. |
| D12 (overlays) | Default initial focus on native resolves from the part registry, not the DOM | RN exposes no focusable enumeration: marked initial, else first registered stop (drawers skip stops — never a destructive action), else Title, else the popup. Web queries the first tabbable instead (marked wins on both). |

## Per-component parity

Status key: `aligned` (parts + props + composition recorded below)
· `pending` (not yet migrated). Single-part families with no
Base UI compound stay as they ship (contract §2).

### Universal composition (this pass)

Every rendered part in `@xoroh/axis` accepts `render` — an element
(cloned with the part props merged under its own via the `slot`
model) or a function of `(props, state)` — per contract §11. Parts
with interaction state take value-or-function `style`
(`StateStyle<State, …>`) over the same state objects Base UI
publishes for selectors; stateless parts (`Separator`, `Label`,
`AspectRatio`, `FieldsetRoot`, `TableRoot`/`TableHeader`/`TableCell`,
inner structural styles like `dayStyle`) keep a static
`style` (the `DialogTitle` precedent — a function of empty state
adds nothing). Each part exports its state type (`ButtonState`,
`SwitchRootState`, …) from the public entry. RNTL parity suites
(`renderparity`, `disclosureparity`) observe substitution + state on
every family.

### Button — aligned

Base UI `Button`: press primitive with `render` composition.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `Button` | `Button` | — (RN `Pressable`) | `disabled`, `render`, function `style` over `{ disabled, loading }`; ref | `loading`/busy announce is the Axis extension (React Aria `isPending` pattern — Base UI has no loading prop); `data-disabled` → D1. `render` composition covers the icon/loading/link press cases with no separate components |

### Dialog — aligned

Base UI parts: Root, Trigger, Portal, Backdrop, Viewport,
Popup, Title, Description, Close.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `DialogRoot` | `Dialog.Root` | `Dialog.Root` | `open`, `defaultOpen`, `onOpenChange` identical; renders no element | `modal` accepted, `"trap-focus"` behaves as modal (D5); no `handle`, `triggerId`, `actionsRef`, `onOpenChangeComplete` (D7 and no-transition consequences of D9) |
| `DialogTrigger` | `Dialog.Trigger` | `Dialog.Trigger` | button role, `disabled`, `render`, expanded state | `nativeButton`/`payload`/`id`/`handle` omitted (D7); `data-popup-open`/`data-disabled` → D1 (state flows through `render`/`style` fns) |
| `DialogPortal` | `Dialog.Portal` | `Dialog.Portal` | `OverlayPortal` at `PortalHost`, `testID` (Axis addition) | D2, D3 |
| `DialogBackdrop` | `Dialog.Backdrop` | `Dialog.Overlay` | scrim dismissal, `render`, function styles with `{open}` | `disablePointerDismissal` lives on Root; `data-open/closed` → D1; no transition attributes (D9) |
| `DialogPopup` | `Dialog.Popup` | `Dialog.Content` | surface with dialog role, `render`, function styles | D4, D5, D9 |
| `DialogTitle` | `Dialog.Title` | `Dialog.Title` | heading text (`header` role) | — |
| `DialogDescription` | `Dialog.Description` | `Dialog.Description` | descriptive text | — |
| `DialogClose` | `Dialog.Close` | `Dialog.Close` | closes root, `disabled`, `render` with `{disabled}` | `nativeButton` omitted (RN presses are native by construction); `data-disabled` → D1 |


### AlertDialog — aligned (blocking compound)

Base UI parts: Root, Trigger, Portal, Backdrop, Popup, Title,
Description, Close (`Cancel`/`Action` map to `Close` — see below).

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `AlertDialogRoot` | `AlertDialog.Root` | `Dialog.Root` | `open`, `defaultOpen`, `onOpenChange` (+ reason), `initialFocus`, `finalFocus`; renders no element | forces `disablePointerDismissal` + `modal` — a blocking dialog has no dismissable shape (D12-adjacent product rule, recorded in the focus PR) |
| `AlertDialogTrigger` | `AlertDialog.Trigger` | `Dialog.Trigger` | button role, `disabled`, `render`, expanded state | `nativeButton`/`payload`/`id`/`handle` omitted (D7) |
| `AlertDialogPortal` | `AlertDialog.Portal` | `Dialog.Portal` | `OverlayPortal` at `PortalHost`, `testID` (Axis addition) | D2, D3 |
| `AlertDialogBackdrop` | `AlertDialog.Backdrop` | `Dialog.Overlay` | inert by construction (no handler, no label) | blocking scrim has no dismiss path (deliberate — the blocking contract) |
| `AlertDialogPopup` | `AlertDialog.Popup` | `Dialog.Content` | surface with `alertdialog` role, `render`, function styles | D9; role forced (never plain `dialog`) |
| `AlertDialogTitle` | `AlertDialog.Title` | `Dialog.Title` | heading text (`header` role) | — |
| `AlertDialogDescription` | `AlertDialog.Description` | `Dialog.Description` | descriptive text | — |
| `AlertDialogClose` | `AlertDialog.Cancel` / `Action` | `Dialog.Close` | closes root, `disabled`, `render`; `initialFocus` marks Cancel (Axis cannot infer destructiveness) | one Close part covers both Base UI action parts (documented mapping, not a gap) |

`onOpenChange` reasons: `trigger-press`, `close-press`
(`outside-press`/`escape-key` never fire — blocking). Focus:
marked-Cancel default, else first stop/title default (D12);
restore to trigger or `finalFocus`, D11 unmounted-trigger rule.
The bare `AlertDialog` monolith is removed (naming rule — no
bare monolith beside a compound family). rn-primitives
behaviour: alert-dialog dialog-role content, blocking scrim,
back + VO-escape handling — Axis matches except the VO-escape
(kept blocking deliberately) and the `alertdialog` role (kept —
upstream parity).

### Menu — aligned

Base UI parts: Root, Trigger, Portal, Backdrop, Positioner, Popup,
Arrow, Item, LinkItem, Separator, SubmenuRoot, SubmenuTrigger,
Group, GroupLabel, RadioGroup, RadioItem(+Indicator),
CheckboxItem(+Indicator), List, Viewport (+Input/Clear/Empty/
FilterProvider filtering).

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `MenuRoot` | `Menu.Root` | `DropdownMenu.Root` | `open`, `defaultOpen`, `onOpenChange` identical; renders no element | `onDismiss` (Axis extension); `modal={false}` presents through the plain `Portal` with no Backdrop (documented limitation: outside-press detection without a scrim needs press-capture that would hijack app touches) |
| `MenuTrigger` | `Menu.Trigger` | `DropdownMenu.Trigger` | button role, `disabled`, `render`, expanded state; registers the positioner anchor | `openOnHover` omitted (D8 — no touch equivalent); `data-popup-open`/`data-disabled` → D1 |
| `MenuPortal` | `Menu.Portal` | `DropdownMenu.Portal` | `OverlayPortal` at `PortalHost` when modal, in-box `View` otherwise | D2 (no `container`) |
| `MenuBackdrop` | `Menu.Backdrop` | `DropdownMenu.Overlay` | scrim dismissal, `render`, function styles with `{open}` | `disablePointerDismissal` lives on Root; `data-open/closed` → D1; no transition attributes (D9) |
| `MenuPositioner` | `Menu.Positioner` | — (integrated in Content) | `side`, `align`, `sideOffset`, `alignOffset` against the measured trigger anchor (model extended with `align` for this) | No `Arrow` coupling (arrow geometry is caller style) |
| `MenuPopup` | `Menu.Popup` | `DropdownMenu.Content` | content box with menu role, `render`, function styles, `ref` | `data-open/closed` → D1; no transition attributes (D9) |
| `MenuItem` | `Menu.Item` | `DropdownMenu.Item` | `disabled`, `onClick`, `closeOnClick` (default `true`), `render`; `highlighted` press state in style fns (touch adaptation of highlight) | `value`/`onSelect` optional Axis extensions (Base items carry no value; cascade identity needs it — `DropdownMenu` depends on it); `data-highlighted`/`data-disabled` → D1 |
| `MenuSeparator` | `Menu.Separator` | `DropdownMenu.Separator` | silent divider | — |
| `MenuGroup` + `MenuGroupLabel` | `Menu.Group` + `Menu.GroupLabel` | `DropdownMenu.Group` | group container + label text | — |
| `MenuLinkItem` | `Menu.LinkItem` | — | link-role item, same select/click/close sequence (shared hook, no duplicated logic) | No `href` (no URL handling on native — navigation is caller behavior) |
| `MenuArrow` | `Menu.Arrow` | — | caller-positioned marker | Geometry is caller style (no anchor/popup measurement coupling in the part) |
| `modal={false}` on Root | non-modal menus | — | in-box portal, no scrim, trigger toggles | Outside-press without a scrim reaches the app (press-capture would hijack touches) |
| Checkbox/Radio/Filter parts | `Menu.CheckboxItem`, `Menu.RadioGroup`, `Menu.Input`, … | — | **Aligned this slice:** `MenuCheckboxItem` (+`Indicator`), `MenuRadioGroup`/`MenuRadioItem` (+`Indicator`) with controlled-state APIs; checkbox items stay open by default (`closeOnClick` default `false`), radio items close. **Filter parts added:** `MenuRoot` owns the query (`filterValue`/`defaultFilterValue`/`onFilterChange`) with `MenuInput` (entry), `MenuClear` (resets; disabled when empty), `MenuEmpty` (renders on zero visible matches); items publish `filterText` (Axis addition — Base UI's Menu has no filter parts) through the `collection` registry, and `MenuEmpty` counts the same rule items hide by. Compound roots only. | No `FilterProvider` (the Root owns the query directly — a provider with no other state is chrome) |
| Submenu parts (`MenuSubmenuRoot`, `MenuSubmenuTrigger`, `MenuSubmenuContent`) | `Menu.SubmenuRoot`, `Menu.SubmenuTrigger`, `Menu.SubmenuContent` | `DropdownMenu.Sub` | Nested disclosure cascade over `MenuSubContext` inside `MenuRoot`, or thin wrapper around `DropdownMenuSub` within `DropdownMenu`. Verified with open/close and nested-dismiss tests. | Hover open/close omitted (D8 — touch-driven trigger). |

### Switch — aligned

Base UI `Switch`: root + thumb parts with
`checked`/`defaultChecked`/`onCheckedChange`.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `SwitchRoot` | `Switch.Root` | `Switch.Root` | `checked`, `defaultChecked`, `onCheckedChange` identical (critic decision 2026-10-16); `disabled`, `readOnly` (focusable, announced as enabled, presses change nothing — RN maps no readonly key, so the announcement is the normal switch state), label association, `ref`; switch role with `checked` state; `render` + function `style` over `{ checked, disabled, readOnly }`; renders an optional caller `children` slot after the default track row | Default track/thumb chrome retained (naming migration keeps behavior — full chrome split belongs to a later slice); no `required`/`name`/`value`/`form` (no `Form` owner); `data-checked`/`data-disabled` → D1 |
| `SwitchThumb` | `Switch.Thumb` | `Switch.Thumb` | mounts under a `SwitchRoot`, reads `{ checked, disabled, readOnly }` for function styles; `render`; outside a root renders a plain `View` with default state | Caller-composed (the root keeps its default track row) |

### Checkbox — aligned

Base UI `Checkbox`: root + indicator parts with
`checked`/`defaultChecked`/`onCheckedChange` and `indeterminate`.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `CheckboxRoot` | `Checkbox.Root` | `checked`, `defaultChecked`, `onCheckedChange`, `indeterminate`, `disabled`, `readOnly` (focusable, announced as enabled, presses change nothing — RN maps no readonly key), `ref`; checkbox role with `checked` (`mixed` while indeterminate — RN types `checked` as `boolean \| 'mixed'`); `render` + function `style` over `{ checked, disabled, indeterminate, readOnly }` | No `required`/`name`/`value`/`form`/`inputRef`/`id`/`uncheckedValue` (no `Form` owner — native forms are caller-owned, the `Input` precedent); no `parent` (needs the group's `allValues`, which Axis `CheckboxGroup` does not expose — indeterminate stays caller-owned); no `nativeButton` prop (RN `Pressable` is native by construction — the `MenuItem` precedent); `data-*` → D1; no transition attributes (D9) |
| `CheckboxIndicator` | `Checkbox.Indicator` | `Checkbox.Indicator` | mounts while checked or indeterminate, or always with `keepMounted` (mounted-but-hidden with `{ checked: false, indeterminate: false }` when unchecked); caller styles checked vs mixed through indicator state; `render` over `{ checked, disabled, indeterminate, readOnly }` | `keepMounted` defaults `false` (keep-alive opt-in, tested); static `style` (chrome carries no state) |

### Toggle — aligned

Base UI `Toggle`: `pressed`/`defaultPressed`/`onPressedChange`.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `Toggle` | `Toggle` | `Toggle.Root` | `pressed`, `defaultPressed`, `onPressedChange` identical; `disabled`, `ref`; pressed announced through `selected` (RN has no `pressed` state key — verified against RN 0.87 `ViewAccessibility`); `render` + function `style` over `{ pressed, disabled }`; with `value` inside a `ToggleGroup` the group owns pressed state (activation toggles membership) | `data-pressed`/`data-disabled` → D1; without `value` (or outside a group) the toggle is standalone |

### Toggle Group — aligned

Base UI `ToggleGroup`: single part owning `value: string[]`
with `multiple` (default `false`) and `orientation` (default
`'horizontal'`); items are `Toggle` buttons composed inside.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `ToggleGroup` | `ToggleGroup` | `Toggle.Root` | `value`/`defaultValue`/`onValueChange` over `string[]`, `multiple` (default `false` — single replaces, multi accumulates), `orientation` (default `'horizontal'`, structural `flexDirection` base), `disabled`, `ref`; group role; state carries `{ value, disabled, multiple, orientation }`; items are `Toggle` with `value` (pressed from membership, per-item `disabled` OR'ed with group `disabled`; a `Toggle` without `value` stays standalone) | No `loopFocus` (no roving layer — the `Toolbar` precedent); `data-*` → D1 |


### Accordion — aligned

Base UI `Accordion`: Root/Item/Header/Trigger/Panel with
`value: Value[]`, `multiple` (default `false`), `orientation`
(default `'vertical'`), `hiddenUntilFound` (default `false`).

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `AccordionRoot` | `Accordion.Root` | `Accordion.Root` | `value`/`defaultValue`/`onValueChange` over `string[]`, `multiple` (default `false`), `orientation` (default `'vertical'`, structural `flexDirection` base), `disabled`, `ref`; no root role (RN defines no accordion role) | No `loopFocus` (no roving layer); `orientation` carries no focus behavior (deprecated upstream too); `data-*` → D1 |
| `AccordionItem` | `Accordion.Item` | `Accordion.Item` | `value` (string domain), `disabled`, per-item `onOpenChange` (fires even when another item's activation changes it) | No `index` in state (no `data-index` on native — D1) |
| `AccordionHeader` | `Accordion.Header` | `Accordion.Header` | heading host (`header` role) wrapping the trigger | — |
| `AccordionTrigger` | `Accordion.Trigger` | `Accordion.Trigger` | button role, `expanded` state, tap toggles; inert outside an item | No `nativeButton` prop (not a Base UI Accordion prop; RN `Pressable` is native by construction in any case) |
| `AccordionPanel` | `Accordion.Panel` | `Accordion.Content` | mounts only while the item is open, or always with `keepMounted` (mounted-but-hidden with `{ open: false }` when closed) | No `hiddenUntilFound` (N/A — no find-in-page on native); `keepMounted` defaults `false` (keep-alive opt-in, tested); no transition attributes (D9) |


### Avatar — aligned

Base UI `Avatar`: Root/Image/Fallback with `ImageLoadingStatus`
(`idle` | `loading` | `loaded` | `error`), `Fallback delay`
(default `0`), `Image onLoadingStatusChange`.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `AvatarRoot` | `Avatar.Root` | `Avatar.Root` | status owner (`imageLoadingStatus` state); positioning container | `render` over status; `data-*` → D1 |
| `AvatarImage` | `Avatar.Image` | `Avatar.Image` | `source` (required), `onLoadingStatusChange`, image role + label announced only while loaded; hidden from assistive tech until loaded (Base UI stacking guidance, automatic on RN) | No `keepMounted` (N/A — the image must mount to load; unmount-on-error is automatic); `data-loading`/`data-error` → D1 (state flows through `render`/status instead) |
| `AvatarFallback` | `Avatar.Fallback` | `Avatar.Fallback` | `delay` (default `0` — shows immediately when `idle`/`error`, waits while `loading`); caller children | — |


### Meter — aligned

Base UI `Meter`: Root/Track/Indicator/Label(`Meter.Label`)/Value with `value*`, `min` (default `0`), `max` (default `100`).

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `MeterRoot` | `Meter.Root` | — | `value` (required), `min`/`max`, meter role with `{ min, max, now }` (clamped); `ref` | No `aria-valuetext`/`getAriaValueText`/`locale`/`format` (no `Intl` layer — the caller formats through `MeterValue` function children); `data-*` → D1 |
| `MeterTrack` | `Meter.Track` | — | range container | static `style` (chrome carries no state) |
| `MeterIndicator` | `Meter.Indicator` | — | data-driven fill (clamped percentage, merged under caller style) | static `style` (chrome carries no state) |
| `MeterLabel` | `Meter.Label` | — | accessible-name text host | — |
| `MeterValue` | `Meter.Value` | — | current-value text; node or function of value | — |


### Slider — aligned

Base UI `Slider`: Root/Label/Value/Control/Track/Indicator/Thumb with `value`/`defaultValue` (number | number[]), `onValueChange`, `onValueCommitted`, `step` (default `1`), `largeStep` (default `10`), `minStepsBetweenValues` (default `0`), `min` (default `0`), `max` (default `100`), `orientation` (default `'horizontal'`), `thumbAlignment` (default `'center'`), `disabled` (default `false`).

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `SliderRoot` | `Slider.Root` | `value`/`defaultValue`/`onValueChange`/`onValueCommitted` over `number \| number[]` (single values behave as one-entry ranges; reported in the same shape), `min`/`max` (degenerate collapses to `min`), `step`, `largeStep` (default `10`, consumed by keyboard handling), `minStepsBetweenValues` (default `0`), `orientation` (default `'horizontal'`), `thumbAlignment` (default `'center'`), `disabled`, `ref`; direction comes from the nearest `DirectionProvider` (native-locale fallback) — never a Slider prop (Base UI parity); state carries `{ values, disabled, dragging, activeThumbIndex, orientation, min, max, step, largeStep, minStepsBetweenValues }` | `step` defaults `0` (continuous) vs Base UI `1` — Axis preserves continuous-by-default; keyboard (`onKeyDown`, web-only passthrough) implements Base UI arrows/PageUp/PageDown/Home/End with `onValueCommitted`; `name`/`form`/`inputRef`/`id`/`tabIndex` omitted (no Form owner, no DOM inputs); `locale`/`format` omitted (no `Intl`); `data-*` → D1 |
| `SliderLabel` | `Slider.Label` | — | accessible-name text host | — |
| `SliderValue` | `Slider.Value` | — | node or function of values | No pre-formatted string (no `Intl`) |
| `SliderControl` | `Slider.Control` | — | drag gestures, track-press jump to nearest thumb, measurement; `ref` | Track-press uses `locationX/Y` (same caveat as Base UI's offset math); no commit without a measured track |
| `SliderTrack` | `Slider.Track` | `Slider.Track` | range container | static `style` (chrome carries no state) |
| `SliderIndicator` | `Slider.Indicator` | `Slider.Range` | data-driven fill from the lowest to the highest value (merged under caller style) | static `style` (chrome carries no state) |
| `SliderThumb` | `Slider.Thumb` | `Slider.Thumb` | `index` (default `0`), `role="slider"` with split `aria-valuemin`/`aria-valuemax`/`aria-valuenow` (derived from the one internal state; degenerate collapses `max` to `min`, both render paths), `aria-orientation` matching orientation, `aria-disabled`, caller `aria-label` — aria-only (ADR-112), `increment`/`decrement` actions, positioned on the value point (centered, or edge-pinned with `thumbAlignment="edge"`) | No `nativeButton`/`inputRef`/`tabIndex` (RN host handles presses natively; keyboard is a web-only `onKeyDown` path); no `getAriaLabel`/`getAriaValueText` (caller `aria-label`; no `Intl`); static position geometry + caller `style` |

The old `Slider` monolith is removed (Base UI has no monolith — ADR 001, ADR 011; migration in CHANGELOG). RN math lives in `./models` (`slider.ts`) with unit tests.

### Direction — aligned

Base UI `DirectionProvider` + `useDirection()`: `direction` (`"ltr"` | `"rtl"`, default `"ltr"`).

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `DirectionProvider` | `Direction.Provider` | — | `direction` (default `"ltr"`); renders no host (pure context, the `TooltipProvider` precedent) | No `dir` DOM attribute (web direction stays caller document state) |
| `useDirection` | `useDirection` | — | nearest provider wins; no provider falls back to the native locale (`I18nManager.isRTL`) | Fallback replaces Base UI's document-default assumption (native has no document) |

Consumers (e.g. Slider arrow keys) read the hook instead of taking per-part `dir` props — one owner per tree. `I18nManager` is added to the boundary allowlist with justification (read-only `isRTL`, no UI code).

### Popover — aligned

Base UI parts: Root, Trigger, Portal, Backdrop, Positioner,
Popup, Arrow, Title, Description, Close.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `PopoverRoot` | `Popover.Root` | `Popover.Root` | `open`, `defaultOpen`, `onOpenChange`, `onDismiss` identical; renders no element | `modal` **defaults `false`** (popovers are non-modal overlays — inverse of Dialog/Menu); non-modal renders in-box with no scrim, trigger toggles |
| `PopoverTrigger` | `Popover.Trigger` | `Popover.Trigger` | tap toggle, button role, `disabled`, `render`, expanded state, anchor registration | No hover (D8); `data-popup-open`/`data-disabled` → D1 |
| `PopoverPortal` | `Popover.Portal` | `Popover.Portal` | `OverlayPortal` at `PortalHost` when modal, in-box otherwise | D2 (no `container`) |
| `PopoverBackdrop` | `Popover.Backdrop` | `Popover.Overlay` | scrim dismissal **modal-only** (without an overlay host a full-fill scrim would trap app touches with no dismissal path) | `data-open/closed` → D1; no transition attributes (D9) |
| `PopoverPositioner` | `Popover.Positioner` | — | `side`, `align`, `sideOffset`, `alignOffset` against the measured trigger anchor | No `Arrow` coupling (arrow geometry is caller style) |
| `PopoverPopup` | `Popover.Popup` | `Popover.Content` | content region, `render`, function styles, `ref` | **No role claim** — RN defines no popover role (verified against RN 0.87 `ViewAccessibility`); labelled region instead (honest silence) |
| `PopoverTitle` | `Popover.Title` | — | heading text (`header` role) | — |
| `PopoverDescription` | `Popover.Description` | — | descriptive text | — |
| `PopoverClose` | `Popover.Close` | `Popover.Close` | closes root, `disabled`, `render` | `data-disabled` → D1 |
| `PopoverArrow` | `Popover.Arrow` | — | caller-positioned marker | Geometry is caller style |


### Select — aligned

Base UI parts: Root, Label, Trigger, Value, Icon, Backdrop,
Portal, Positioner, Popup, List, Arrow, Item, ItemText,
ItemIndicator, Group, GroupLabel, ScrollUpArrow, ScrollDownArrow,
Separator.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `SelectRoot` | `Select.Root` | `Select.Root` | `value`, `defaultValue`, `onValueChange`, `open`, `defaultOpen`, `onOpenChange`, `onDismiss`, `modal` (default `true`), `disabled`; renders no element | `items` lookup table kept (labels for closed-list display); `disablePointerDismissal` (Axis extension, consistent with `MenuRoot`); no `multiple`, no form integration (`name`/`required`/`readOnly` — native forms are caller-owned), no `actionsRef`/imperative handle (D7), no transition callbacks (D9) |
| `SelectTrigger` | `Select.Trigger` | `Select.Trigger` | button role, `disabled`, `render`, expanded state; registers the positioner anchor | `nativeButton` omitted (RN presses are native by construction); `data-*` → D1; no `popupSide` in state (no arrow coupling) |
| `SelectValue` | `Select.Value` | `Select.Value` | `placeholder`, function children `(value) => node` for formatting | label resolved from the item registry + root `items` (closed lists unmount); `data-placeholder` → D1 |
| `SelectPortal` | `Select.Portal` | `Select.Portal` | paints through `OverlayPortal` (RN `Modal` only when the surface opts back in via `useModal`; PortalHost by default) | D2 (no `container`); positioning stays separable |
| `SelectBackdrop` | `Select.Backdrop` | `Select.Overlay` | scrim dismissal, `render`, function styles with `{open}` | `disablePointerDismissal` lives on Root; `data-open/closed` → D1; no transition attributes (D9) |
| `SelectPositioner` | `Select.Positioner` | — | `side`, `align`, `sideOffset`, `alignOffset` against the measured trigger anchor | no `alignItemWithTrigger` (Base disables it for touch input); standard placement only |
| `SelectPopup` | `Select.Popup` | `Select.Content` | listbox-role content box, `render`, function styles, `ref` | no `List` part (the popup IS the list container, the `Menu` compound precedent); `data-*` → D1; no transition attributes (D9) |
| `SelectArrow` | `Select.Arrow` | — | caller-positioned marker | Geometry is caller style (no anchor/popup measurement coupling) |
| `SelectItem` | `Select.Item` | `Select.Item` | `value`, `label` (Base `Item` `label`), `disabled`, `render`, `selected`/`highlighted`/`disabled` in style fns; publishes text to the label registry | `data-selected/highlighted/disabled` → D1; `nativeButton` omitted |
| `SelectItemText` | `Select.ItemText` | `Select.Item` | item label content (registers as the item's text without `label`) | — |
| `SelectItemIndicator` | `Select.ItemIndicator` | `Select.Item` | renders only while selected | no `keepMounted` (D3 — untestable keep-alive) |
| `SelectGroup` + `SelectGroupLabel` | `Select.Group` + `Select.GroupLabel` | `Select.Group` | group container + label text | — |
| `SelectSeparator` | `Select.Separator` | `Select.Separator` | silent divider | orientation is caller style (horizontal by construction) |

| Omitted | `Select.Label` | — | trigger `accessibilityLabel` (or the Axis `Label` component) names the control |
| Omitted | `Select.Icon` | — | caller content inside `SelectTrigger` |
| Omitted | `Select.ScrollUpArrow`, `Select.ScrollDownArrow` | — | hover-scroll chrome Base UI itself hides on touch input |
| Omitted | typeahead | — | match model (`typeahead`) ships in the models zone and is consumed by `Select` + `Menu` key handling (`appendTypeaheadQuery`/`matchTypeaheadKey`); no scroll-arrow chrome (Base UI itself hides it on touch input) |

### Combobox — partial (filtering aligned, compound deferred)

Base UI parts: Root, Input, Trigger, Portal, Backdrop,
Positioner, Popup, List, Row, Empty, Status, Clear, Collection.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `Combobox` (monolith) | `Combobox` filtering | — | case-insensitive substring filtering now through the shared `collection` default match (same query filters identically in menu filtering and select lookups); open/value controlled pairs, scrim dismissal, `option`/`listbox` roles | Data-driven by design (`options` data, not children — no `ComboboxItem` part); no custom `filter` prop (deferred until ranked/fuzzy matching has a consumer); compound row parts (`Input`/`Clear`/`Row`/`Empty`/`Status`/`Collection`) deferred — revisit when a consumer needs caller-composed rows |
| `collection` model | `Collection` + filtering | — | `useCollectionRegistry` (register/unregister in order), `defaultCollectionMatch`, `filterCollectionKeys`, `findCollectionText` — consumed by Combobox filtering, menu filter parts, and select label lookup | no keyboard traversal over the registry (conditional-keyboard rule — no section adopts it yet) |

### Tooltip — aligned

Base UI parts: Provider, Root, Trigger, Portal, Positioner,
Popup, Arrow.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `TooltipProvider` | `Tooltip.Provider` | — | `delay`/`closeDelay` group timing; renders no element | delays run from the long-press commit (hover has no touch equivalent — D8); a pending show cancels on dismiss (no ghost tips) |
| `TooltipRoot` | `Tooltip.Root` | `Tooltip.Root` | `open`, `defaultOpen`, `onOpenChange`, `disabled` (terminal — forces hidden); renders no element | — |
| `TooltipTrigger` | `Tooltip.Trigger` | `Tooltip.Trigger` | long-press toggle, `disabled`, `render`, anchor registration; `delayLongPress` forwarded to the host | no hover (D8); timing itself needs a finger (device gap, recorded — RNTL dispatches `longPress` directly) |
| `TooltipPortal` | `Tooltip.Portal` | `Tooltip.Portal` | in-box host (renders nothing while hidden or outside a root) | no `Modal` host — a non-modal hint must never trap touches (deliberately never on the overlay stack; positioning stays separable) |
| `TooltipPositioner` | `Tooltip.Positioner` | — | `side` (default `"top"`), `align`, `sideOffset`, `alignOffset` against the measured trigger anchor | No `Arrow` coupling (arrow geometry is caller style) |
| `TooltipPopup` | `Tooltip.Popup` | `Tooltip.Content` | tip with tooltip role, `render`, function styles, `ref` | `data-*` → D1; no transition attributes (D9) |
| `TooltipArrow` | `Tooltip.Arrow` | — | caller-positioned marker | Geometry is caller style |


### P1 asks from `.reports/kern-needs-from-axis.md`

Four Kern P1 asks touch these families. All four are now implemented, wired, and verified with tests:

| Ask | State | Resolution & Verification |
|---|---|---|
| Anchored positioning (flip/collision) | **Done** | `resolveFloatingSide` evaluates viewport boundaries and flips side (`bottom` <-> `top`, `left` <-> `right`). `SelectPositioner` and `TooltipPositioner` expose `side` in their state and flip when anchored near the viewport boundary (tested in `positioning.test.ts`, `selectparts.rntest.tsx`, and `tooltipparts.rntest.tsx`). |
| Typeahead | **Done** | `matchTypeaheadKey` and `appendTypeaheadQuery` wired into `SelectRoot`/`SelectPopup` and `MenuRoot`/`MenuPopup` key event handling (web `onKeyDown` and native `onKeyPress`) with RNTL prefix tests asserting highlighted/selected items. |
| Submenus | **Done** | `MenuSubmenuRoot`, `MenuSubmenuTrigger`, `MenuSubmenuContent` provide Base UI compound parity (via `MenuSubContext` inside `MenuRoot`, or wrapping `DropdownMenuSub` within `DropdownMenu`), with open/close and nested-dismiss tests. |
| Tooltip delay groups + long-press | **Done** | `TooltipProvider` (`delay`/`closeDelay`) groups timing; a pending show cancels on dismiss. `delayLongPress` is forwarded to the host `Pressable`. |

### All other families — pending

### Drawer — aligned (snap compound + Handle)

Base UI parts: Root, Trigger, Portal, Backdrop, Viewport, Popup,
Content, Title, Description, Close. Axis maps `Viewport` to the
Portal's measured container and `Content` to caller content;
`DrawerHandle` is an Axis addition (Base UI demos use a plain
`div` — a drag-only grip strands screen-reader users).

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `DrawerRoot` | `Drawer.Root` | — | `open`, `defaultOpen`, `onOpenChange` (+ reason), `side`, `snapPoints`, `snapPoint`, `defaultSnapPoint`, `onSnapPointChange`, `modal`, `dismissable`, `initialFocus`, `finalFocus`; renders no element | `swipeDirection` is `side` (Axis names the edge, not the gesture); snap fractions resolve against the measured container, not the viewport |
| `DrawerTrigger` | `Drawer.Trigger` | — | button role, `disabled`, `render`, expanded state | `nativeButton`/`handle` omitted (D7) |
| `DrawerPortal` | `Drawer.Portal` | — | `OverlayPortal` at `PortalHost` + measured full-bleed container | D2, D3 |
| `DrawerBackdrop` | `Drawer.Backdrop` | — | scrim dismissal modal-only (plain host otherwise) | same documented rule as PopoverBackdrop |
| `DrawerPopup` | `Drawer.Popup` | — | edge-anchored surface with dialog role, drag, translate, `render`, function styles | D9; caller geometry (cross-axis size, snap chrome) |
| `DrawerTitle` | `Drawer.Title` | — | heading text (`header` role) | — |
| `DrawerDescription` | `Drawer.Description` | — | descriptive text | — |
| `DrawerClose` | `Drawer.Close` | — | closes root, `disabled`, `render`; `initialFocus` marker | — |
| `DrawerHandle` | — (Axis addition) | — | button role, `dismiss`/`expand`/`collapse` accessibility actions, caller-styled; tap expands | gesture parity, not chrome — the SR path for drag |

`onOpenChange` reasons: `trigger-press`, `outside-press`,
`escape-key`, `close-press`, plus `none` for drag-release
dismissal (Base UI has no gesture-dismiss reason — a drag is
neither an outside press nor a close press, documented on the
reason type). Focus: container-or-Title default (never
destructive — stops skipped, D12); restore to trigger or
`finalFocus`, D11 unmounted-trigger rule. The bare `Drawer`
monolith is removed (naming rule). rn-primitives has no drawer
counterpart — no upstream behaviour to mirror; the design
follows Dialog/Popover precedents.

### Overlay — aligned (shared root for modal surfaces)

No single Base UI counterpart — the shared owner every family
root builds on (state, modality stack, dismissal branches,
scroll lock, presence; one focus executor per surface). Base UI
parity holds at the family roots; the overlay itself is
infrastructure Axis owns.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `OverlayRoot` | `Dialog.Root` state shape (adopted by every family root) | — | `open`, `defaultOpen`, `onOpenChange` (+ reason), `modal`, `dismissable`, granular `dismiss` branches, `initialFocus`, `finalFocus`, `trapFocus`, `restoreFocus`, `preventScroll` | `reason` details are Axis-shaped Base UI parity (Base UI carries richer DOM-bound details — `event`, `cancel()`, trigger element — omitted: no DOM event exists on native) |
| `OverlayTrigger` | `*.Trigger` | — | button role, expanded/disabled state, anchor registration | no imperative handle (D7) |
| `OverlayPortal` | `*.Portal` | — | presence-gated host at `PortalHost`, monotonic `zIndex` | D2, D3 |
| `OverlayBackdrop` | `*.Backdrop` | — | scrim dismissal modal-only (in-box nothing otherwise) | — |
| `OverlayPopup` | `*.Popup` | — | `dialog`/`alertdialog` role, single focus executor, top-only iOS modality, web `aria-modal` + Tab trap | the family popups extend this with scopes and defaults |
| `OverlayClose` | `*.Close` | — | closes root, `disabled` | — |
| `useModalActive` | — (Axis addition) | — | reports any modal open in the shared registry | Android app-root wiring needs a reader; no Base UI equivalent exists |
| `useOverlay` / `useScrollLock` | — | — | context + scroll-lock readers | infrastructure |

rn-primitives behaviour: dialog/portal have no stacking logic
(insertion-order paint, no `zIndex`/top flags, ungated back
handler). Axis registers every overlay in a shared modality
registry (top-only back handling, top-only modality claims,
deterministic `zIndex`) — strictly more correct on native, where
no top-layer exists. iOS VoiceOver scrub dismisses (`escape`
branch); Android hardware back dismisses topmost only (both
reported as `escape-key`); `focus-out` is declared but never
bound (no key listener — D-rule, not an oversight).

### Toast — aligned (compound anatomy + provider + queue)

Base UI parts: Provider, Viewport, Portal, Root, Title, Description, Action, Close + `useToast()` object API.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `ToastProvider` | `Toast.Provider` | — | queue owner, renders no element | Payloads held beside shared `toastQueue` model |
| `useToast` | `toast.add()` | — | `add(options): id`, `dismiss(id)`, `clear()`; throws outside provider | Hook form |
| `ToastViewport` | `Toast.Viewport` | — | paints queued toasts, oldest-first, optional `limit`; `render` + function `style` | In-box container |
| `ToastPortal` | `Toast.Portal` | — | presents toasts at `PortalHost` | — |
| `ToastRoot` | `Toast.Root` | — | `open`, `defaultOpen`, `onOpenChange`, `duration`, `onDismiss`; `role="status"` + `aria-live="polite"` | auto-dismiss timer |
| `ToastTitle` | `Toast.Title` | — | notification heading text (`role="heading"`) | — |
| `ToastDescription` | `Toast.Description` | — | notification message body text | — |
| `ToastAction` | `Toast.Action` | — | interactive action button (`role="button"`) | dismisses toast on press |
| `ToastClose` | `Toast.Close` | — | dismiss button (`role="button"`, `aria-label="Close"`) | dismisses toast on press |

### Portal — aligned (standalone host)

Base UI `Portal` counterpart; rn-primitives `Portal`/`PortalHost`
parity (`hostName` naming).

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `PortalHost` | `Portal` (host side) | `PortalHost` | named hosts (`name`), registry-ordered painting, `render` substitution | In-box painting — overlay presentation is each `OverlayRoot`'s own (RN `Modal` only via `useModal` opt-in); D2 (no `container`), D3 (no `keepMounted`) |
| `Portal` | `Portal` (content side) | `Portal` | `hostName` matching, nearest-scope nesting, cleanup on unmount | No matching host renders inline (never silently dropped) |

### Context Menu — aligned (compound anatomy)

Base UI parts: Root, Trigger, Portal, Backdrop, Positioner, Popup, Item,
Separator, Group, GroupLabel, Arrow.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `ContextMenuRoot` | `ContextMenu.Root` | `ContextMenu.Root` | state owner (`open`, `defaultOpen`, `onOpenChange`, `onDismiss`), anchor measurement context; renders no element | — |
| `ContextMenuTrigger` | `ContextMenu.Trigger` | `ContextMenu.Trigger` | long-press anchor trigger, `disabled`, `render`, `ref` | long-press touch activation on native; no secondary click on mobile |
| `ContextMenuPortal` | `ContextMenu.Portal` | `ContextMenu.Portal` | presents floating tree at the app's `PortalHost` | D2, D3 |
| `ContextMenuBackdrop` | `ContextMenu.Backdrop` | `ContextMenu.Overlay` | fullscreen dismiss scrim with `aria-label="Dismiss menu"` | D1 |
| `ContextMenuPositioner` | `ContextMenu.Positioner` | — (integrated in Content) | `side`, `align`, `sideOffset`, `alignOffset`, `placement` | floating box measured against anchor |
| `ContextMenuPopup` | `ContextMenu.Popup` | `ContextMenu.Content` | surface carrying `role="menu"`, `render`, function styles, `ref` | D1, D9 |
| `ContextMenuItem` | `ContextMenu.Item` | `ContextMenu.Item` | action item with `role="menuitem"`, `aria-disabled`, `onSelect`, `onPress` | closes menu on press |
| `ContextMenuSeparator` | `ContextMenu.Separator` | `ContextMenu.Separator` | visual divider with `role="separator"`, `aria-orientation="horizontal"` | — |
| `ContextMenuGroup` + `GroupLabel` | `ContextMenu.Group` + `GroupLabel` | `ContextMenu.Group` + `Label` | group container (`role="group"`) and presentation label | — |
| `ContextMenuArrow` | `ContextMenu.Arrow` | — | caller-positioned marker (`accessible={false}`) | — |

### Preview Card — aligned (compound anatomy)

Base UI parts: Root, Trigger, Portal, Backdrop, Positioner, Popup, Arrow.

| Axis part | Base counterpart | rn-primitives counterpart | API parity | Deviations |
|---|---|---|---|---|
| `PreviewCardRoot` | `PreviewCard.Root` | — | state and delay timers owner (`open`, `defaultOpen`, `onOpenChange`, `delay`, `closeDelay`); renders no element | — |
| `PreviewCardTrigger` | `PreviewCard.Trigger` | — | anchor trigger, `href`, `onPress`, `render`, `ref` | press/long-press on touch screens |
| `PreviewCardPortal` | `PreviewCard.Portal` | — | presents floating tree at `PortalHost` | D2, D3 |
| `PreviewCardBackdrop` | `PreviewCard.Backdrop` | — | optional dismiss scrim | — |
| `PreviewCardPositioner` | `PreviewCard.Positioner` | — | `side`, `align`, `sideOffset`, `alignOffset` floating positioning | — |
| `PreviewCardPopup` | `PreviewCard.Popup` | — | card surface carrying `role="region"`, `render`, function styles | — |
| `PreviewCardArrow` | `PreviewCard.Arrow` | — | caller-positioned marker (`accessible={false}`) | — |

### Input (multiline folded in — `Textarea` removed by ADR 012)

`Input` carries `multiline` (with `numberOfLines` defaulting to 3
there), `autoGrow` (measured height under caller `style`),
`minRows`/`maxRows` row clamps, and `onHeightChange`. Change events
use the Base UI name `onValueChange` (contract §6 reserves it for
value controls). Hard cut (ADR 011, nothing published): the public
prop is `onValueChange`. The host `TextInput` still receives RN
`onChangeText` — the rename is the public prop only. Internal
consumers (`Combobox`, `OtpField`, `Autocomplete`, `NumberField`)
and suites updated in the same slice.
Migrate `<Textarea … />` to `<Input multiline … />`.

### Remaining compound-anatomy gaps (composition aligned, anatomy pending)

`render` + function `style` now hold on every part below; what
remains is Base UI's finer compound anatomy, each deferred for a
named reason (not oversight):

| Family | Remaining gap | Blocker / disposition |
|---|---|---|
| Accordion | compound Root/Item/Header/Trigger/Panel landed (parity-1); `hiddenUntilFound` N/A on native, no `loopFocus` (no roving layer) | Done |
| AlertDialog | rebuilt on the compound `Dialog` parts this pass | — |
| Autocomplete | no `Input`/`Portal`/`List`/`Row`/`Empty`/`Status` parts | `collection` transfer has landed (row registration available); wiring is pending |
| Checkbox Group / Radio Group / Toggle Group | `CheckboxRoot` + `CheckboxIndicator`, `RadioGroup` + `RadioRoot` + `RadioIndicator`, `ToggleGroup` + joined `Toggle` (naming rule) | Indicator is caller style, not a part (Checkbox precedent). ToggleGroup `multiple`/`orientation` landed (parity-1); pressed announces `selected` (RN maps no `pressed` key) |
| Collapsible | Root/Trigger/Panel present; composition added this pass | — |
| Combobox / Autocomplete | no compound row parts (`Input`/`Clear`/`Row`/`Empty`/`Status`) | `collection` transfer has landed and is consumed (menu filter parts, select lookup, combobox filtering); wiring `Combobox`/`Autocomplete` rows onto it is pending |
| Context Menu | compound Root/Trigger/Portal/Backdrop/Positioner/Popup/Item landed (Batch 3) | Done |
| Field / Fieldset | `FieldRoot` + `FieldLabel`/`FieldControl`/`FieldDescription`/`FieldError`/`FieldValidity` and `FieldsetRoot` + `FieldsetLegend` landed (naming rule) | Validation modes, per-field and form-level validate, server-error maps, submit gating, label association (native ids), error live regions. |
| Meter / Progress | Meter compound landed (parity-1); Progress compound `ProgressRoot` + `ProgressTrack`/`ProgressIndicator`/`ProgressLabel`/`ProgressValue` landed (naming rule — value math shared with the root bar); no `Intl` formatting props (`aria-valuetext`/`getAriaValueText`/`locale`/`format` — caller formats through `MeterValue` function children) | Fill is data-driven width under caller style. Progress indeterminate is Base UI exact: `value={null}` (busy announced, no value). |
| Number Field | monolith (no `Group`/`Input`/`Increment`/`Decrement`/`ScrubArea`) | Composes Axis `Input` + `Button`; `ScrubArea` has no touch equivalent |
| OTP Field | `OTPFieldRoot` (single part, no `Input` part split) | Single hidden entry fanning to cells is the native adaptation |
| Slider | compound Root/Label/Value/Control/Track/Indicator/Thumb landed (parity-1 lane); RN math in `./models` (`slider.ts`) | `step` defaults `0` (continuous) vs Base UI `1`; `largeStep` consumed by keyboard handling (web `onKeyDown` passthrough); no push cascade (clamp at gap); no `hiddenUntilFound` (N/A); no `loopFocus` (no roving layer); no `name`/`form`/`inputRef` (no Form owner); no keepMounted (D3) |
| Tabs | `TabsRoot` + `TabsList`/`TabsTrigger`/`TabsPanel` (naming rule); no `Indicator` | Indicator geometry is caller style |
| Dropdown Menu / Menubar / Navigation Menu | `DropdownMenuRoot`, `NavigationMenuRoot` (naming rule); Axis cascade/bar APIs (not Base part names) | `DropdownMenuRoot` IS the submenu pattern (parity record: mapped, not duplicated) |
| Date/time entry | no Axis component (removed by ADR 012) | `calendar` model (grid, roving keys, min/max + `isDateDisabled`, single + range selection, locale, `firstDayOfWeek`, dir) and `time` model (`TimePickerValue`/`TimePickerFormat` stay exported) carry the behavior; composition added this pass for the remaining families. |
| Form + compound Field | Base UI parity (actionsRef superset for submit; Validity state adapted, no DOM roles) | Validation modes, per-field and form-level validate, server-error maps, submit gating, label association (native ids), error live regions. |
| Scroll Area | no Axis export | `na-native` per COVERAGE (Scroll Area). |
| Preview Card | compound Root/Trigger/Portal/Backdrop/Positioner/Popup/Arrow landed (Batch 3) | Done |

### AI chat — new surface (no Base UI counterpart)

Base UI ships no chat primitives, so there is nothing to mirror:
the contract in `docs/AI_CHAT_MODELS.md` IS the cross-platform
agreement (ADR 010). Kern web mirrors these prop names.

| Axis model | Web: Base UI equiv. | Native: Axis (unstyled behavior) | Deviations |
|---|---|---|---|
| `chatStatus` | none — new (`submitted \| streaming \| ready \| error` is the transport's, `idle` is ours) | shared `ChatStatus` + `isChatBusy` / `isChatStreaming` / `isChatError` | — |
| `stickToBottom` | none — new (scroll container only) | stuck-bit math + hook; no virtualization (caller-measured per contract §4) | — |
| `chatMessage` | none — new | role vocabulary + speaker/label resolvers; no parts, no markdown | — |
| `toolCall` | none — new (AI SDK v5 `ToolUIPart` states) | state machine + approve/deny handshake; no registry | — |
| `attachments` | none — new | list + limits validation; no picking, no upload | — |
| `promptInput` | none — new | draft + send gate + submit keys + composer height; no field | — |
| `chatBranch` | none — new | pager index stopping at both ends; no message tree | — |
| `chatSource` | none — new | `{href, title?}` + hygiene; nothing visual | — |
| reasoning | `Collapsible` composition | reused as-is + `resolveReasoningOpen` auto-open helper | — |

## Moved to Kern M3 (scope decision, ADR 006)

Unpublished, so these leave with no aliases and no deprecation
window (ADR 011). Kern M3 owns the styled receivers; Axis keeps
the primitives underneath. `Button` (`loading`/busy announce,
`render` composition) covers the
icon/loading/link press cases — no separate components.

| Axis export (removed) | Disposition |
|---|---|
| `Badge`, `Card`, `Carousel`, `Chip`, `EmptyState`, `Fab`, `ExtendedFab`, `Kbd`, `NavigationBar`, `NavigationRail`, `SettingsRow`, `Skeleton`, `SplitButton`, `TopAppBar`, `ButtonGroup`, `ListItem`, `Pagination` | Moved: Kern M3 owns the pattern; behavior donors port into M3 receivers consuming retained Axis primitives/hooks |
| `IconButton` | Removed: `Button` + required `accessibilityLabel` covers it |
| `LinkButton` | Removed: link-look is caller styling (Base UI forbids button-as-link); `Button`'s `render` composition covers element substitution where it exists (gap noted if absent) |
| `LoadingButton` | Removed: `Button`'s `loading` (busy announce, React Aria `isPending` pattern) covers it — Base UI has no loading prop |
| `NavigationDrawer` | Removed: `Drawer` is the name (no alias, nothing published) |
