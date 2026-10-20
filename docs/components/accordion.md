## Accordion

Disclosure group with compound parts: an `AccordionRoot` `View`
carrying the group's items, each an `AccordionItem` (value
identity + open state) composing one `AccordionHeader` (heading
host) with an `AccordionTrigger` `Pressable` (button role,
`expanded` state) and one `AccordionPanel` `View` that renders
ONLY while its item is open — presence is mount/unmount, never
hiding styles. No default visuals — every visual value (`style`
on each part) is caller-provided. State follows the controlled
+ uncontrolled pattern throughout: `value` (plus
`onValueChange`) for controlled use, `defaultValue` for
uncontrolled (default `[]`, all collapsed).

`multiple` (default `false`, the Base UI default) selects the
cardinality: single-expand replaces (activating the open item
collapses the group to `[]`), multi-expand toggles membership
independently. `orientation` (default `"vertical"`) is
structural documentation: it selects the container's
`flexDirection` (`column` / `row`) as a base the caller style
overrides, and records the reading order future focus
management must follow — it carries no focus behavior (no
roving layer). No `hiddenUntilFound`: it is N/A on React Native
— the prop hides closed panels with `hidden="until-found"` so
the desktop browser can find-in-page into them; native has no
find-in-page, and closed panels unmount instead.

Source of truth: `AccordionRootProps`, `AccordionRootState`,
`AccordionItemProps`, `AccordionItemState`,
`AccordionHeaderProps`, `AccordionHeaderState`,
`AccordionTriggerProps`, `AccordionTriggerState`,
`AccordionPanelProps`, `AccordionPanelState` in `@xoroh/axis`
(`packages/axis/src/components/Accordion.tsx:59-208`).

### Install

```sh
bun add @xoroh/axis react react-native
# or
npm install @xoroh/axis react react-native
```

Then add the printed tarball to your app (peers `react >= 18`,
`react-native >=0.86 <0.89`):

```sh
bun add /tmp/axis-vendor/axis-<short-sha>.tgz react react-native
```

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `AccordionRoot` | `Accordion.Root` | State owner (`value`/`defaultValue`/`onValueChange`, `multiple`, `orientation`, terminal `disabled`); renders the root group view. |
| `AccordionItem` | `Accordion.Item` | Value identity + per-item `disabled` and `onOpenChange`; provides open state to its header/trigger/panel. |
| `AccordionHeader` | `Accordion.Header` | Heading host (`header` role) wrapping the trigger. |
| `AccordionTrigger` | `Accordion.Trigger` | Button role, expanded state, tap toggles; inert outside an item. |
| `AccordionPanel` | `Accordion.Panel` | Content view; mounts only while the item is open. |

Omitted Base UI pieces are documented deviations, not
oversights: no `hiddenUntilFound` (N/A — no find-in-page on
native); no `keepMounted` (D3); no `loopFocus` (no roving
layer); no `onOpenChange` on Root (per-item only — the group
reports through `onValueChange`); no `index` in state (no
`data-index` on native — D1); no animation states (D9) — all
recorded in `docs/BASE_UI_PARITY.md` (§ Accordion — aligned).

### Props

#### `AccordionRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string[]` | no | — | Controlled open item values. Wins over `defaultValue` when defined. |
| `defaultValue` | `string[]` | no | `[]` | Uncontrolled initial open item values (all collapsed). |
| `onValueChange` | `(value: string[]) => void` | no | — | Fires with the open item values on every committed toggle. |
| `multiple` | `boolean` | no | `false` | When `false` only one panel can be open: activating an open item collapses the group to `[]`, activating another replaces it. When `true` panels toggle independently. |
| `orientation` | `"horizontal" \| "vertical"` | no | `"vertical"` | Reading order of the grouped items. Applied structurally as the container `flexDirection` (`column` / `row`); the caller `style` merges over it and wins on conflict. Carries no focus behavior. |
| `disabled` | `boolean` | no | `false` | Terminal: disables every item — no toggles, no callbacks. |
| `"aria-label"` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the root host. |
| `style` | `StateStyle<AccordionRootState, StyleProp<ViewStyle>>` | no | — | Root group view style: a value or a function of group state. |
| `children` | `ReactNode` | yes | — | The group's items (`AccordionItem`). |
| `render` | `RenderProp<AccordionRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root group host element. |

`AccordionRootState`: `{ value: string[]; disabled: boolean; multiple: boolean; orientation: "horizontal" | "vertical" }`.

#### `AccordionItem`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Disclosure value identifying this item. |
| `disabled` | `boolean` | no | `false` | Terminal for this item only: it never toggles and is announced as disabled. Combines with root `disabled` (either disables). |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with this item's next open state whenever its membership changes (including when another item's activation closes it in single-expand mode). |
| `testID` | `string` | no | — | Test identifier. |
| `children` | `ReactNode` | yes | — | The item's header and panel (`AccordionHeader`, `AccordionPanel`). |
| `render` | `RenderProp<AccordionItemState, SlotProps>` | no | — | Element or function substitution; replaces the whole item (header and panel), the panel still mounts only while expanded. |

`AccordionItemState`: `{ open: boolean; disabled: boolean }`.

#### `AccordionHeader`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the header host. |
| `style` | `StyleProp<ViewStyle>` | no | — | Header container style, caller-provided (static — the header carries no state of its own). |
| `children` | `ReactNode` | no | — | Header content (the `AccordionTrigger`). |
| `render` | `RenderProp<AccordionHeaderState, SlotProps>` | no | — | Element or function substitution; the function form receives the item's open state. |

`AccordionHeaderState`: `{ open: boolean; disabled: boolean }`.

#### `AccordionTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `disabled` | `boolean` | no | `false` | Terminal for the trigger: it never toggles and is announced as disabled. Combines with item `disabled` (either disables). Inert outside an item. |
| `"aria-label"` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `style` | `StateStyle<AccordionTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger pressable style: a value or a function of trigger state. |
| `children` | `ReactNode` | no | — | Trigger content. Optional — without it the trigger still renders, empty but accessible when labelled. |
| `render` | `RenderProp<AccordionTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`AccordionTriggerState`: `{ open: boolean; disabled: boolean }`.

