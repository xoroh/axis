## Tabs

Unstyled single-select tab group: a `TabsList` of pressable
triggers plus value-matched panels. Structure, behavior, and
accessibility only — every visual value (including the selected
indicator) is caller-provided. Selection is single-select and
replacing: activating the selected trigger keeps it (never
deselects), per the selection-model rule. An unselected panel
renders `null`, so exactly one panel is in the tree at a time.

Source of truth: `TabsRootProps`, `TabsListProps`, `TabsTriggerProps`,
`TabsPanelProps` in `@xoroh/axis`.

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
| `TabsRoot` | `Tabs.Root` | State owner (`value`/`defaultValue`/`onValueChange`); renders the container `View`. |
| `TabsList` | `Tabs.List` | Container view carrying the `tablist` role. |
| `TabsTrigger` | `Tabs.Tab` | Pressable with the `tab` role and `selected` state. |
| `TabsPanel` | `Tabs.Panel` | Content view; mounts only while its `value` is selected. |

### Props

#### `TabsRoot` (root)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | no | — | Controlled selection (a trigger value). Wins over `defaultValue` when defined. |
| `defaultValue` | `string` | no | — | Uncontrolled initial selection. No default — nothing is selected until a trigger is pressed. |
| `onValueChange` | `(value: string) => void` | no | — | Fires with the selected trigger value on every committed selection. |
| `children` | `ReactNode` | yes | — | Group content: one `TabsList` plus the `TabsPanel`s. |
| `style` | `StateStyle<TabsRootState, StyleProp<ViewStyle>>` | no | — | Root container style: a value or a function of tab state. |
| `testID` | `string` | no | — | Test identifier, forwarded to the root container. |
| `render` | `RenderProp<TabsRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root container host element. |

`TabsRootState`: `{ value: string | undefined }` — the current selection
(`undefined` when nothing is selected).

#### `TabsList`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | — | The list's triggers (`TabsTrigger`). |
| `style` | `StyleProp<ViewStyle>` | no | — | Tab-list container style (static — the list carries no state). |
| `testID` | `string` | no | — | Test identifier, forwarded to the list view. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `TabsTrigger`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | Selection value contributed to the group when this trigger is activated. |
| `disabled` | `boolean` | no | `false` | Terminal for this trigger only: it never selects and is announced as disabled. Siblings are unaffected. |
| `children` | `ReactNode` | no | — | Trigger content. With no children, pass `accessibilityLabel` — an unnamed tab is unusable. |
| `"aria-label"` | `string` | no | — | Accessible name source. |
| `style` | `StateStyle<TabsTriggerState, StyleProp<ViewStyle>>` | no | — | Trigger style: a value or a function of trigger state. |
| `testID` | `string` | no | — | Test identifier, forwarded to the trigger host. |
| `render` | `RenderProp<TabsTriggerState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |

`TabsTriggerState`: `{ selected: boolean; disabled: boolean }` — the
hook for a selected-indicator style (see examples).

#### `TabsPanel`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | yes | — | This panel renders only while the group selection equals it; otherwise it returns `null` and leaves the tree entirely. |
| `children` | `ReactNode` | no | — | Panel content (caller-owned). |
| `style` | `StyleProp<ViewStyle>` | no | — | Panel view style (static — the panel carries no state). |
| `testID` | `string` | no | — | Test identifier, forwarded to the panel view. |
| `render` | `RenderProp<TabsRootState, SlotProps>` | no | — | Element or function substitution; the panel still mounts only while selected. |

### Examples

Minimal, uncontrolled (starts on `account`):

```tsx
import { Text } from "react-native";
import { TabsRoot, TabsList, TabsPanel, TabsTrigger } from "@xoroh/axis";

function SettingsTabs() {
  return (
    <TabsRoot defaultValue="account">
      <TabsList style={{ flexDirection: "row", gap: 8 }}>
        <TabsTrigger value="account" style={{ padding: 8 }}>
          <Text>Account</Text>
        </TabsTrigger>
        <TabsTrigger value="security" style={{ padding: 8 }}>
          <Text>Security</Text>
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="account">
        <Text>Account settings</Text>
      </TabsPanel>
      <TabsPanel value="security">
        <Text>Security settings</Text>
      </TabsPanel>
    </TabsRoot>
  );
}
```

Controlled (parent owns the selection):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { TabsRoot, TabsList, TabsPanel, TabsTrigger } from "@xoroh/axis";

function PeriodTabs() {
  const [period, setPeriod] = useState("day");
  return (
    <TabsRoot value={period} onValueChange={setPeriod}>
      <TabsList style={{ flexDirection: "row", gap: 8 }}>
        <TabsTrigger value="day" style={{ padding: 8 }}>
          <Text>Day</Text>
        </TabsTrigger>
        <TabsTrigger value="week" style={{ padding: 8 }}>
          <Text>Week</Text>
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="day">
        <Text>Day view</Text>
      </TabsPanel>
      <TabsPanel value="week">
        <Text>Week view</Text>
      </TabsPanel>
    </TabsRoot>
  );
}
```

Selected indicator from trigger state (there is no indicator part —
geometry is caller style):

```tsx
import { Text } from "react-native";
import { TabsRoot, TabsList, TabsTrigger } from "@xoroh/axis";

function UnderlinedTabs() {
  return (
    <TabsRoot defaultValue="one">
      <TabsList style={{ flexDirection: "row" }}>
        <TabsTrigger
          value="one"
          style={(state) => ({
            padding: 8,
            borderBottomWidth: state.selected ? 2 : 0,
          })}
        >
          <Text>One</Text>
        </TabsTrigger>
        <TabsTrigger value="two" style={{ padding: 8 }}>
          <Text>Two</Text>
        </TabsTrigger>
      </TabsList>
    </TabsRoot>
  );
}
```

### Accessibility

- The `TabsRoot` root is a plain container with no role: the group role
  lives once, on `TabsList` — a second group role on the root would
  double-announce the control.
- `TabsList` is an accessibility element with
  `accessibilityRole="tablist"`, so assistive technology announces
  the tab group before its tabs.
- `TabsTrigger` carries `accessibilityRole="tab"` with
  `accessibilityState { selected, disabled }`; the accessible name
  comes from its text children or `accessibilityLabel`. `disabled`
  is terminal: no selection, no callbacks.
- `TabsPanel` carries no role — panel content is caller-owned.
  Unselected panels are absent from the tree, so screen readers can
  never land on hidden content.
- Keyboard arrow-key roving and orientation props are explicitly
  deferred, each for a named reason: native press selection
  suffices, and this family adopts no `roving`/`collection` model
  (contract §5 conditional rule; parity record D8).

### Composition

Every part takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function) and the
state-driven `style` shown in the tables; `data-*` attributes are
deliberately absent on native — state flows through those functions
instead (contract §11, parity D1). The Base UI `Indicator` part is
omitted: indicator geometry is caller style, recorded in
`docs/BASE_UI_PARITY.md`. Verified by the tabs RNTL suite (7 tests —
`docs/COVERAGE.md`).
