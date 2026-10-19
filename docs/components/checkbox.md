## Checkbox

Binary selection control with compound parts: a `CheckboxRoot`
`Pressable` carrying the checkbox role and state, with a
caller-composed `CheckboxIndicator` that mounts when the box is
checked or indeterminate. No default visuals — every visual
value (`style` on each part) is caller-provided. State follows
the controlled + uncontrolled pattern throughout: `checked`
(plus `onCheckedChange`) for controlled use, `defaultChecked`
for uncontrolled.

`indeterminate` (default `false`) marks the mixed state:
neither ticked nor unticked (a "select all" box over a partial
selection). It is announced through the `mixed` checked mapping
— React Native's `AccessibilityState` types `checked` as
`boolean | 'mixed'` (verified against the installed RN
`ViewAccessibility` union), so the platform mapping is
type-honest, not smuggled past the typechecker. The indicator
mounts for both `checked` and indeterminate; the caller styles
the difference through the indicator's `indeterminate` state.
Toggling reports through `onCheckedChange`; `indeterminate`
itself is caller-owned state (toggling does not clear it).

Source of truth: `CheckboxRootProps`, `CheckboxState`,
`CheckboxIndicatorProps`, `CheckboxIndicatorState` in
`@xoroh/axis`
(`packages/axis/src/components/Checkbox.tsx:31-96`).

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
| `CheckboxRoot` | `Checkbox.Root` | The checkbox itself: button-press semantics, `checked`/`indeterminate`/`disabled` state, checkbox role with `checked` (or `mixed`) mapping. |
| `CheckboxIndicator` | `Checkbox.Indicator` | Check mark; mounts while the box is checked or indeterminate. Caller styles checked vs mixed through indicator state. |

Omitted Base UI pieces are documented deviations, not
oversights: no `readOnly`/`required`/`name`/`value`/`form`
(form integration — Axis has no `Form` owner; native forms are
caller-owned, the `Input` precedent); no `keepMounted` (D3);
no transition attributes (D9); no `data-*` attributes (D1) —
all recorded in `docs/BASE_UI_PARITY.md` (§ Checkbox —
aligned).

### Props

#### `CheckboxRoot` (state owner)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `checked` | `boolean` | no | — | Controlled state. Wins over `defaultChecked` when defined. |
| `defaultChecked` | `boolean` | no | `false` | Uncontrolled initial state. |
| `onCheckedChange` | `(checked: boolean) => void` | no | — | Fires with the next state on every committed toggle. |
| `indeterminate` | `boolean` | no | `false` | Mixed state: neither ticked nor unticked. Announced as the `mixed` checked mapping; the indicator mounts while set. Caller-owned: toggling does not clear it. |
| `disabled` | `boolean` | no | `false` | Terminal: no transitions, no callbacks, announced as disabled. |
| `readOnly` | `boolean` | no | `false` | Read-only: focusable and announced like an enabled checkbox, but presses do not change state and no callbacks fire. Distinct from `disabled` (which blocks interaction and announces disabled) — React Native maps no readonly key, so the announcement is the normal checkbox state. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `accessibilityLabelledBy` | `string` | no | — | Native labelled-by association where the platform supports it. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host. |
| `style` | `StateStyle<CheckboxState, StyleProp<ViewStyle>>` | no | — | Value or function of checkbox state, caller-provided. |
| `children` | `ReactNode` | no | — | Box content (`CheckboxIndicator` composed by the caller). |
| `render` | `RenderProp<CheckboxState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof Pressable>>` | no | — | Forwarded to the root pressable host element. |

`CheckboxState`: `{ checked: boolean; disabled: boolean; indeterminate: boolean; readOnly: boolean }`.

