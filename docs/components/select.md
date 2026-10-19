## Select

Single- or multi-select dropdown: the trigger shows the current
label (or a placeholder when nothing is chosen); opening presents
the option list, measured and placed against the trigger anchor;
choosing an option commits the value (and closes, unless
`multiple` keeps the list open for toggling). Structure, behavior,
and accessibility only — every visual value (`style`, `listStyle`)
is caller-provided. State follows the controlled + uncontrolled
pattern throughout: `value` (plus `onValueChange`) for controlled
selection, `defaultValue` for uncontrolled; `open` (plus
`onOpenChange`) for controlled open state, `defaultOpen` for
uncontrolled. Two APIs ship side by side: the concise single-part
`Select` (anchor and list partitioned into `children`, always
inline) and the compound parts below, which mirror Base UI's
Select anatomy with the same names and state semantics.

Source of truth: `SelectProps`, `SelectState`, `SelectItemProps`,
`SelectItemState`, `SelectRootProps`, `SelectRootState`,
`SelectTriggerProps`, `SelectTriggerState`, `SelectValueProps`,
`SelectValueState`, `SelectPortalProps`, `SelectBackdropProps`,
`SelectBackdropState`, `SelectPositionerProps`,
`SelectPositionerState`, `SelectPopupProps`, `SelectPopupState`,
`SelectArrowProps`, `SelectGroupProps`, `SelectGroupLabelProps`,
`SelectSeparatorProps`, `SelectItemTextProps`,
`SelectItemIndicatorProps`, `SelectScrollUpArrowProps`,
`SelectScrollDownArrowProps`, `SelectScrollArrowState` in
`@xoroh/axis`
(`packages/axis/src/components/Select.tsx:110-200, 395-620, 772-960, 1776-1835`).

### Install

`@xoroh/axis` is not on npm yet (version `0.0.0`; releases are
owner-gated — `docs/RELEASING.md`). Install from source with the
repo's pack-vendor script, the same flow Kern uses to vendor Axis:

```sh
git clone https://github.com/xoroh/axis.git
cd axis
bun install --frozen-lockfile
node scripts/pack-vendor.mjs --out /tmp/axis-vendor
# prints /tmp/axis-vendor/axis-<short-sha>.tgz + sha512
```

Then add the printed tarball to your app (peers `react >= 18`,
`react-native >=0.86 <0.89`):

```sh
bun add /tmp/axis-vendor/axis-<short-sha>.tgz react react-native
```

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `Select` | — | Concise inline API (anchor `Pressable` + scrim + listbox, always in-box); kept for existing consumers, not a Base UI part. |
| `SelectRoot` | `Select.Root` | State owner (`value`/`open` families, `items` label table, `modal`); renders no element. Wraps an `OverlayRoot` so back, stacking, dismissal, and focus belong to one owner. |
| `SelectTrigger` | `Select.Trigger` | Button role, expanded state, tap toggles, anchor-registering. |
| `SelectValue` | `Select.Value` | Label display (registered label, `items` table, raw value, then placeholder); function children format without a lookup table. |
| `SelectPortal` | `Select.Portal` | `OverlayPortal` host when modal — the list escapes clipped parents; plain in-box `View` when non-modal. |
| `SelectBackdrop` | `Select.Backdrop` | Scrim dismissal, modal roots only. |
| `SelectPositioner` | `Select.Positioner` | Measured placement against the trigger anchor (`side`/`align`/offsets, viewport flip, `alignItemWithTrigger`). |
| `SelectPopup` | `Select.Popup` | Listbox-role content box; option press selects (+ closes unless `multiple`). |
| `SelectArrow` | `Select.Arrow` | Caller-positioned marker; geometry is caller style. |
| `SelectScrollUpArrow` | `Select.ScrollUpArrow` | Jumps the caller's scroller (via `scrollRef`) to the top; no-op without the method. |
| `SelectScrollDownArrow` | `Select.ScrollDownArrow` | Jumps the caller's scroller (via `scrollRef`) to the end; no-op without the method. |
| `SelectItem` | `Select.Item` | Option (`value` required, `label` lookup, per-item `disabled`); shared with the monolith. |
| `SelectItemText` | `Select.ItemText` | Item label content; registers as the item's text when the item has no `label`. |
| `SelectItemIndicator` | `Select.ItemIndicator` | Check mark; renders only while the enclosing item is selected. |
| `SelectGroup` | `Select.Group` | Group container (`group` role). |
| `SelectGroupLabel` | `Select.GroupLabel` | Group heading text. |
| `SelectSeparator` | `Select.Separator` | Non-interactive divider, hidden from assistive tech. |

