# `@xoroh/axis`

Design-system-neutral, native-first behavior and interaction primitives
for React Native. Composable state models, hooks, and utilities with no
token reads, no styling, and no web-only APIs.

## Scope and independence

- Axis is an independent, standalone, unstyled React Native library. It
  never depends on Kern, Kern tokens, or any design system, and it is
  usable without Kern.
- Today Axis provides **behavior foundations** (state models, hooks,
  registries, math) and its first rendered component, `Switch` — not
  design-system styling. Further rendered, accessible components
  arrive under the component contract (`docs/COMPONENT_CONTRACT.md`)
  as it is reviewed.
- The public entry (`.`) is the whole contract. Deep imports are
  unsupported. Factory internals and web-only behavior stay private
  even where they exist in source for hooks or tests.

Status: extraction slices 1–2 (`time`, `useControllableState`, selection,
slot, overlay modality, dismissal, portal registry, focus/presence/press/
roving models with native bindings per contract, positioning rect math),
plus native verification (jest + React Native preset: `*.rntest.tsx`
behavior suites proving the public entry in the RN runtime; the shipped
artifact additionally bundles under the Expo 57 host — see the Kern
roadmap for that evidence). `collection` and `mergeRefs` transfer only
through their adoption gates.
See the [Axis repository](https://github.com/xoroh/axis) and
`docs/RELEASING.md` (manual releases only; nothing is published yet).

## Install

```sh
bun add @xoroh/axis react react-native
```

`react >= 18` is a peer dependency. The behavior modules
(`useControllableState`, `normalizeTimeValue`, …) are pure React and
run anywhere React runs. The rendered `Switch` component additionally
requires React Native: `react-native >=0.86 <0.89` is a peer
dependency (D-STACK support policy).

Compatibility evidence, honestly labeled:

- Declared supported: `react-native >=0.86 <0.89`, React 19, Expo 57
  host (peer ranges + D-STACK).
- Exercised by automation: jest + RN preset on `react-native
  0.87.1`; shipped-artifact bundle export on the Expo 57 host
  (React Native 0.86.3). Untested versions inside the range are
  untested — the range is policy, not proof.
- Not performed: emulator, simulator, physical-device, or
  screen-reader validation.

## Usage

```ts
import { useControllableState, normalizeTimeValue } from "@xoroh/axis";
```

Only the documented public entry (`.`) is supported. Deep imports are
not part of the contract.

## Switch

Unstyled on/off control. Structure only — a `Pressable` carrying the
switch role and state, with a track/thumb `View` pair the caller
styles. No default visuals.

### Props

Source of truth: `SwitchProps` in `@xoroh/axis` (re-exported from the
public entry).

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `boolean` | no | — | Controlled state. Wins over `defaultValue` when defined. |
| `defaultValue` | `boolean` | no | `false` | Uncontrolled initial state. |
| `onValueChange` | `(value: boolean) => void` | no | — | Fires with the next state on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: no transitions, no callbacks; announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `accessibilityLabelledBy` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host element. |
| `style` | `StyleProp<ViewStyle>` | no | — | Root pressable style, caller-provided. |
| `trackStyle` | `StyleProp<ViewStyle>` | no | — | Track container style, caller-provided. |
| `thumbStyle` | `StyleProp<ViewStyle>` | no | — | Thumb indicator style, caller-provided. |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root host element (inline documented composition). |

### Controlled example

```tsx
import { useState } from "react";
import { Switch } from "@xoroh/axis";

function Setting() {
  const [enabled, setEnabled] = useState(false);
  return (
    <Switch
      value={enabled}
      onValueChange={setEnabled}
      accessibilityLabel="Airplane mode"
      trackStyle={{ backgroundColor: enabled ? "green" : "gray" }}
    />
  );
}
```

### Uncontrolled example

```tsx
import { Switch } from "@xoroh/axis";

function Setting() {
  return (
    <Switch
      defaultValue
      onValueChange={(v) => console.log("now", v)}
      accessibilityLabel="Airplane mode"
    />
  );
}
```

Accessibility: `accessibilityRole="switch"` with
`accessibilityState { checked, disabled }`. Name the control with
`accessibilityLabel` (or `accessibilityLabelledBy` where supported).

## Checkbox

Unstyled binary selection control. A `Pressable` carrying the
checkbox role and state, with a box/checkmark `View` pair the caller
styles. The checkmark renders only when checked.

### Props

Source of truth: `CheckboxProps` in `@xoroh/axis`.

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `checked` | `boolean` | no | — | Controlled state. Wins over `defaultChecked` when defined. |
| `defaultChecked` | `boolean` | no | `false` | Uncontrolled initial state. |
| `onCheckedChange` | `(checked: boolean) => void` | no | — | Fires with the next state on every committed toggle. |
| `disabled` | `boolean` | no | `false` | Terminal: no transitions, no callbacks; announced as disabled. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `accessibilityLabelledBy` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier; checkmark is `${testID}-checkmark` when set. |
| `style` | `StyleProp<ViewStyle>` | no | — | Root pressable style, caller-provided. |
| `boxStyle` | `StyleProp<ViewStyle>` | no | — | Box container style, caller-provided. |
| `checkmarkStyle` | `StyleProp<ViewStyle>` | no | — | Check indicator style, caller-provided. |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root host element. |

### Controlled example

```tsx
import { useState } from "react";
import { Checkbox } from "@xoroh/axis";

function Consent() {
  const [accepted, setAccepted] = useState(false);
  return (
    <Checkbox
      checked={accepted}
      onCheckedChange={setAccepted}
      accessibilityLabel="Accept the terms"
      boxStyle={{ borderWidth: accepted ? 0 : 1 }}
    />
  );
}
```

### Uncontrolled example

```tsx
import { Checkbox } from "@xoroh/axis";

function Consent() {
  return (
    <Checkbox
      defaultChecked
      onCheckedChange={(v) => console.log("accepted", v)}
      accessibilityLabel="Accept the terms"
    />
  );
}
```

## RadioGroup

Source of truth: `RadioGroupProps`, `RadioGroupItemProps` in `@xoroh/axis`.

Unstyled single-selection group. A `View` carrying the radiogroup
role with `RadioGroupItem` pressables (radio role + checked state).
Selecting an item replaces the selection; re-activating the selected
item keeps it (never deselects to null).

### Props

`RadioGroupProps`: `value?: string | null`, `defaultValue?: string
| null` (default `null`), `onValueChange?: (value: string) => void`,
`disabled?: boolean` (disables every item), `accessibilityLabel?:
string`, `testID?: string`, `style?: StyleProp<ViewStyle>`,
`children: ReactNode` (the items, required), `ref` (group root).

`RadioGroupItemProps`: `value: string` (required),
`disabled?: boolean`, `accessibilityLabel?: string`,
`testID?: string`, `style?: StyleProp<ViewStyle>`,
`children?: ReactNode`. All props optional except `value`.

### Example

```tsx
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@xoroh/axis";

function SizePicker() {
  const [size, setSize] = useState<string | null>(null);
  return (
    <RadioGroup
      value={size}
      onValueChange={setSize}
      accessibilityLabel="Size"
    >
      <RadioGroupItem value="s" accessibilityLabel="Small" />
      <RadioGroupItem value="m" accessibilityLabel="Medium" />
    </RadioGroup>
  );
}
```

## Toggle

Source of truth: `ToggleProps` in `@xoroh/axis`.

Unstyled pressed-state button (not a switch): a `Pressable` with the
button role and selected state, rendering caller label content.

### Props

`pressed?: boolean`, `defaultPressed?: boolean` (default `false`),
`onPressedChange?: (pressed: boolean) => void`,
`disabled?: boolean` (terminal), `accessibilityLabel?: string`,
`accessibilityLabelledBy?: string`, `testID?: string`,
`style?: StyleProp<ViewStyle>`, `children?: ReactNode`,
`ref` (root host element). All optional.

### Example

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Toggle } from "@xoroh/axis";

