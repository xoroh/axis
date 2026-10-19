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

Systematic deviations (recorded once here, not per component —
see contract §11):

| # | Deviation | Native reason |
|---|---|---|
| D1 | No `data-*` attributes on any part | RN hosts reject unknown props; no stylesheet engine consumes selectors. Same state objects flow through function `style`/`render` props. `className` on substituted elements overrides to `undefined`. |
| D2 | `Portal` has no `container` | No DOM to append to; RN `Modal` always presents at root level. |
| D3 | `Portal` has no `keepMounted` | Invisible modal subtrees hide from RNTL exactly like the platform hides them — an untestable keep-alive prop violates the contract's test requirements. Deferred until a device-verified strategy exists. |
| D4 | No `Viewport` part on Dialog | A Popup scrolls through caller `ScrollView` content; a positioning container with no positioning work is chrome. |
| D5 | No `initialFocus`/`finalFocus`, no `"trap-focus"` containment | Needs the `focusTrap` + `overlayModality` RN adaptation (no DOM tab order to borrow). Surfaces declare role + label; traversal stays with the host. |
| D6 | No nested-overlay coordination | Nested Modals render independently; no parent dimming or dismissal-stack sharing. |
| D7 | No `createHandle` detached triggers | Needs an imperative registry owner; payload patterns unneeded pre-1.0. |
| D8 | No hover or keyboard traversal on menus/popups | No touch equivalent; `roving`/`collection` unadopted for these families (contract's conditional-keyboard rule). |
| D9 | No animation states (`transitionStatus`, starting/ending styles) | Surfaces mount/unmount synchronously (Accordion-panel precedent); `presence`-driven transitions wait for a consumer. |
| D10 | No `Modal`/`portal` host on inline menus | Menus paint inside the parent's box; painting outside it is the `portal` model's job, deferred until a consumer needs it. |

## Per-component parity

Status key: `aligned` (parts + props + composition recorded below)
· `pending` (not yet migrated). Single-part APIs stay where they
ship; alignment adds the compound anatomy, never removes the
concise form pre-1.0.

### Universal composition (this pass)

Every rendered part in `@xoroh/axis` accepts `render` — an element
(cloned with the part props merged under its own via the `slot`
model) or a function of `(props, state)` — per contract §11. Parts
with interaction state take value-or-function `style`
(`StateStyle<State, …>`) over the same state objects Base UI
publishes for selectors; stateless parts (`Separator`, `Label`,
`Text`, `Loader`, `AspectRatio`, `Fieldset`, `Table`/`Header`/`Cell`,
inner structural styles like `trackStyle`/`dayStyle`) keep a static
`style` (the `DialogTitle` precedent — a function of empty state
adds nothing). Each part exports its state type (`ButtonState`,
`SwitchState`, …) from the public entry. RNTL parity suites
(`renderparity`, `disclosureparity`) observe substitution + state on
every family.

### Button — aligned

Base UI `Button`: press primitive with `render` composition.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `Button` | `Button` | `disabled`, `render`, function `style` over `{ disabled, loading }`; ref | `loading`/busy announce is the Axis extension (React Aria `isPending` pattern — Base UI has no loading prop); `data-disabled` → D1. `render` composition covers the icon/loading/link press cases with no separate components |

### Dialog — aligned

Base UI parts: Root, Trigger, Portal, Backdrop, Viewport,
Popup, Title, Description, Close.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `DialogRoot` | `Dialog.Root` | `open`, `defaultOpen`, `onOpenChange` identical; renders no element | `modal` accepted, `"trap-focus"` behaves as modal (D5); no `handle`, `triggerId`, `actionsRef`, `onOpenChangeComplete` (D7 and no-transition consequences of D9) |
| `DialogTrigger` | `Dialog.Trigger` | button role, `disabled`, `render`, expanded state | `nativeButton`/`payload`/`id`/`handle` omitted (D7); `data-popup-open`/`data-disabled` → D1 (state flows through `render`/`style` fns) |
| `DialogPortal` | `Dialog.Portal` | RN `Modal` host, `testID` (Axis addition) | D2, D3 |
| `DialogBackdrop` | `Dialog.Backdrop` | scrim dismissal, `render`, function styles with `{open}` | `disablePointerDismissal` lives on Root (ours aggregates it there; monolith spells it `dismissable`); `data-open/closed` → D1; no transition attributes (D9) |
| `DialogPopup` | `Dialog.Popup` | surface with dialog role, `render`, function styles | D4, D5, D9 |
| `DialogTitle` | `Dialog.Title` | heading text (`header` role) | — |
| `DialogDescription` | `Dialog.Description` | descriptive text | — |
| `DialogClose` | `Dialog.Close` | closes root, `disabled`, `render` with `{disabled}` | `nativeButton` omitted (RN presses are native by construction); `data-disabled` → D1 |
| `Dialog` (monolith) | — | Concise single-part API retained: `open`/`defaultOpen`/`onOpenChange`/`onDismiss`/`dismissable`/`title`/`actions`/styles | Not a Base UI part; kept for existing consumers, documented alongside the compound form |

### Menu — aligned

Base UI parts: Root, Trigger, Portal, Backdrop, Positioner, Popup,
Arrow, Item, LinkItem, Separator, SubmenuRoot, SubmenuTrigger,
Group, GroupLabel, RadioGroup, RadioItem(+Indicator),
CheckboxItem(+Indicator), List, Viewport (+Input/Clear/Empty/
FilterProvider filtering).

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `MenuRoot` | `Menu.Root` | `open`, `defaultOpen`, `onOpenChange` identical; renders no element | `onDismiss` (Axis extension, consistent with the monolith); no `modal` — compound menus always present a Backdrop (non-modal variant deferred: outside-press detection without a scrim needs press-capture that would hijack app touches) |
| `MenuTrigger` | `Menu.Trigger` | button role, `disabled`, `render`, expanded state; registers the positioner anchor | `openOnHover` omitted (D8 — no touch equivalent); `data-popup-open`/`data-disabled` → D1 |
| `MenuPortal` | `Menu.Portal` | RN `Modal` host (native body-append equivalent) | D2 (no `container`) |
| `MenuBackdrop` | `Menu.Backdrop` | scrim dismissal, `render`, function styles with `{open}` | `disablePointerDismissal` lives on Root; `data-open/closed` → D1; no transition attributes (D9) |
| `MenuPositioner` | `Menu.Positioner` | `side`, `align`, `sideOffset`, `alignOffset` against the measured trigger anchor (model extended with `align` for this) | No `Arrow` coupling (arrow geometry is caller style) |
| `MenuPopup` | `Menu.Popup` | content box with menu role, `render`, function styles, `ref` | `data-open/closed` → D1; no transition attributes (D9) |
| `MenuItem` | `Menu.Item` | `disabled`, `onClick`, `closeOnClick` (default `true`), `render`; `highlighted` press state in style fns (touch adaptation of highlight) | `value`/`onSelect` optional Axis extensions (Base items carry no value; cascade identity needs it — `DropdownMenu` depends on it); `data-highlighted`/`data-disabled` → D1 |
| `MenuSeparator` | `Menu.Separator` | silent divider | — |
| `MenuGroup` + `MenuGroupLabel` | `Menu.Group` + `Menu.GroupLabel` | group container + label text | — |
| `MenuLinkItem` | `Menu.LinkItem` | link-role item, same select/click/close sequence (shared hook, no duplicated logic) | No `href` (no URL handling on native — navigation is caller behavior) |
| `MenuArrow` | `Menu.Arrow` | caller-positioned marker | Geometry is caller style (no anchor/popup measurement coupling in the part) |
| `modal={false}` on Root | non-modal menus | in-box portal, no scrim, trigger toggles | Outside-press without a scrim reaches the app (press-capture would hijack touches) |
| `Menu` (monolith) | — | Concise inline API retained (trigger zone + in-box scrim + partitioned content); `MenuItem.value` now optional, `onClick`/`closeOnClick` added | Not a Base UI part; in-box scrim by design (compound `Portal` escapes instead) |
| Checkbox/Radio/Filter parts | `Menu.CheckboxItem`, `Menu.RadioGroup`, `Menu.Input`, … | **Aligned this slice:** `MenuCheckboxItem` (+`Indicator`), `MenuRadioGroup`/`MenuRadioItem` (+`Indicator`) with controlled-state APIs; checkbox items stay open by default (`closeOnClick` default `false`), radio items close. **Filter parts added:** `MenuRoot` owns the query (`filterValue`/`defaultFilterValue`/`onFilterChange`) with `MenuInput` (entry), `MenuClear` (resets; disabled when empty), `MenuEmpty` (renders on zero visible matches); items publish `filterText` (Axis addition — Base UI's Menu has no filter parts) through the `collection` registry, and `MenuEmpty` counts the same rule items hide by. Compound roots only. | No `FilterProvider` (the Root owns the query directly — a provider with no other state is chrome) |
| Submenu parts (`MenuSubmenuRoot`, `MenuSubmenuTrigger`, `MenuSubmenuContent`) | `Menu.SubmenuRoot`, `Menu.SubmenuTrigger`, `Menu.SubmenuContent` | Nested disclosure cascade over `MenuSubContext` inside `MenuRoot`, or thin wrapper around `DropdownMenuSub` within `DropdownMenu`. Verified with open/close and nested-dismiss tests. | Hover open/close omitted (D8 — touch-driven trigger). |

### Switch — aligned

Base UI `Switch`: root + thumb parts with
`checked`/`defaultChecked`/`onCheckedChange`.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `Switch` | `Switch.Root` + `Switch.Thumb` | `checked`, `defaultChecked`, `onCheckedChange` identical (critic decision 2026-10-16); `disabled`, label association, `ref`; switch role with `checked` state; `render` + function `style` over `{ checked, disabled }` | Single-part API (no Root/Thumb split — track/thumb are caller styles, not parts); `data-checked`/`data-disabled` → D1 |

### Checkbox — aligned

Base UI `Checkbox`: root + indicator parts with
`checked`/`defaultChecked`/`onCheckedChange`.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `Checkbox` | `Checkbox.Root` + `Checkbox.Indicator` | `checked`, `defaultChecked`, `onCheckedChange` identical; `disabled`, `ref`; checkbox role with `checked` state; `render` + function `style` over `{ checked, disabled }` | Single-part API (indicator renders only when checked per caller style, not a separate part); `data-checked`/`data-disabled`/`data-indeterminate` → D1; no `indeterminate` tri-state (unneeded — record if a consumer needs it) |

### Toggle — aligned

Base UI `Toggle`: `pressed`/`defaultPressed`/`onPressedChange`.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `Toggle` | `Toggle` | `pressed`, `defaultPressed`, `onPressedChange` identical; `disabled`, `ref`; pressed announced through `selected` (RN has no `pressed` state key — verified against RN 0.87 `ViewAccessibility`); `render` + function `style` over `{ pressed, disabled }` | `data-pressed`/`data-disabled` → D1 |

### Popover — aligned

Base UI parts: Root, Trigger, Portal, Backdrop, Positioner,
Popup, Arrow, Title, Description, Close.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `PopoverRoot` | `Popover.Root` | `open`, `defaultOpen`, `onOpenChange`, `onDismiss` identical; renders no element | `modal` **defaults `false`** (popovers are non-modal overlays — inverse of Dialog/Menu); non-modal renders in-box with no scrim, trigger toggles |
| `PopoverTrigger` | `Popover.Trigger` | tap toggle, button role, `disabled`, `render`, expanded state, anchor registration | No hover (D8); `data-popup-open`/`data-disabled` → D1 |
| `PopoverPortal` | `Popover.Portal` | RN `Modal` host when modal, in-box otherwise | D2 (no `container`) |
| `PopoverBackdrop` | `Popover.Backdrop` | scrim dismissal **modal-only** (without a Modal host a full-fill scrim would trap app touches with no dismissal path) | `data-open/closed` → D1; no transition attributes (D9) |
| `PopoverPositioner` | `Popover.Positioner` | `side`, `align`, `sideOffset`, `alignOffset` against the measured trigger anchor | No `Arrow` coupling (arrow geometry is caller style) |
| `PopoverPopup` | `Popover.Popup` | content region, `render`, function styles, `ref` | **No role claim** — RN defines no popover role (verified against RN 0.87 `ViewAccessibility`); labelled region instead (honest silence) |
| `PopoverTitle` | `Popover.Title` | heading text (`header` role) | — |
| `PopoverDescription` | `Popover.Description` | descriptive text | — |
| `PopoverClose` | `Popover.Close` | closes root, `disabled`, `render` | `data-disabled` → D1 |
| `PopoverArrow` | `Popover.Arrow` | caller-positioned marker | Geometry is caller style |
| `Popover` (monolith) | — | Concise inline API retained (anchor + in-box scrim + measured box) | Not a Base UI part; always non-modal inline by design |

### Select — aligned

Base UI parts: Root, Label, Trigger, Value, Icon, Backdrop,
Portal, Positioner, Popup, List, Arrow, Item, ItemText,
ItemIndicator, Group, GroupLabel, ScrollUpArrow, ScrollDownArrow,
Separator.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `SelectRoot` | `Select.Root` | `value`, `defaultValue`, `onValueChange`, `open`, `defaultOpen`, `onOpenChange`, `onDismiss`, `modal` (default `true`), `disabled`; renders no element | `items` lookup table kept (labels for closed-list display); `disablePointerDismissal` (Axis extension, consistent with `MenuRoot`); no `multiple`, no form integration (`name`/`required`/`readOnly` — native forms are caller-owned), no `actionsRef`/imperative handle (D7), no transition callbacks (D9) |
| `SelectTrigger` | `Select.Trigger` | button role, `disabled`, `render`, expanded state; registers the positioner anchor | `nativeButton` omitted (RN presses are native by construction); `data-*` → D1; no `popupSide` in state (no arrow coupling) |
| `SelectValue` | `Select.Value` | `placeholder`, function children `(value) => node` for formatting | label resolved from the item registry + root `items` (closed lists unmount); `data-placeholder` → D1 |
| `SelectPortal` | `Select.Portal` | RN `Modal` host, in-box when non-modal | D2 (no `container`); overlay-root adoption seam noted in-file (positioning stays separable) |
| `SelectBackdrop` | `Select.Backdrop` | scrim dismissal, `render`, function styles with `{open}` | `disablePointerDismissal` lives on Root; `data-open/closed` → D1; no transition attributes (D9) |
| `SelectPositioner` | `Select.Positioner` | `side`, `align`, `sideOffset`, `alignOffset` against the measured trigger anchor | no `alignItemWithTrigger` (Base disables it for touch input); standard placement only |
| `SelectPopup` | `Select.Popup` | listbox-role content box, `render`, function styles, `ref` | no `List` part (the popup IS the list container, the `Menu` compound precedent); `data-*` → D1; no transition attributes (D9) |
| `SelectArrow` | `Select.Arrow` | caller-positioned marker | Geometry is caller style (no anchor/popup measurement coupling) |
| `SelectItem` | `Select.Item` | `value`, `label` (Base `Item` `label`), `disabled`, `render`, `selected`/`highlighted`/`disabled` in style fns; publishes text to the label registry | `data-selected/highlighted/disabled` → D1; `nativeButton` omitted |
| `SelectItemText` | `Select.ItemText` | item label content (registers as the item's text without `label`) | — |
| `SelectItemIndicator` | `Select.ItemIndicator` | renders only while selected | no `keepMounted` (D3 — untestable keep-alive) |
| `SelectGroup` + `SelectGroupLabel` | `Select.Group` + `Select.GroupLabel` | group container + label text | — |
| `SelectSeparator` | `Select.Separator` | silent divider | orientation is caller style (horizontal by construction) |
| `Select` (monolith) | — | Concise single-part API retained (trigger + in-box scrim + positioned list, labels read from its own children) | Not a Base UI part; in-box scrim by design (compound `Portal` escapes instead) |
| Omitted | `Select.Label` | — | trigger `accessibilityLabel` (or the Axis `Label` component) names the control |
| Omitted | `Select.Icon` | — | caller content inside `SelectTrigger` |
| Omitted | `Select.ScrollUpArrow`, `Select.ScrollDownArrow` | — | hover-scroll chrome Base UI itself hides on touch input |
| Omitted | typeahead | — | match model (`typeahead`) ships in the models zone; no key events reach native list parts yet, so no part consumes it (first consumer: hardware-keyboard forwarding) |

### Combobox — partial (filtering aligned, compound deferred)

Base UI parts: Root, Input, Trigger, Portal, Backdrop,
Positioner, Popup, List, Row, Empty, Status, Clear, Collection.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `Combobox` (monolith) | `Combobox` filtering | case-insensitive substring filtering now through the shared `collection` default match (same query filters identically in menu filtering and select lookups); open/value controlled pairs, scrim dismissal, `option`/`listbox` roles | Data-driven by design (`options` data, not children — no `ComboboxItem` part); no custom `filter` prop (deferred until ranked/fuzzy matching has a consumer); compound row parts (`Input`/`Clear`/`Row`/`Empty`/`Status`/`Collection`) deferred — revisit when a consumer needs caller-composed rows |
| `collection` model | `Collection` + filtering | `useCollectionRegistry` (register/unregister in order), `defaultCollectionMatch`, `filterCollectionKeys`, `findCollectionText` — consumed by Combobox filtering, menu filter parts, and select label lookup | no keyboard traversal over the registry (conditional-keyboard rule — no section adopts it yet) |

### Tooltip — aligned

Base UI parts: Provider, Root, Trigger, Portal, Positioner,
Popup, Arrow.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `TooltipProvider` | `Tooltip.Provider` | `delay`/`closeDelay` group timing; renders no element | delays run from the long-press commit (hover has no touch equivalent — D8); a pending show cancels on dismiss (no ghost tips) |
| `TooltipRoot` | `Tooltip.Root` | `open`, `defaultOpen`, `onOpenChange`, `disabled` (terminal — forces hidden); renders no element | — |
| `TooltipTrigger` | `Tooltip.Trigger` | long-press toggle, `disabled`, `render`, anchor registration; `delayLongPress` forwarded to the host | no hover (D8); timing itself needs a finger (device gap, recorded — RNTL dispatches `longPress` directly) |
| `TooltipPortal` | `Tooltip.Portal` | in-box host (renders nothing while hidden or outside a root) | no `Modal` host — a non-modal hint must never trap touches (overlay-root adoption seam noted in-file; positioning stays separable) |
| `TooltipPositioner` | `Tooltip.Positioner` | `side` (default `"top"`), `align`, `sideOffset`, `alignOffset` against the measured trigger anchor | No `Arrow` coupling (arrow geometry is caller style) |
| `TooltipPopup` | `Tooltip.Popup` | tip with tooltip role, `render`, function styles, `ref` | `data-*` → D1; no transition attributes (D9) |
| `TooltipArrow` | `Tooltip.Arrow` | caller-positioned marker | Geometry is caller style |
| `Tooltip` (monolith) | — | Concise single-part API retained (anchor + long-press toggle + measured tip); gains `delayLongPress` | Not a Base UI part; in-box tip by design |

### P1 asks from `.reports/kern-needs-from-axis.md`

Four Kern P1 asks touch these families. All four are now implemented, wired, and verified with tests:

| Ask | State | Resolution & Verification |
|---|---|---|
| Anchored positioning (flip/collision) | **Done** | `resolveFloatingSide` evaluates viewport boundaries and flips side (`bottom` <-> `top`, `left` <-> `right`). `SelectPositioner` and `TooltipPositioner` expose `side` in their state and flip when anchored near the viewport boundary (tested in `positioning.test.ts`, `selectparts.rntest.tsx`, and `tooltipparts.rntest.tsx`). |
| Typeahead | **Done** | `matchTypeaheadKey` and `appendTypeaheadQuery` wired into `SelectRoot`/`SelectPopup` and `MenuRoot`/`MenuPopup` key event handling (web `onKeyDown` and native `onKeyPress`) with RNTL prefix tests asserting highlighted/selected items. |
| Submenus | **Done** | `MenuSubmenuRoot`, `MenuSubmenuTrigger`, `MenuSubmenuContent` provide Base UI compound parity (via `MenuSubContext` inside `MenuRoot`, or wrapping `DropdownMenuSub` within `DropdownMenu`), with open/close and nested-dismiss tests. |
| Tooltip delay groups + long-press | **Done** | `TooltipProvider` (`delay`/`closeDelay`) groups timing; a pending show cancels on dismiss. `delayLongPress` is forwarded to the host `Pressable`. |

### All other families — pending

### Toast — aligned (provider + queue)

Base UI parts: Provider, Root, Title, Description, Close, Action,
Viewport + `toast.add()` object API.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `ToastProvider` | `Toast.Provider` | queue owner, renders no element | Payloads are caller `ToastOptions` (`message`, `actionLabel`, `onAction`, `duration`) held beside the shared `toastQueue` model |
| `useToast` | `toast.add()` | `add(options): id`, `dismiss(id)`, `clear()`; throws outside the provider instead of dropping toasts | Hook form (no ambient singleton on native) |
| `ToastViewport` | `Toast.Viewport` | paints one single-shot `Toast` per queued id, oldest-first, optional `limit`; `render` + function `style` over `{ count }` | In-box container (no positioning work — chrome); over-limit toasts stay queued but unpainted |
| `Toast` (monolith) | `Toast.Root` | `open`/`defaultOpen`/`onOpenChange`/`duration`/`actionLabel`/`onAction`; `render` + function `style` over `{ open }` | No separate `Title`/`Description` parts — the message is caller text in a polite live region; timed auto-dismiss is the `Close`. M3 Snackbar stays separate in Kern |

### Portal — aligned (standalone host)

Base UI `Portal` counterpart; rn-primitives `Portal`/`PortalHost`
parity (`hostName` naming).

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `PortalHost` | `Portal` (host side) | named hosts (`name`), registry-ordered painting, `render` substitution | In-box painting (the `Menu` precedent) — root presentation stays each overlay's own `Modal`; D2 (no `container`), D3 (no `keepMounted`) |
| `Portal` | `Portal` (content side) | `hostName` matching, nearest-scope nesting, cleanup on unmount | No matching host renders inline (never silently dropped) |

### Input / Textarea — Base UI change-event names

`Input`/`Textarea` used the RN host name `onChangeText`; contract
§6 reserves `onValueChange` for value controls, and `Search` already
used it. Hard cut (ADR 011, nothing published): both now take
`onValueChange`. The host `TextInput` still receives RN
`onChangeText` — the rename is the public prop only. Internal
consumers (`Search`, `Combobox`, `OtpField`, `Autocomplete`,
`TimePicker`, `NumberField`) and suites updated in the same slice.

### Remaining compound-anatomy gaps (composition aligned, anatomy pending)

`render` + function `style` now hold on every part below; what
remains is Base UI's finer compound anatomy, each deferred for a
named reason (not oversight):

| Family | Remaining gap | Blocker / disposition |
|---|---|---|
| Accordion | no `Header`/`Trigger`/`Panel` split (`header` prop + `children`) | Single-part API retained; split needs no new behavior — record if a consumer needs part-level substitution |
| AlertDialog | rebuilt on the compound `Dialog` parts this pass (was monolith-only) | — |
| Autocomplete | no `Input`/`Portal`/`List`/`Row`/`Empty`/`Status` parts | Needs `collection` transfer for row registration; `Empty`/`Status` chrome without it |
| Checkbox Group / Radio Group / Toggle Group | Root + Item only (no Indicator parts) | Indicator is caller style, not a part (Checkbox precedent) |
| Collapsible | Root/Trigger/Panel present; composition added this pass | — |
| Combobox / Select | no `Collection`/filter parts (`Input`/`Clear`/`Empty`/`FilterProvider`) | Needs `collection` transfer + typeahead design |
| Context Menu | monolith (no Trigger/Portal/Positioner/Popup/Item split) | Portal-host adoption for the positioning story; in-box precedent holds |
| Field / Fieldset | no `Control`/`Description`/`Validity`/`Legend` parts | Validity is caller state (`error`); control wiring deferred until a consumer demonstrates the need |
| Meter / Progress | no `Track`/`Indicator`/`Label`/`Value` parts | Fill is data-driven width under caller style; label/value are caller text |
| Number Field | monolith (no `Group`/`Input`/`Increment`/`Decrement`/`ScrubArea`) | Composes Axis `Input` + `Button`; `ScrubArea` has no touch equivalent |
| OTP Field | single part (no `Input` part split) | Single hidden entry fanning to cells is the native adaptation |
| Slider | single part (no `Track`/`Thumb` parts) | Track/thumb are caller styles, not parts (Switch precedent) |
| Tabs | no `Indicator` | Indicator geometry is caller style |
| Tooltip | monolith (no `Provider`/`Trigger`/`Portal`/`Positioner`/`Popup`/`Arrow` split) | Portal-host adoption for the positioning story; long-press toggle is the touch adaptation |
| Dropdown Menu / Menubar / Navigation Menu | Axis cascade/bar APIs (not Base part names) | `DropdownMenu` IS the submenu pattern (parity record: mapped, not duplicated) |
| Calendar / Time Picker / Sheet / Drawer | no Base UI counterpart (Aria/mobile patterns) | Composition added this pass; full picker parity (Aria DatePicker) deferred |
| Form / Scroll Area / Preview Card | no Axis export | `na-native` per COVERAGE (Scroll Area, Preview Card); Form has no owner yet |

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