Omitted Base UI pieces are documented deviations, not
oversights: no `Label` (trigger `accessibilityLabel`), no `Icon`
(compose into `Trigger`), no `List` (the popup IS the list
container), no `multiple`/form props on Combobox/Autocomplete (those
families stay single-value), no `container` (no native meaning) —
all recorded in `docs/BASE_UI_PARITY.md` (§ Select — aligned). No
filtering in Select: search text entry is Combobox, which filters
through the shared `collection` model — `Select` has no
`filterValue`, and hardware-keyboard typeahead is consumed
internally (prefix match moves selection; under `multiple` it
highlights without committing) without a part of its own.

`alignItemWithTrigger` (default `true`) opens the popup with the
selected item over the trigger — the positioning hook shifts the
resolved box by the selected item's list-local origin (reported on
item layout) and clamps back into the viewport; with no selection
(or before the layout lands) it falls back to plain trigger
anchoring. On native the same layout math runs (no DOM involved),
so there is no native N/A — the prop simply applies on both
renderers.

### Overlay hosting

The compound list presents through `OverlayRoot` + `OverlayPortal`
painting at the app's `PortalHost` — that is what lets it escape
clipped parents without an RN `Modal` of its own (one root presents
every layer: Android back, stacking, focus, and scroll lock belong
to the `OverlayRoot` above). `modal` (default `true`) flows
straight into `OverlayRoot`: modal roots paint at `PortalHost`
with a scrim; `modal={false}` roots render in-box with no scrim
and the trigger stays pressable (the `Menu` compound precedent).
`disablePointerDismissal` (default `false`) flows into
`dismissable` and every dismiss branch (`outsidePointer`,
`systemBack`, `escape`); `onDismiss` fires on scrim dismissal
before `onOpenChange(false)`. No family part takes `useModal`
itself — the RN `Modal` host is an `OverlayRoot`-level opt-in for
direct `Overlay` compositions (see `docs/components/overlay.md`).
The monolith never touches this stack: it renders anchor, scrim,
and listbox inline, in-box, like the `Menu` monolith.

### Props

#### `Select` (concise inline API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string \| string[] \| null` | no | — | Controlled selection (`null` for none; an array with `multiple`). Wins over `defaultValue` when defined. |
| `defaultValue` | `string \| string[] \| null` | no | `null` | Uncontrolled initial selection (`null` shows the placeholder; an array with `multiple`). |
| `onValueChange` | `(value: string \| string[]) => void` | no | — | Fires with the chosen item value on every committed selection (`null` is never offered — clearing is not a selection). With `multiple`, the full array after every toggle. |
| `multiple` | `boolean` | no | `false` | Multi-select: choosing toggles membership and never closes; the trigger shows the joined labels. |
| `alignItemWithTrigger` | `boolean` | no | `true` | Align the selected item over the trigger; falls back to trigger anchoring with no selection. |
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed open/close. |
| `placeholder` | `ReactNode` | no | — | Shown in the trigger when nothing is selected. |
| `disabled` | `boolean` | no | `false` | Terminal: the trigger never opens, items never select, no callbacks. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the trigger. |
| `testID` | `string` | no | — | Test identifier; the scrim carries `<testID>-scrim`. |
| `style` | `StateStyle<SelectState, StyleProp<ViewStyle>>` | no | — | Trigger box style: a value or a function of select state. |
| `listStyle` | `StyleProp<ViewStyle>` | no | — | Popup (listbox) box style, caller-provided. |
| `children` | `ReactNode` | yes | — | The list's items (`SelectItem`, required). |
| `render` | `RenderProp<SelectState, SlotProps>` | no | — | Element or function substitution; replaces the anchor container (trigger plus list) with open/close and selection wiring travelling in the props. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root anchor view. |

`SelectState`: `{ value: string | string[] | null; open: boolean; disabled: boolean }`.

Closed renders the anchor only — no scrim, no listbox. Re-pressing
the selected item keeps it (the close still commits, no extra
`onValueChange` fire). Under `multiple`, choosing never dismisses
and an empty selection falls back to the placeholder; the trigger
joins each selected item's label node with `", "` (caller styles
preserved, so the joined text stays readable in both themes),
falling back to the raw value per unmatched entry.