#### `AccordionPanel`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier, forwarded to the panel host. |
| `style` | `StyleProp<ViewStyle>` | no | — | Panel view style, caller-provided (static — the panel mounts only while open; its state is constant). |
| `children` | `ReactNode` | no | — | Panel content, rendered inside a `View` only while the item is open (or always with `keepMounted`). |
| `keepMounted` | `boolean` | no | `false` | When `true`, the panel stays mounted while the item is closed: mounted but invisible (`display: "none"` merged after the caller style — the Base UI `hidden` attribute equivalent, state-driven visibility not a default style) and hidden from assistive tech (`accessibilityElementsHidden` on iOS, `importantForAccessibility="no-hide-descendants"` on Android, `aria-hidden` on web — `accessible={false}` alone does not hide children). Default `false` (mounts only while open — D3: keep-alive stays opt-in). |
| `render` | `RenderProp<AccordionPanelState, SlotProps>` | no | — | Element or function substitution; the panel still mounts only while the item is open. |

`AccordionPanelState`: `{ open: boolean; disabled: boolean }`.

### Examples

Settings group, uncontrolled (single-expand: opening Privacy
closes General):

```tsx
import { Text } from "react-native";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from "@xoroh/axis";

function Settings() {
  return (
    <AccordionRoot aria-label="Settings">
      <AccordionItem value="general">
        <AccordionHeader>
          <AccordionTrigger aria-label="General">
            <Text>General</Text>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>
          <Text>General settings</Text>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="privacy">
        <AccordionHeader>
          <AccordionTrigger aria-label="Privacy">
            <Text>Privacy</Text>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>
          <Text>Privacy settings</Text>
        </AccordionPanel>
      </AccordionItem>
    </AccordionRoot>
  );
}
```

Controlled multi-expand (parent owns the open set; panels toggle
independently):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from "@xoroh/axis";

function Faq() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <AccordionRoot multiple value={value} onValueChange={setValue}>
      <AccordionItem value="shipping" onOpenChange={(open) => console.log(open)}>
        <AccordionHeader>
          <AccordionTrigger aria-label="Shipping">
            <Text>Shipping</Text>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>
          <Text>Ships in 3 days.</Text>
        </AccordionPanel>
      </AccordionItem>
    </AccordionRoot>
  );
}
```

### Accessibility

- Triggers are `button`-role `Pressable`s with `expanded` +
  `disabled` state, so open/closed reaches assistive
  technology.
- Headers carry the `header` role (React Native maps it —
  verified against the installed `ViewAccessibility` union).
- No role is declared on the root: React Native defines no
  accordion role, and inventing one would be a claim a screen
  reader cannot cash (the `Label` precedent).
- Closed renders triggers only: panels unmount (never hidden
  styles), so there is nothing for assistive tech or tests to
  find.
- Explicitly deferred, each for a named reason: no animation
  (panels mount/unmount synchronously with state — exit
  transitions would need the `presence` model); no
  `hiddenUntilFound` (N/A — no find-in-page on native); no
  roving focus (no `loopFocus` layer).

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ value,
disabled, multiple, orientation }`, `{ open, disabled }`),
except `Header`/`Panel`, whose styles stay static (the
`DialogTitle` precedent); `data-*` attributes are deliberately
absent on native — state flows through those functions instead
(contract §11, parity D1). The old `Accordion`/`AccordionItem`
monoliths are removed (Base UI-exact parts replace them —
ADR 001 naming parity, ADR 011 no compat shims; migration in
CHANGELOG `Unreleased`). Verified by the accordion RNTL suites
(`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/disclosure.tsx`.