function Bold() {
  const [on, setOn] = useState(false);
  return (
    <Toggle pressed={on} onPressedChange={setOn} accessibilityLabel="Bold">
      <Text>B</Text>
    </Toggle>
  );
}
```

## Button

Source of truth: `ButtonProps` in `@xoroh/axis`.

Unstyled pressable action. Caller content, caller visuals.

### Props

`onPress?: () => void` (suppressed while `disabled` or `loading`),
`disabled?: boolean`, `loading?: boolean` (suppresses `onPress`,
announced as busy; caller swaps `children` — nothing renders here),
`accessibilityLabel?: string`,
`accessibilityLabelledBy?: string`, `testID?: string`,
`style?: StyleProp<ViewStyle>`, `children?: ReactNode`, `ref`.
All optional.

### Example

```tsx
import { Text } from "react-native";
import { Button } from "@xoroh/axis";

function Save({ onSave }: { onSave: () => void }) {
  return (
    <Button onPress={onSave} accessibilityLabel="Save">
      <Text>Save</Text>
    </Button>
  );
}
```

## Label

Source of truth: `LabelProps` in `@xoroh/axis`.

Unstyled text label. Associates with a control via `nativeID`
(mirrored on the control's `accessibilityLabelledBy`); focus behavior
belongs to the control. No invented role — read as text.

Props: `children?: ReactNode`, `nativeID?: string`,
`testID?: string`, `style?: StyleProp<TextStyle>`. All optional.

## Separator

Source of truth: `SeparatorProps` in `@xoroh/axis`.

Unstyled divider. A silent `View` (`accessible={false}` — React
Native defines no separator role, and an unbacked claim is worse than
silence). Direction is a styling decision in `style`; no orientation
prop it cannot honor.

Props: `testID?: string`, `style?: StyleProp<ViewStyle>`. All optional.

## CheckboxGroup

Source of truth: `CheckboxGroupProps`, `CheckboxGroupItemProps` in `@xoroh/axis`.

Unstyled multi-selection group. Items toggle membership in a shared
value array; re-activating a selected item removes it.

`CheckboxGroupProps`: `value?: readonly string[]`,
`defaultValue?: readonly string[]`,
`onValueChange?: (value: readonly string[]) => void`,
`disabled?: boolean` (disables every item), `accessibilityLabel?:
string`, `testID?: string`, `style?: StyleProp<ViewStyle>`,
`children: ReactNode` (required), `ref` (group root).

`CheckboxGroupItemProps`: `value: string` (required),
`disabled?: boolean`, `accessibilityLabel?: string`,
`testID?: string`, `style?: StyleProp<ViewStyle>`,
`children?: ReactNode`. Items render role `checkbox` with checked
state. All props optional except item `value`.

## Tabs

Source of truth: `TabsProps`, `TabsListProps`, `TabsPanelProps`, `TabsTriggerProps` in `@xoroh/axis`.

Unstyled tabbed interface: `Tabs` (value/defaultValue/onValueChange,
`children` required, ref to root), `TabsList` (role `tablist`),
`TabsTrigger` (`value` required; role `tab` with selected state; no
deselect), `TabsPanel` (`value` required; rendered only when
selected). Orientation and keyboard roving are explicitly deferred —
native press selection suffices for v1.

## Accordion

Source of truth: `AccordionProps`, `AccordionItemProps` in `@xoroh/axis`.

Unstyled single-expand disclosure (multi-mode deferred):
`Accordion` (`value`/`defaultValue`/`onValueChange` over `string |
null`, re-activating the open item collapses to `null`,
`disabled` blocks all) + `AccordionItem` (`value` required;
trigger `Pressable` with expanded state; panel mounted only when
open; `header` content with an empty-accessible-trigger fallback).
No animation — presence wiring deferred with rationale in-file.

## Progress

Source of truth: `ProgressProps` in `@xoroh/axis`.

Determinate/indeterminate indicator: `value` (default 0), `min`
(default 0), `max` (default 100), `indeterminate` (announces busy,
no value), role `progressbar` with `{min, max, now}` value,
`accessibilityLabel`. Values clamp; fill width is data-driven under
caller `barStyle`. Example: `<Progress value={42}
accessibilityLabel="Loading" />`.

## Badge

Source of truth: `BadgeProps` in `@xoroh/axis`.

Count/dot adornment: caller `children` in a container `View` with
`accessibilityLabel` (e.g. "3 unread"), `style`, `textStyle`. Read
as plain content; no invented role.

## Avatar

Source of truth: `AvatarProps` in `@xoroh/axis`.

Identity image with fallback: `source` renders an `Image` with the
image role and label; absence or load error renders caller
`children` in a fallback `View`. Props: `source?:
ImageSourcePropType`, `children?`, `accessibilityLabel?`,
`testID?`, `style?` (image), `fallbackStyle?`.

## Dialog

Source of truth: `DialogProps` in `@xoroh/axis`.

Unstyled modal dialog. Renders `null` when closed; when open, a
transparent RN `Modal` with a scrim `Pressable` and a surface `View`
carrying the dialog role. Scrim press and `onRequestClose` dismiss
(iff `dismissable`, default `true` — set `false` for the AlertDialog
pattern with explicit actions). Hardware-back beyond
`onRequestClose`, animations, and focus trap are explicitly deferred
with rationale in-file.

`DialogProps`: `open?: boolean`, `defaultOpen?: boolean`,
`onOpenChange?: (open: boolean) => void`,
`onDismiss?: () => void`, `dismissable?: boolean` (default `true`),
`title?: ReactNode`, `children?: ReactNode` (content),
`actions?: ReactNode`, `accessibilityLabel?: string`,
`testID?: string` (scrim is `${testID}-scrim`),
`overlayStyle?`, `surfaceStyle?`, `titleStyle?` (all
caller-provided), `ref` (surface host). All optional.

## Toast

Source of truth: `ToastProps` in `@xoroh/axis`.

Transient notification with timed auto-dismiss. Renders `null` when
closed; open content announces via a polite live region.
`ToastProps`: `open?`, `defaultOpen?`,
`onOpenChange?`, `duration?: number` (ms, default 4000; `<= 0`
disables the timer), `children?` (message),
`actionLabel?: string` + `onAction?: () => void` (button rendered
only with a label; fires then dismisses), `accessibilityLabel?`,
`testID?`, `style?`. No ref, no animation. All optional.

## Input

Source of truth: `InputProps` in `@xoroh/axis`.

Single-line text entry: `value?`, `defaultValue?` (default `""`),
`onChangeText?: (text: string) => void`, `placeholder?`,
`secureTextEntry?` (default `false`), `editable?` (default `true`,
`false` is read-only), `accessibilityLabel?`, `testID?`,
`style?: StyleProp<TextStyle>`, `ref` (host input). Payloads stay
primitive strings. All optional.

## Field

Source of truth: `FieldProps` in `@xoroh/axis`.

Label/control/error row: `label?`, `children?` (control),
`error?` (rendered only when provided, announced politely),
`testID?`, `style?`, `labelStyle?`, `errorStyle?`. No validation
logic — validity is caller state expressed by passing `error`.

## Collapsible

Source of truth: `CollapsibleProps`, `CollapsibleTriggerProps`, `CollapsiblePanelProps` in `@xoroh/axis`.

Single disclosure unit: `Collapsible` (`open`/`defaultOpen`/
`onOpenChange`, `disabled`, `testID?`, `style?`, `children`,
`ref` to root) + `CollapsibleTrigger` (Pressable with expanded
state) + `CollapsiblePanel` (mounted only when open). No animation
(deferred with rationale in-file). All props optional except
`children` where noted.

## OtpField

Source of truth: `OtpFieldProps` in `@xoroh/axis`.

Segmented code entry with auto-advance: one hidden host `TextInput`
(`keyboardType` number-pad) plus digit cells. `value?`,
`defaultValue?`, `onValueChange?`, `length?: number` (default 6,
clamped to ≥1), `disabled?` (read-only), `secureTextEntry?`,
`autoSubmit?` (default `false`; with `onComplete?` fires exactly once
per completion, re-arming after the value drops below full length),
`accessibilityLabel?`, `testID?` (cells are `${testID}-cell-{i}`),
`style?`, `cellStyle?`, `textStyle?`, `ref` (container). All optional.

## NumberField

Source of truth: `NumberFieldProps` in `@xoroh/axis`.

Numeric entry with steppers, composed from Axis `Input` + `Button`
(no reimplemented text entry or press handling): `value?: number |
null` (`null` = empty), `defaultValue?`, `onValueChange?`,
`min?`, `max?`, `step?: number` (default 1, clamped to >0),
`disabled?` (disables input + steppers),
`accessibilityLabel?`, `testID?`, `style?`, `inputStyle?`,
`buttonStyle?` (both steppers), `ref` (container). Invalid text
parses to `null`; stepping clamps into `[min, max]`. All optional.

## Textarea

Source of truth: `TextareaProps` in `@xoroh/axis`.

Multiline entry: `value?`, `defaultValue?` (default `""`),
`onChangeText?`, `placeholder?`, `editable?` (default `true`),
`numberOfLines?` (default 3), `autoGrow?` (measured height merged
under caller style, no animation), `accessibilityLabel?`,
`testID?`, `style?`, `ref`. All optional.

## Fieldset

Source of truth: `FieldsetProps` in `@xoroh/axis`.

Group of related fields with a legend: `legend?`, `children?`,
`testID?`, `style?`, `legendStyle?`. No invented group role; legend
read as text. No validation logic — validity is caller state.

## Tooltip

Source of truth: `TooltipProps` in `@xoroh/axis`.

Anchored hint on long-press: `content` (required), `children`
(anchor, required), `open?`, `defaultOpen?` (default `false`),
`onOpenChange?`, `placement?` (default `"top"`, clamped into the
viewport), `accessibilityLabel?`, `testID?`, `style?` (anchor),
`tipStyle?`, `ref` (anchor wrapper). The tip carries the tooltip
role; it is measured and placed with the shared floating-placement
plumbing (anchor `measure()` + viewport + rect math) and stays
transparent until measured. Pixel placement needs the native
runtime — covered by placement-math unit tests, not asserted in
jsdom-free RNTL. No hover model, no scrim. All props optional
except `content`/`children`.

## Slider

Source of truth: `SliderProps` in `@xoroh/axis`.

Drag value control (PanResponder, no Reanimated/Gesture Handler):
`value?`, `defaultValue?` (default `min`), `onValueChange?`,
`min?` (default 0), `max?` (default 100), `step?: number`
(default 0 = continuous, >0 snaps), `disabled?`,
`accessibilityLabel?`, `testID?`, `style?`, `trackStyle?`,
`fillStyle?`, `thumbStyle?`, `ref` (track). Role `slider` with
`{min, max, now}` value plus `increment`/`decrement` actions.
Degenerate `min > max` collapses safely. All optional.

## Calendar

Source of truth: `CalendarProps` in `@xoroh/axis`.

Date grid (plain UTC `Date` math, no date library; Sunday-start
weeks): `value?: string | null` (ISO `yyyy-mm-dd`),
`defaultValue?`, `onValueChange?`, `month?: string` (`yyyy-mm`,
controlled visible month), `onMonthChange?`, `minDate?`,
`maxDate?` (out-of-range days disabled), `disabled?`,
`accessibilityLabel?`, `testID?`, `style?`, `dayStyle?`, `ref`.
Day cells carry button role + selected/disabled state; header has
previous/next-month actions. Invalid strings never throw. All
optional.

## TimePicker

Source of truth: `TimePickerProps` in `@xoroh/axis`.

Time entry composed from Axis `Input` + `Button`, reusing the
`time` math (`normalizeTimeValue`, step grid, formatting):
`value?: {hours, minutes} | null`, `defaultValue?`,
`onValueChange?`, `step?: number` (minutes, default 1),
`disabled?`, `accessibilityLabel?`, `testID?`, `style?`, `ref`.
Steppers walk the step grid and clamp at its ends. All optional.

## Search

Source of truth: `SearchProps` in `@xoroh/axis`.

Search entry composing Axis `Input` with a clear button (rendered
only while the query is non-empty): `value?`, `defaultValue?`
(default `""`), `onValueChange?`, `onSubmit?` (return key),
`placeholder?`, `accessibilityLabel?`, `testID?`, `style?`
(container), `inputStyle?`,
`clearAccessibilityLabel?` (default `"Clear search"`), `ref`
(container). Filtering belongs to the caller. All optional.

## Pagination

Source of truth: `PaginationProps` in `@xoroh/axis`.

Bounded page navigator: `page?`, `defaultPage?` (default 1),
`pageCount?` (below 1 collapses to one page),
`onPageChange?`, `disabled?`, `accessibilityLabel?`, `testID?`,
`style?`, `children?` (page indicator, e.g. "3 of 12"),
`previousLabel?`/`nextLabel?` (default "Previous/Next page"),
`ref` (container). At bounds the corresponding control disables
itself. Page arithmetic beyond clamp belongs to the caller. All
optional.

## Select

Source of truth: `SelectProps`, `SelectItemProps` in `@xoroh/axis`.

Single-select dropdown: `value?: string | null`,
`defaultValue?`, `onValueChange?`, `open?`, `defaultOpen?`,
`onOpenChange?`, `placeholder?` (ReactNode, shown when empty),
`disabled?`, `accessibilityLabel?`, `testID?`, `style?` (trigger),
`listStyle?`, `children` (SelectItems, required), `ref`.
Trigger shows current label or placeholder with expanded state;
list positioned with floating placement + scrim dismiss; option
press selects + closes (re-press keeps, no extra fire). No
filtering (that's Combobox), no multi. All optional except
`children`.

`SelectItemProps`: `value: string` (required), `disabled?`,
`accessibilityLabel?`, `testID?`, `style?`, `children?`; role
`option` with selected state where supported, else button with
selected state (verified per platform types, documented in-file).

## Popover

Source of truth: `PopoverProps` in `@xoroh/axis`.

Non-modal anchored overlay: `children` (anchor, required),
`content` (body, required), `open?`, `defaultOpen?`,
`onOpenChange?`, `onDismiss?`, `placement?`,
`accessibilityLabel?` (announced on the region),
`testID?`, `style?` (anchor), `popoverStyle?`, `ref` (anchor).
Tap toggles; scrim dismisses (siblings, so box taps never dismiss);
measured placement, transparent until measured. No role claim —
React Native defines no popover role. No animation, arrow, hover,
or focus trap (each deferred with rationale in-file). All optional
except `children`/`content`.

## Menu

Source of truth: `MenuProps`, `MenuItemProps`, `MenuTriggerProps` in `@xoroh/axis`.

Popup menu: `Menu` (`open?`, `defaultOpen?`, `onOpenChange?`,
`onDismiss?`, `testID?`, `style?`, `children`, `ref`) +
`MenuTrigger` (Pressable toggling open) + `MenuItem` (`value`
required, `disabled?`, `onSelect?` fires then closes). Bare-element
children in the trigger zone get toggle composed; scrim fills the
menu container (no Modal/portal host — taps inside never dismiss).
No submenus, animation, or hover/keyboard nav (each deferred
with rationale in-file). All props optional except item `value`.

## Combobox

Source of truth: `ComboboxProps` in `@xoroh/axis`.

Filterable single-select: `options: ReadonlyArray<{value, label,
disabled?}>` (required), `value?: string | null`,
`defaultValue?`, `onValueChange?`, `open?`, `defaultOpen?`,
`onOpenChange?`, `placeholder?`, `disabled?`,
`accessibilityLabel?`, `testID?` (entry; toggle is
`${testID}-toggle`, scrim `${testID}-scrim`, options
`${testID}-option-{value}`), `style?` (entry), `listStyle?`,
`inputStyle?`, `ref` (root). Entry is an Axis `Input`; a chevron
toggle opens the list (the Axis Input exposes no focus API by
design) and typing filters case-insensitively, auto-opening.
Option press selects + sets query + closes. Empty filter renders
an empty listbox, no chrome. All optional except `options`.

## Autocomplete

Source of truth: `AutocompleteProps` in `@xoroh/axis`.

Filter-as-type where the text IS the value: `options:
ReadonlyArray<string>` (required), `value?`, `defaultValue?`,
`onValueChange?` (text), `onCommit?` (option press or submit),
`open?`, `defaultOpen?`, `onOpenChange?`, `placeholder?`,
`disabled?`, `accessibilityLabel?`, `testID?`, `style?`,
`listStyle?`, `inputStyle?`, `ref`. Options are commit actions
(button role), not a selection set — no selected state is promised.
Empty query closes the list. All optional except `options`.

## ContextMenu

Source of truth: `ContextMenuProps` in `@xoroh/axis`.

Long-press popup menu: `children` (anchor, required), `content`
(menu body, required), `open?`, `defaultOpen?`, `onOpenChange?`,
`onDismiss?`, `placement?` (default `"bottom"`, clamped),
`accessibilityLabel?` (menu region), `testID?` (scrim is
`${testID}-scrim`), `style?` (anchor), `menuStyle?`, `ref`
(anchor). Long-press toggles; scrim dismisses through `onDismiss` +
`onOpenChange(false)`. Positions below the anchor — press-point
positioning deferred, not faked. All optional except
`children`/`content`.

## Meter

Source of truth: `MeterProps` in `@xoroh/axis`.

Gauge readout (task progress lives in `Progress`): `value?`
(default 0), `min?` (default 0), `max?` (default 100),
`accessibilityLabel?`, `testID?`, `style?`, `fillStyle?`
(data-driven width merged underneath). Meter role with
`{min, max, now}` value. All optional.

## Loader

Source of truth: `LoaderProps` in `@xoroh/axis`.

Busy indicator: host `ActivityIndicator` with announced busy
state. `size?: number | "small" | "large"`, `color?: string`,
`accessibilityLabel?`, `testID?`, `style?`. All optional.

## Skeleton

Source of truth: `SkeletonProps` in `@xoroh/axis`.

Loading placeholder: silent (`accessible={false}`), no motion.
`testID?`, `style?` (dimensions live here). All optional.

## EmptyState

Source of truth: `EmptyStateProps` in `@xoroh/axis`.

Nothing-here frame: `title?`, `description?`, `action?` (caller
slot), `accessibilityLabel?`, `testID?`, `style?`,
`titleStyle?`, `descriptionStyle?`. No iconography, no copy. All
optional.

## Card

Source of truth: `CardProps` in `@xoroh/axis`.

Content container with `header?`, `media?`, `children?`,
`actions?` slots (each rendered only when provided),
`accessibilityLabel?`, `testID?`, `style?`, `headerStyle?`,
`mediaStyle?`, `actionsStyle?`. No elevation, shape, or padding.
All optional.

## ListItem

Source of truth: `ListItemProps` in `@xoroh/axis`.

Row with `leading?`/`children`/`trailing?` slots. With `onPress`
it is a pressable row (button role, selected/disabled state);
without, a static `View` (no fake affordance).
`onPress?`, `selected?` (default `false`), `disabled?` (default
`false`), `accessibilityLabel?`, `testID?`, `style?`,
`contentStyle?` (string-children text). All optional.

## Kbd

Source of truth: `KbdProps` in `@xoroh/axis`.

Key-hint display: `children?`, `testID?`, `style?`. Inline
semantics only — no keyboard handling. All optional.

## Table

Source of truth: `TableProps`, `TableHeaderProps`, `TableRowProps`, `TableCellProps` in `@xoroh/axis`.

Tabular structure: `Table` (container + `ref`) with `TableHeader`,
`TableRow` (`header?` maps to the header role), and `TableCell`
parts. Plain `View`s — no table/row/cell roles exist in the native
role set, so none are claimed. No sorting, pagination, or selection.
`testID?`/`style?` throughout. All optional.

## Carousel

Source of truth: `CarouselProps` in `@xoroh/axis`.

Paged content: `index?`, `defaultIndex?` (default 0),
`onIndexChange?`, `loop?` (default `false`, wraps at ends),
`testID?`, `style?`, `children` (pages, required), `ref`. Only the
active page mounts; Previous/Next controls clamp (or loop) at
bounds. No swipe — gesture paging deferred. All optional except
`children`.

## Toolbar

Source of truth: `ToolbarProps` in `@xoroh/axis`.

Control group container: `orientation?: "horizontal" | "vertical"`
(default `"horizontal"`, applied as structural flex direction),
`disabled?`, `accessibilityLabel?` (toolbar role asserted via
props — containers are not accessibility elements, so role queries
do not match; documented), `testID?`, `style?`, `children`
(required), `ref`. No roving keyboard (transfer-gated model).
All optional except `children`.

## Chip

Source of truth: `ChipProps` in `@xoroh/axis`.

Compact select/remove control: outer `View` with sibling main and
remove `Pressable`s. `selected?`, `defaultSelected?`,
`onSelectedChange?`, `onPress?` (tap action, fires after the
internal toggle), `onRemove?` (remove path only, never toggles),
`disabled?` (blocks all three), `accessibilityLabel?`, `testID?`,
`style?`, `removeStyle?`, `children?`, `ref`. Main carries button
role + selected state. All optional.

## LinkButton

Source of truth: `LinkButtonProps` in `@xoroh/axis`.

`Button` with the link role. Same props as `Button`
(`onPress?`, `disabled?`, `accessibilityLabel?`,
`accessibilityLabelledBy?`, `testID?`, `style?`,
`children?`, `ref`). All optional.

## LoadingButton

Source of truth: `LoadingButtonProps` in `@xoroh/axis`.

`Button` forced into loading: `loading?: boolean` (default
`true`) announces busy and suppresses press; all other `Button`
props pass through. Content swap is the caller's. All optional.

## SplitButton

Source of truth: `SplitButtonProps` in `@xoroh/axis`.

Primary action + secondary trigger side by side: `onPress?`,
`onSecondaryPress?`, `disabled?` (shared),
`secondaryLabel?` (default `"More actions"`),
`accessibilityLabel?`, `testID?`, `style?`, `secondaryStyle?`,
`children?` (primary label), `ref`. Two independent press paths.
All optional.

## ButtonGroup

Source of truth: `ButtonGroupProps` in `@xoroh/axis`.

Honest layout container for buttons: `testID?`, `style?`,
`children?` (required), `ref`. Role `group`. No behavior theft —
member buttons keep their own props. All optional except
`children`.

## Table

Source of truth: `TableProps`, `TableHeaderProps`, `TableRowProps`, `TableCellProps` in `@xoroh/axis`.

Tabular structure: `Table` (container + `ref`), `TableHeader`,
`TableRow` (`header?` maps to the header role), `TableCell`. Plain
`View`s — the native role set has no table/row/cell values, so none
are claimed. No sorting, pagination, or selection. `testID?`/`style?`
throughout. All optional.

## Carousel

Source of truth: `CarouselProps` in `@xoroh/axis`.

Paged content: `index?`, `defaultIndex?` (default 0),
`onIndexChange?`, `loop?` (default `false`, wraps at ends),
`testID?`, `style?`, `children` (pages, required), `ref`. Only the
active page mounts; Previous/Next controls clamp (or loop) at
bounds. No swipe — gesture paging deferred. All optional except
`children`.

## Toolbar

Source of truth: `ToolbarProps` in `@xoroh/axis`.

Control group container: `orientation?: "horizontal" | "vertical"`
(default `"horizontal"`, applied as structural flex direction),
`disabled?`, `accessibilityLabel?` (toolbar role asserted via
props — containers are not accessibility elements, so role queries
do not match; documented), `testID?`, `style?`, `children`
(required), `ref`. No roving keyboard (transfer-gated model).
All optional except `children`.

## Chip

Source of truth: `ChipProps` in `@xoroh/axis`.

Compact select/remove control: outer `View` with sibling main and
remove `Pressable`s. `selected?`, `defaultSelected?`,
`onSelectedChange?`, `onPress?` (tap action, fires after the
internal toggle), `onRemove?` (remove path only, never toggles),
`disabled?` (blocks all three), `accessibilityLabel?`, `testID?`,
`style?`, `removeStyle?`, `children?`, `ref`. Main carries button
role + selected state. All optional.

## LinkButton

Source of truth: `LinkButtonProps` in `@xoroh/axis`.

`Button` with the link role. Same props as `Button`
(`onPress?`, `disabled?`, `accessibilityLabel?`,
`accessibilityLabelledBy?`, `testID?`, `style?`,
`children?`, `ref`). All optional.

## LoadingButton

Source of truth: `LoadingButtonProps` in `@xoroh/axis`.

`Button` forced into loading: `loading?: boolean` (default
`true`) announces busy and suppresses press; all other `Button`
props pass through. Content swap is the caller's. All optional.

## SplitButton

Source of truth: `SplitButtonProps` in `@xoroh/axis`.

Primary action + secondary trigger side by side: `onPress?`,
`onSecondaryPress?`, `disabled?` (shared),
`secondaryLabel?` (default `"More actions"`),
`accessibilityLabel?`, `testID?` (secondary is
`${testID}-secondary`), `style?` (primary), `secondaryStyle?`,
`children?` (primary label), `ref` (container). Two independent
press paths. All optional.

## Meter

Source of truth: `MeterProps` in `@xoroh/axis`.

Gauge readout (task progress lives in `Progress`): `value?`
(default 0), `min?` (default 0), `max?` (default 100),
`accessibilityLabel?`, `testID?`, `style?`, `fillStyle?`
(data-driven width merged underneath). Meter role with
`{min, max, now}` value. All optional.

## Loader

Source of truth: `LoaderProps` in `@xoroh/axis`.

Busy indicator: host `ActivityIndicator` with announced busy
state. `size?: number | "small" | "large"`, `color?: string`,
`accessibilityLabel?`, `testID?`, `style?`. All optional.

## Skeleton

Source of truth: `SkeletonProps` in `@xoroh/axis`.

Loading placeholder: silent (`accessible={false}`), no motion.
`testID?`, `style?` (dimensions live here). All optional.

## EmptyState

Source of truth: `EmptyStateProps` in `@xoroh/axis`.

Nothing-here frame: `title?`, `description?`, `action?` (caller
slot), `accessibilityLabel?`, `testID?`, `style?`,
`titleStyle?`, `descriptionStyle?`. No iconography, no copy. All
optional.

## Card

Source of truth: `CardProps` in `@xoroh/axis`.

Content container with `header?`, `media?`, `children?`,
`actions?` slots (each rendered only when provided),
`accessibilityLabel?`, `testID?`, `style?`, `headerStyle?`,
`mediaStyle?`, `actionsStyle?`. No elevation, shape, or padding.
All optional.

## ListItem

Source of truth: `ListItemProps` in `@xoroh/axis`.

Row with `leading?`/`children`/`trailing?` slots. With `onPress`
it is a pressable row (button role, selected/disabled state);
without, a static `View` (no fake affordance).
`onPress?`, `selected?` (default `false`), `disabled?` (default
`false`), `accessibilityLabel?`, `testID?`, `style?`,
`contentStyle?` (string-children text). All optional.

## Kbd

Source of truth: `KbdProps` in `@xoroh/axis`.

Key-hint display: `children?`, `testID?`, `style?`. Inline
semantics only — no keyboard handling. All optional.

## Toggle Group

Source of truth: `ToggleGroupProps`, `ToggleGroupItemProps` in `@xoroh/axis`.

Pressed-state set (CheckboxGroup with pressed semantics):
`ToggleGroup` (`value?: readonly string[]`, `defaultValue?`,
`onValueChange?`, `disabled?`, `accessibilityLabel?`, `testID?`,
`style?`, `children` required, `ref`) + `ToggleGroupItem`
(`value` required, `disabled?`, `accessibilityLabel?`, `testID?`,
`style?`, `children?`; button role + selected state). Toggle adds,
re-press removes. All optional except listed required.

## Icon Button

Source of truth: `IconButtonProps` in `@xoroh/axis`.

Icon-only pressable: like `Button` but **an `accessibilityLabel`
is required in practice** — without one the control is nameless.
`onPress?`, `disabled?`, `loading?`, `accessibilityLabel?`,
`accessibilityLabelledBy?`, `testID?`, `style?`, `children?`,
`ref`. All optional.

## Aspect Ratio

Source of truth: `AspectRatioProps` in `@xoroh/axis`.

Ratio box: `ratio?: number` (default 1; non-finite and non-positive
clamp to 1, never throw), `testID?`, `style?`, `children?`,
`ref`. Merges `{aspectRatio}` under caller style. All optional.

## AlertDialog

Source of truth: `AlertDialogProps` in `@xoroh/axis`.

Blocking confirm: thin wrapper forcing `dismissable={false}` over
`Dialog`. `open?`, `defaultOpen?`, `onOpenChange?`, `title?`,
`children?`, `actions` (required — a blocking dialog without an
explicit action traps the user), `accessibilityLabel?`,
`testID?`, `style?` (surface), `ref` (surface). No `onDismiss`
(no scrim path exists). All optional except `actions`.

## Text

Source of truth: `TextProps` in `@xoroh/axis`.

Readable text host: caller `children`, `accessibilityLabel?`,
`accessibilityRole?` (passthrough, e.g. `"header"` — no default
claim), `numberOfLines?`, `ellipsizeMode?`, `selectable?`,
`testID?`, `style?`, `ref`. Carries deliberately no typographic
scale: size, weight, and color are design-system decisions in
caller `style`. Example: `<Text
accessibilityLabel="Airplane mode, on">On</Text>`.

## Settings Row

Source of truth: `SettingsRowProps` in `@xoroh/axis`.

Labeled row with a trailing control slot: `title` (required),
`description?`, `control?` (caller-owned Switch, value, chevron),
`onPress?` (detail navigation — absence renders a static row whose
control stays independently operable), `selected?`, `disabled?`,
`accessibilityLabel?` (defaults to the title when pressable),
`testID?`, `style?`, `titleStyle?`, `descriptionStyle?`, `ref`.
Pressable rows carry the button role with selected/disabled
states. Example: `<SettingsRow title="Wi-Fi"
description="Home network" onPress={openWifi} />`.