#### `SelectRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string \| string[] \| null` | no | — | Controlled selection (`null` for none; an array with `multiple`). Wins over `defaultValue` when defined. |
| `defaultValue` | `string \| string[] \| null` | no | `null` | Uncontrolled initial selection. |
| `onValueChange` | `(value: string \| string[]) => void` | no | — | Fires with the chosen item value on every committed selection. With `multiple`, the full array after every toggle. |
| `multiple` | `boolean` | no | `false` | Multi-select: choosing toggles membership and never closes; `SelectValue` shows the joined labels. |
| `items` | `ReadonlyArray<{ value: string; label: string }>` | no | — | Static value-label lookup table (Base UI `items` parity): items unmount with a closed list, so pass `items` for the label (not the raw value) to show while closed. Live registrations win while mounted. |
| `open` | `boolean` | no | — | Controlled open state. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next open state on every committed open/close. |
| `onDismiss` | `() => void` | no | — | Fires on scrim dismissal, before `onOpenChange(false)`. |
| `modal` | `boolean` | no | `true` | Whether the open list presents modally (overlay host with a scrim). `false` renders in-box with no scrim. |
| `disablePointerDismissal` | `boolean` | no | `false` | When `true`, backdrop press does not dismiss. |
| `disabled` | `boolean` | no | `false` | Terminal: the trigger never opens, items never select, no callbacks — and the list reads closed even under a controlled `open`. |
| `children` | `ReactNode` | no | — | Trigger, Portal, and shared content. Renders no element itself. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded nowhere (the root renders no element); accepted so ref-spreading callers typecheck. |

`SelectRootState`: `{ open: boolean; value: string | string[] | null }`.

#### `SelectTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal: it never opens and is announced as disabled. Inert outside a root. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<SelectTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `children` | `ReactNode` | no | — | Trigger content (`SelectValue` + caller icon composed by the caller). |
| `render` | `RenderProp<SelectTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`SelectTriggerState`: `{ open: boolean; disabled: boolean }`.

#### `SelectValue`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `placeholder` | `ReactNode` | no | — | Shown when nothing is selected. |
| `children` | `ReactNode \| ((value: string \| string[] \| null) => ReactNode)` | no | — | A node, or a function of the selected value (Base UI parity — formatting without a lookup table). Defaults to the selected item's registered label (joined with `", "` under `multiple`), else the raw value, else the placeholder. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<SelectValueState, StyleProp<TextStyle>>` | no | — | Value style: a value or a function of value state. |
| `render` | `RenderProp<SelectValueState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`SelectValueState`: `{ value: string | string[] | null; placeholder: boolean }` — whether the placeholder is showing.

#### `SelectPortal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Portal content (Backdrop + Positioner composed by the caller). |
| `testID` | `string` | no | — | Test identifier, forwarded to the portal host. |

Renders `null` outside a root and while closed. Modal roots
paint through `OverlayPortal` at the app's `PortalHost`;
non-modal roots render an in-box `View` instead. `container` has
no native meaning and is omitted by design.

#### `SelectBackdrop`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the scrim host. |
| `style` | `StateStyle<SelectBackdropState, StyleProp<ViewStyle>>` | no | — | Scrim style: a value or a function of backdrop state. |
| `render` | `RenderProp<SelectBackdropState, SlotProps>` | no | — | Element or function substitution; dismissal wiring stays on the part. |

`SelectBackdropState`: `{ open: boolean }`. The dismissable
scrim is a `Pressable` labelled "Dismiss select"; when
`disablePointerDismissal` is set on the root, the scrim is a
plain host with no label and no handler — no fake affordance.

#### `SelectPositioner`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `side` | `Placement` | no | `"bottom"` | Preferred side for the list. |
| `align` | `Align` | no | `"center"` | Cross-axis alignment. |
| `sideOffset` | `number` | no | `0` | Gap between anchor and list edges. |
| `alignOffset` | `number` | no | `0` | Shift along the cross axis after alignment. |
| `alignItemWithTrigger` | `boolean` | no | `true` | Align the selected item over the trigger (falls back to trigger anchoring with no selection). Monolith-only prop of the same name behaves identically. |
| `testID` | `string` | no | — | Test identifier, forwarded to the positioner host. |
| `style` | `StateStyle<SelectPositionerState, StyleProp<ViewStyle>>` | no | — | Positioner style: a value or a function of positioner state. |
| `children` | `ReactNode` | no | — | Popup (and optional Arrow content) composed by the caller. |
| `render` | `RenderProp<SelectPositionerState, SlotProps>` | no | — | Element or function substitution; measurement stays on the part. |

