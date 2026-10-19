## Input

Text entry, single-line or multiline: the host `TextInput` with
controlled/uncontrolled value plumbing. `multiline` switches the
host into multiline mode (the folded `Textarea`: `numberOfLines`
defaults to 3 there); `autoGrow` tracks content height with
optional `minRows`/`maxRows` clamps and `onHeightChange` reports.
Payloads stay primitive strings (`onValueChange`) — no event-object
types cross this boundary. Keyboard selection and masking beyond
`secureTextEntry` stay out, not hidden behavior here. State follows
the controlled + uncontrolled pattern throughout: `value` (plus
`onValueChange`) for controlled use, `defaultValue` for
uncontrolled.

Source of truth: `InputProps`, `InputState` in `@xoroh/axis`
(`packages/axis/src/components/Input.tsx:21-87`).

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
| `Input` | `Input` | The whole API: single-line entry. Change events use the Base UI name `onValueChange` (contract §6; the host still receives RN `onChangeText` — the rename is the public prop only, parity record). |

### Props

#### `Input` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | no | — | Controlled text. Wins over `defaultValue` when defined. |
| `defaultValue` | `string` | no | `""` | Uncontrolled initial text. |
| `onValueChange` | `(text: string) => void` | no | — | Fires with the next text on every change (Base UI name). |
| `placeholder` | `string` | no | — | Placeholder text. Visual only, caller-provided. |
| `secureTextEntry` | `boolean` | no | `false` | Obscured entry. |
| `editable` | `boolean` | no | `true` | Editable flag. `false` renders read-only (change and submit handlers detach). |
| `onSubmitEditing` | `() => void` | no | — | Fires on the return key. Multiline callers typically omit it (return inserts a newline). |
| `multiline` | `boolean` | no | `false` | Multiline entry (the folded `Textarea`). |
| `numberOfLines` | `number` | no | `3` in multiline mode, unset otherwise | Visible line hint. |
| `autoGrow` | `boolean` | no | `false` | Grow the host height with content (multiline only). Measured height merges under caller `style`; no animation. |
| `minRows` | `number` | no | — | Minimum grown rows: rows × one row (`lineHeight`, else `fontSize`, else 14). Ignored without `autoGrow`. |
| `maxRows` | `number` | no | — | Maximum grown rows (same row rule; wins over `minRows`). Ignored without `autoGrow`. |
| `onHeightChange` | `(height: number) => void` | no | — | Fires with the measured content height on every content-size change while `autoGrow` is set (clamped value). |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host. |
| `style` | `StateStyle<InputState, StyleProp<TextStyle>>` | no | — | Input style: a value or a function of input state, caller-provided. |
| `render` | `RenderProp<InputState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof TextInput>>` | no | — | Forwarded to the host text input. |

`InputState`: `{ value: string; editable: boolean }` — the
current text, and whether the input is currently editable.

### Examples

Minimal uncontrolled entry:

```tsx
import { Input } from "@xoroh/axis";

function Name() {
  return <Input placeholder="Ada" accessibilityLabel="Name" />;
}
```

Controlled with submit (parent owns the text):

```tsx
import { useState } from "react";
import { Input } from "@xoroh/axis";

function ControlledName() {
  const [value, setValue] = useState("");
  return (
    <Input
      value={value}
      onValueChange={setValue}
      onSubmitEditing={() => console.log(value)}
      placeholder="Ada"
      accessibilityLabel="Name"
    />
  );
}
```

Password entry, read-only preview (change and submit detach
when not editable):

```tsx
import { Input } from "@xoroh/axis";

function Password() {
  return (
    <Input
      secureTextEntry
      editable={false}
      defaultValue="hunter2"
      accessibilityLabel="Password"
    />
  );
}
```

Multiline with growth (the folded `Textarea` — `Textarea` was
removed in ADR-012; migrate `<Textarea … />` to
`<Input multiline … />`):

```tsx
import { Input } from "@xoroh/axis";

function Notes() {
  return (
    <Input
      multiline
      autoGrow
      minRows={2}
      maxRows={6}
      onHeightChange={(height) => console.log(height)}
      defaultValue=""
      placeholder="Enter notes..."
      accessibilityLabel="Notes"
    />
  );
}
```

### Accessibility

- The host `TextInput` carries the caller's
  `accessibilityLabel`; without one the platform falls back to
  its own heuristics.
- `editable={false}` renders read-only and detaches change and
  submit handling — a non-editable entry that still fires
  callbacks would be a lie about its state.

### Composition

`Input` takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ value,
editable }`); `data-*` attributes are deliberately absent on
native — state flows through those functions instead
(contract §11, parity D1). Composed whole by `Search`
(entry + clear affordance — see `docs/components/search.md`).
Verified by the input RNTL suites (5 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/entry.tsx`.