#### `CheckboxIndicator`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Indicator style, caller-provided. |
| `children` | `ReactNode` | no | — | Indicator content. Mounts while the box is checked or indeterminate; with `keepMounted` it stays mounted while unchecked (hidden from assistive tech via `accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"` / `aria-hidden`, `{ checked: false, indeterminate: false }` state). Unlike `AccordionPanel` there is no `display: "none"` — the indicator stays visible by design (Base UI parity: the caller styles it from state). |
| `keepMounted` | `boolean` | no | `false` | When `true`, the indicator stays mounted while the box is unchecked: mounted but hidden from assistive tech. Default `false` (mounts only while checked or indeterminate — D3: keep-alive stays opt-in). |
| `render` | `RenderProp<CheckboxIndicatorState, SlotProps>` | no | — | Element or function substitution; the function form receives `(props, state)` with `{ checked, disabled, indeterminate, readOnly }` so the caller can style checked and mixed differently. |

`CheckboxIndicatorState`: `{ checked: boolean; disabled: boolean; indeterminate: boolean; readOnly: boolean }`.

Outside a root the indicator never mounts — it must render
inside a `CheckboxRoot` to participate. Read-only boxes (like
disabled ones) never toggle; unlike disabled ones they stay
focusable and announce the normal checkbox state.

### Examples

Consent box, uncontrolled:

```tsx
import { Text } from "react-native";
import { CheckboxIndicator, CheckboxRoot } from "@xoroh/axis";

function Consent() {
  return (
    <CheckboxRoot accessibilityLabel="Accept the terms">
      <CheckboxIndicator>
        <Text>✓</Text>
      </CheckboxIndicator>
    </CheckboxRoot>
  );
}
```

Controlled with function style over checkbox state:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { CheckboxIndicator, CheckboxRoot } from "@xoroh/axis";

function ControlledConsent() {
  const [checked, setChecked] = useState(false);
  return (
    <CheckboxRoot
      checked={checked}
      onCheckedChange={setChecked}
      accessibilityLabel="Accept the terms"
      style={(state) => ({ opacity: state.checked ? 1 : 0.6 })}
    >
      <CheckboxIndicator>
        <Text>✓</Text>
      </CheckboxIndicator>
    </CheckboxRoot>
  );
}
```

Select-all over a partial selection (mixed state; the caller
clears it when committing):

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { CheckboxIndicator, CheckboxRoot } from "@xoroh/axis";

function SelectAll() {
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(true);
  return (
    <CheckboxRoot
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        setIndeterminate(false);
      }}
      indeterminate={indeterminate}
      accessibilityLabel="Select all"
    >
      <CheckboxIndicator>
        <Text>{indeterminate ? "–" : "✓"}</Text>
      </CheckboxIndicator>
    </CheckboxRoot>
  );
}
```

Read-only with a mounted-but-hidden indicator (the box never
toggles, but stays focusable; the indicator is in the tree for
layout, hidden from assistive tech until checked):

```tsx
import { Text } from "react-native";
import { CheckboxIndicator, CheckboxRoot } from "@xoroh/axis";

function Locked() {
  return (
    <CheckboxRoot
      accessibilityLabel="Terms version"
      readOnly
    >
      <CheckboxIndicator keepMounted testID="terms-mark" />
    </CheckboxRoot>
  );
}
```

### Accessibility

- The root carries the `checkbox` role with `checked` (or
  `'mixed'` while indeterminate) + `disabled` state, so the
  box state reaches assistive technology.
- The indicator carries no semantics of its own: it is the
  visual, mounted exactly while the state it visualizes holds.
- `disabled` is terminal: no transitions, no callbacks, and
  the pressable is announced as disabled.

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
function-capable `style` over its state object (`{ checked,
disabled, indeterminate }`); the indicator's plain `style`
prop stays static (it mounts conditionally — state flows
through the `render` function instead). `data-*` attributes are
deliberately absent on native — state flows through those
functions instead (contract §11, parity D1). The old
`Checkbox` monolith (`boxStyle`/`checkmarkStyle`) is removed:
the compound parts subsume it exactly (Base UI has no
monolith) — ADR 001 naming parity, ADR 011 no compat shims;
migration in CHANGELOG `Unreleased`. Verified by the checkbox
RNTL suites (`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/selection.tsx`.