`SelectPositionerState`: `{ open: boolean; side: Placement }` —
the effective side after viewport flip/clamping. Renders `null`
outside a root and while closed.

#### `SelectPopup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the content `View`. |
| `style` | `StateStyle<SelectPopupState, StyleProp<ViewStyle>>` | no | — | Popup style: a value or a function of popup state. |
| `children` | `ReactNode` | no | — | Item content. |
| `render` | `RenderProp<SelectPopupState, SlotProps>` | no | — | Element or function substitution; the listbox role stays on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the content `View`. |

`SelectPopupState`: `{ open: boolean }`. Renders `null`
outside a root and while closed. Typeahead keys are handled here
(a typed prefix moves selection).

#### `SelectArrow`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the arrow host. |
| `style` | `StyleProp<ViewStyle>` | no | — | Marker style, caller-provided (static — positioning is caller geometry). |
| `children` | `ReactNode` | no | — | Marker content (usually none — the shape is caller style). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `SelectScrollUpArrow` / `SelectScrollDownArrow`

Long-list chrome (Base UI parity): press jumps the caller's
scroller to the top / end. The caller composes a scrolling host
(usually a `ScrollView`) around the items inside `SelectPopup`
and hands its ref over — anything without the host scroll method
is a no-op, so a caller typo never crashes the list. Both parts
share the same shape; only the direction and default label
(`"Scroll up"` / `"Scroll down"`) differ.

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<SelectScrollArrowState, StyleProp<ViewStyle>>` | no | — | Arrow style: a value or a function of arrow state. |
| `children` | `ReactNode` | no | — | Arrow marker content (usually a chevron glyph). |
| `disabled` | `boolean` | no | `false` | Terminal: it never scrolls and is announced as disabled. |
| `accessibilityLabel` | `string` | no | `"Scroll up"` / `"Scroll down"` | Accessible name source. |
| `scrollRef` | `RefObject<unknown>` | no | — | Ref to the scrolling host the default press jumps (top / end). |
| `onPress` | `() => void` | no | — | Runs after the default scroll-to-edge. Composes like the trigger `onPress` (internal first, then the caller's handler). |
| `render` | `RenderProp<SelectScrollArrowState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`SelectScrollArrowState`: `{ open: boolean; disabled: boolean }` —
whether the list is currently open and whether the arrow is
disabled.

#### `SelectItem` (shared with the monolith)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Selection value contributed to the group when this item is activated. |
| `label` | `string` | no | — | Display label (Base UI `Item` `label` parity): the trigger value lookup and typeahead read this, not the rendered children. Defaults to string children (direct or inside one `SelectItemText`), else the raw `value`. |
| `disabled` | `boolean` | no | `false` | Terminal for this item only: it never selects and is announced as disabled. Siblings are unaffected. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<SelectItemState, StyleProp<ViewStyle>>` | no | — | Value or function of item state, caller-provided. |
| `children` | `ReactNode` | no | — | Item content. |
| `render` | `RenderProp<SelectItemState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`SelectItemState`: `{ selected: boolean; disabled: boolean; highlighted: boolean }` — touch has no hover highlight, so the press IS the highlight.

