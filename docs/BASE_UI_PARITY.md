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
| Checkbox/Radio/Filter parts | `Menu.CheckboxItem`, `Menu.RadioGroup`, `Menu.Input`, … | **Partially aligned this slice:** `MenuCheckboxItem` (+`Indicator`), `MenuRadioGroup`/`MenuRadioItem` (+`Indicator`) with controlled-state APIs; checkbox items stay open by default (`closeOnClick` default `false`), radio items close | Filter parts (`Input`/`Clear`/`Empty`/`FilterProvider`) deferred: filtering needs item registration (`collection` transfer) + typeahead design — chrome without them |
| Submenu parts | `Menu.SubmenuRoot`, `Menu.SubmenuTrigger` | **Mapped, not duplicated:** `DropdownMenu` IS the submenu pattern (cascade over a single root-owned dismissal stack). Thin aliases evaluated and rejected: a renamed duplicate adds names without behavior | — |

### Switch — aligned

Base UI `Switch`: root + thumb parts with
`checked`/`defaultChecked`/`onCheckedChange`.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `Switch` | `Switch.Root` + `Switch.Thumb` | `checked`, `defaultChecked`, `onCheckedChange` identical (critic decision 2026-10-16); `disabled`, label association, `ref`; switch role with `checked` state | Single-part API (no Root/Thumb split — track/thumb are caller styles, not parts); deprecated `value`/`defaultValue`/`onValueChange` aliases warn once until removal (contract §10); `data-checked`/`data-disabled` → D1 |

### Checkbox — aligned

Base UI `Checkbox`: root + indicator parts with
`checked`/`defaultChecked`/`onCheckedChange`.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `Checkbox` | `Checkbox.Root` + `Checkbox.Indicator` | `checked`, `defaultChecked`, `onCheckedChange` identical; `disabled`, `ref`; checkbox role with `checked` state | Single-part API (indicator renders only when checked per caller style, not a separate part); `data-checked`/`data-disabled`/`data-indeterminate` → D1; no `indeterminate` tri-state (unneeded — record if a consumer needs it) |

### Toggle — aligned

Base UI `Toggle`: `pressed`/`defaultPressed`/`onPressedChange`.

| Axis part | Base counterpart | API parity | Deviations |
|---|---|---|---|
| `Toggle` | `Toggle` | `pressed`, `defaultPressed`, `onPressedChange` identical; `disabled`, `ref`; pressed announced through `selected` (RN has no `pressed` state key — verified against RN 0.87 `ViewAccessibility`) | `data-pressed`/`data-disabled` → D1 |

### Popover — pending

### Select — pending

### Combobox — pending

### Tooltip — pending

### Switch — pending

### Checkbox — pending

### All other families — pending
