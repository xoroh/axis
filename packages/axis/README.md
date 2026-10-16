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

Unstyled text label. Associates with a control via `nativeID`
(mirrored on the control's `accessibilityLabelledBy`); focus behavior
belongs to the control. No invented role — read as text.

Props: `children?: ReactNode`, `nativeID?: string`,
`testID?: string`, `style?: StyleProp<TextStyle>`. All optional.

## Separator

Unstyled divider. A silent `View` (`accessible={false}` — React
Native defines no separator role, and an unbacked claim is worse than
silence). Direction is a styling decision in `style`; no orientation
prop it cannot honor.

Props: `testID?: string`, `style?: StyleProp<ViewStyle>`. All optional.

## CheckboxGroup

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

Unstyled tabbed interface: `Tabs` (value/defaultValue/onValueChange,
`children` required, ref to root), `TabsList` (role `tablist`),
`TabsTrigger` (`value` required; role `tab` with selected state; no
deselect), `TabsPanel` (`value` required; rendered only when
selected). Orientation and keyboard roving are explicitly deferred —
native press selection suffices for v1.

## Accordion

Unstyled single-expand disclosure (multi-mode deferred):
`Accordion` (`value`/`defaultValue`/`onValueChange` over `string |
null`, re-activating the open item collapses to `null`,
`disabled` blocks all) + `AccordionItem` (`value` required;
trigger `Pressable` with expanded state; panel mounted only when
open; `header` content with an empty-accessible-trigger fallback).
No animation — presence wiring deferred with rationale in-file.

## Progress

Determinate/indeterminate indicator: `value` (default 0), `min`
(default 0), `max` (default 100), `indeterminate` (announces busy,
no value), role `progressbar` with `{min, max, now}` value,
`accessibilityLabel`. Values clamp; fill width is data-driven under
caller `barStyle`. Example: `<Progress value={42}
accessibilityLabel="Loading" />`.

## Badge

Count/dot adornment: caller `children` in a container `View` with
`accessibilityLabel` (e.g. "3 unread"), `style`, `textStyle`. Read
as plain content; no invented role.

## Avatar

Identity image with fallback: `source` renders an `Image` with the
image role and label; absence or load error renders caller
`children` in a fallback `View`. Props: `source?:
ImageSourcePropType`, `children?`, `accessibilityLabel?`,
`testID?`, `style?` (image), `fallbackStyle?`.

## Dialog

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

Transient notification with timed auto-dismiss. Renders `null` when
closed; open content announces via a polite live region.
`ToastProps`: `open?`, `defaultOpen?`,
`onOpenChange?`, `duration?: number` (ms, default 4000; `<= 0`
disables the timer), `children?` (message),
`actionLabel?: string` + `onAction?: () => void` (button rendered
only with a label; fires then dismisses), `accessibilityLabel?`,
`testID?`, `style?`. No ref, no animation. All optional.

## Input

Single-line text entry: `value?`, `defaultValue?` (default `""`),
`onChangeText?: (text: string) => void`, `placeholder?`,
`secureTextEntry?` (default `false`), `editable?` (default `true`,
`false` is read-only), `accessibilityLabel?`, `testID?`,
`style?: StyleProp<TextStyle>`, `ref` (host input). Payloads stay
primitive strings. All optional.

## Field

Label/control/error row: `label?`, `children?` (control),
`error?` (rendered only when provided, announced politely),
`testID?`, `style?`, `labelStyle?`, `errorStyle?`. No validation
logic — validity is caller state expressed by passing `error`.

## Collapsible

Single disclosure unit: `Collapsible` (`open`/`defaultOpen`/
`onOpenChange`, `disabled`, `testID?`, `style?`, `children`,
`ref` to root) + `CollapsibleTrigger` (Pressable with expanded
state) + `CollapsiblePanel` (mounted only when open). No animation
(deferred with rationale in-file). All props optional except
`children` where noted.

## OtpField

Segmented code entry with auto-advance: one hidden host `TextInput`
(`keyboardType` number-pad) plus digit cells. `value?`,
`defaultValue?`, `onValueChange?`, `length?: number` (default 6,
clamped to ≥1), `disabled?` (read-only), `secureTextEntry?`,
`autoSubmit?` (default `false`; with `onComplete?` fires exactly once
per completion, re-arming after the value drops below full length),
`accessibilityLabel?`, `testID?` (cells are `${testID}-cell-{i}`),
`style?`, `cellStyle?`, `textStyle?`, `ref` (container). All optional.

## NumberField

Numeric entry with steppers, composed from Axis `Input` + `Button`
(no reimplemented text entry or press handling): `value?: number |
null` (`null` = empty), `defaultValue?`, `onValueChange?`,
`min?`, `max?`, `step?: number` (default 1, clamped to >0),
`disabled?` (disables input + steppers),
`accessibilityLabel?`, `testID?`, `style?`, `inputStyle?`,
`buttonStyle?` (both steppers), `ref` (container). Invalid text
parses to `null`; stepping clamps into `[min, max]`. All optional.

## Textarea

Multiline entry: `value?`, `defaultValue?` (default `""`),
`onChangeText?`, `placeholder?`, `editable?` (default `true`),
`numberOfLines?` (default 3), `autoGrow?` (measured height merged
under caller style, no animation), `accessibilityLabel?`,
`testID?`, `style?`, `ref`. All optional.

## Fieldset

Group of related fields with a legend: `legend?`, `children?`,
`testID?`, `style?`, `legendStyle?`. No invented group role; legend
read as text. No validation logic — validity is caller state.