#### `SelectItemText`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the item text. |
| `style` | `StyleProp<TextStyle>` | no | — | Item text style, caller-provided (static — the text carries no state). |
| `children` | `ReactNode` | no | — | Item label content (registers as the item's text when the item has no `label`). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `SelectItemIndicator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Indicator style, caller-provided. |
| `children` | `ReactNode` | no | — | Indicator content. Rendered only while the enclosing item is selected. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `SelectGroup`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Group container style, caller-provided (static — the group carries no state). |
| `children` | `ReactNode` | no | — | Group content (`SelectGroupLabel` + `SelectItem` elements). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `SelectGroupLabel`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the label text. |
| `style` | `StyleProp<TextStyle>` | no | — | Group label style, caller-provided (static — the label carries no state). |
| `children` | `ReactNode` | no | — | Group label content. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `SelectSeparator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Separator style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

### Examples

Minimal monolith, uncontrolled (opens on mount with no selection):

```tsx
import { Text } from "react-native";
import { Select, SelectItem, SelectItemIndicator, SelectItemText } from "@xoroh/axis";

function SortPicker() {
  return (
    <Select
      defaultOpen
      placeholder="Sort by"
      accessibilityLabel="Sort by"
      listStyle={{ padding: 8 }}
    >
      <SelectItem value="date" testID="sort-date">
        <SelectItemText>Date</SelectItemText>
        <SelectItemIndicator>
          <Text>✓</Text>
        </SelectItemIndicator>
      </SelectItem>
      <SelectItem value="name">
        <SelectItemText>Name</SelectItemText>
        <SelectItemIndicator>
          <Text>✓</Text>
        </SelectItemIndicator>
      </SelectItem>
    </Select>
  );
}
```

Controlled (parent owns selection and open state):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Select, SelectItem, SelectItemText } from "@xoroh/axis";

function ControlledSort() {
  const [value, setValue] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <Select
      value={value}
      onValueChange={setValue}
      open={open}
      onOpenChange={setOpen}
      placeholder="Sort by"
      accessibilityLabel="Sort by"
    >
      <SelectItem value="date">
        <SelectItemText>Date</SelectItemText>
      </SelectItem>
      <SelectItem value="name">
        <SelectItemText>Name</SelectItemText>
      </SelectItem>
    </Select>
  );
}
```

Compound form (Base UI anatomy — root, trigger, value, portal,
backdrop, positioner, popup, item, text, indicator), with a
closed-list label table so the label (not the raw value) shows
while the list is unmounted:

```tsx
import { Text } from "react-native";
import {
  SelectBackdrop,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@xoroh/axis";

function CompoundSort() {
  return (
    <SelectRoot items={[{ value: "date", label: "Date" }]}>
      <SelectTrigger accessibilityLabel="Sort by">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectPositioner side="bottom" align="start">
          <SelectPopup>
            <SelectItem value="date" testID="sort-date">
              <SelectItemText>Date</SelectItemText>
              <SelectItemIndicator>
                <Text>✓</Text>
              </SelectItemIndicator>
            </SelectItem>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
  );
}
```

### Accessibility

- The trigger is a `Pressable` with the `button` role and
  `expanded` + `disabled` state, so open/closed reaches assistive
  technology.
- The list is an accessibility element (`accessible`) carrying the
  `listbox` role — a role on a non-element `View` would be
  invisible to it.
- Items carry the `option` role with `selected` + `disabled`
  state. Native's `AccessibilityRole` union has no `option` (or
  `listbox`), so the item uses the web `role` prop (the Dialog
  `role="dialog"` precedent) while the list uses
  `accessibilityRole="listbox"` — each checked against the
  installed RN types in-file, not smuggled past the typechecker.
- The dismissable scrim is a `Pressable` labelled "Dismiss"
  (monolith) / "Dismiss select" (compound); scrim press selects
  nothing and closes through `onOpenChange(false)`. The
  non-dismissable compound scrim is a plain `View` with no label
  and no handler — no fake affordance.
- Groups carry the `group` role; arrows and separators render
  `accessible={false}` so they never appear in the tree.
- Closed renders the anchor only (monolith) or nothing at all
  (compound portal): no scrim, no listbox, for assistive tech or
  tests to find.
- Explicitly deferred, each for a named reason: no animation
  (the list mounts/unmounts synchronously with state — exit
  transitions would need the `presence` model to keep it mounted,
  unneeded until a consumer needs animated dismissal); no
  `alignItemWithTrigger` (Base disables it for touch input); no
  scroll arrows (Base hides them on touch); no `multiple`/form
  props; no hardware-keyboard typeahead part (the prefix registry
  exists for adoption — selection moves as keys arrive, none
  yet); no focus trap (containing accessibility focus needs the
  `focusTrap` + `overlayModality` RN adaptation — no DOM tab order
  to borrow).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ value, open,
disabled }`, `{ open, disabled }`, `{ selected, disabled,
highlighted }`, `{ value, placeholder }`, `{ open, side }`),
except `Arrow`/`Group`/`GroupLabel`/`Separator`/`ItemText`/
`ItemIndicator`, whose styles stay static (the `DialogTitle`
precedent — a function of empty state adds nothing); `data-*`
attributes are deliberately absent on native — state flows
through those functions instead (contract §11, parity D1). The
omitted Base UI pieces (`Label`, `Icon`, `List`, scroll arrows,
`alignItemWithTrigger`, `multiple`/form props, `container`) and
the `modal` behavior are recorded in
`docs/BASE_UI_PARITY.md` (§ Select — aligned). Filtering stays
with Combobox (shared `collection` match); compound `Select` is
the single-select counterpart, not a filter box. Verified by the
select RNTL suites (24 tests — `docs/COVERAGE.md`). The compound
anatomy renders in `apps/example/src/demos/list-select.tsx`.
