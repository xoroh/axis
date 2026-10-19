## Textarea

Multiline text entry: the host `TextInput` in multiline mode
with controlled/uncontrolled value plumbing. `autoGrow` tracks
content height into the caller's layout (measured height state
merged under caller `style`; no animation, no max-lines policy
beyond `numberOfLines` passthrough). Payloads stay primitive
strings, as in `Input`. State follows the controlled +
uncontrolled pattern throughout: `value` (plus `onValueChange`)
for controlled use, `defaultValue` for uncontrolled.

Source of truth: `TextareaProps`, `TextareaState` in
`@xoroh/axis` (`packages/axis/src/components/Textarea.tsx:18-56`).

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
| `Textarea` | `Textarea` | The whole API: multiline entry with auto-grow. Change events use the Base UI name `onValueChange` (contract §6; the host still receives RN `onChangeText` — the rename is the public prop only, parity record). |

### Props

#### `Textarea` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | no | — | Controlled text. Wins over `defaultValue` when defined. |
| `defaultValue` | `string` | no | `""` | Uncontrolled initial text. |
| `onValueChange` | `(text: string) => void` | no | — | Fires with the next text on every change (Base UI name). |
| `placeholder` | `string` | no | — | Placeholder text. Visual only, caller-provided. |
| `editable` | `boolean` | no | `true` | Editable flag. `false` renders read-only (change handling detaches). |
| `numberOfLines` | `number` | no | `3` | Visible line hint. |
| `autoGrow` | `boolean` | no | `false` | Grow the host height with content. Implemented as measured height state merged under caller `style`; no animation. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host. |
| `style` | `StateStyle<TextareaState, StyleProp<TextStyle>>` | no | — | Input style: a value or a function of textarea state, caller-provided. |
| `render` | `RenderProp<TextareaState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof TextInput>>` | no | — | Forwarded to the host text input. |

`TextareaState`: `{ value: string; editable: boolean }` — the
current text, and whether the input is currently editable.

### Examples

Minimal uncontrolled notes field:

```tsx
import { Textarea } from "@xoroh/axis";

function Notes() {
  return <Textarea placeholder="Add a note" accessibilityLabel="Notes" />;
}
```

Controlled with auto-grow (the host height tracks content):

```tsx
import { useState } from "react";
import { Textarea } from "@xoroh/axis";

function GrowingNotes() {
  const [value, setValue] = useState("");
  return (
    <Textarea
      value={value}
      onValueChange={setValue}
      autoGrow
      placeholder="Add a note"
      accessibilityLabel="Notes"
    />
  );
}
```

### Accessibility

- The host `TextInput` carries the caller's
  `accessibilityLabel`; multiline mode is a host behavior, not
  an asserted semantic.
- `editable={false}` renders read-only and detaches change
  handling — consistent with `Input`.

### Composition

`Textarea` takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ value,
editable }`); `data-*` attributes are deliberately absent on
native — state flows through those functions instead
(contract §11, parity D1). Verified by the textarea RNTL
suites (4 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/entry.tsx`.
