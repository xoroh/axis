## Field

Unstyled label/control/error row: an optional label above the
caller's control, and an optional error message below it. No
validation logic lives here — validity is caller state, expressed
by passing `error`. The control is plain composition (`children`),
so any Axis input or the caller's own element slots in.

Source of truth: `FieldProps`, `FieldState` in `@xoroh/axis`.

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

`Field` is a single part — it has no Base UI compound split:

| Axis part | Base UI counterpart | Role |
| --- | --- | --- |
| `Field` | `Field.Root` (approximate) | Container view: label `Text`, the caller's control, error `Text`. |

Base UI's `Control`/`Description`/`Validity` parts are documented
deviations, not oversights: validity is caller state (`error`), and
control-id wiring beyond plain composition is deferred until a
consumer demonstrates the need (`docs/BASE_UI_PARITY.md`).

### Props

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `label` | `ReactNode` | no | — | Label content, rendered above the control. |
| `children` | `ReactNode` | no | — | The control element (an Axis `Input` (multiline included) or your own). |
| `error` | `ReactNode` | no | — | Error content; rendered only when provided, announced politely. |
| `style` | `StateStyle<FieldState, StyleProp<ViewStyle>>` | no | — | Container style: a value or a function of field state. |
| `labelStyle` | `StyleProp<TextStyle>` | no | — | Label text style, caller-provided. |
| `errorStyle` | `StyleProp<TextStyle>` | no | — | Error text style, caller-provided. |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `render` | `RenderProp<FieldState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the container `View` host element. |

`FieldState`: `{ invalid: boolean }` — `true` while `error` is
provided (nothing more runs: the field never validates on its own).

### Examples

Minimal — label plus an Axis `Input`:

```tsx
import { useState } from "react";
import { Field, Input } from "@xoroh/axis";

function NameField() {
  const [name, setName] = useState("");
  return (
    <Field label="Name">
      <Input
        accessibilityLabel="Name"
        value={name}
        onValueChange={setName}
        placeholder="Ada"
      />
    </Field>
  );
}
```

Caller-driven validity — the caller decides what is invalid and
passes the message; the field styles itself from `state.invalid`:

```tsx
import { useState } from "react";
import { Field, Input } from "@xoroh/axis";

function EmailField() {
  const [email, setEmail] = useState("");
  const invalid = email.length > 0 && !email.includes("@");
  return (
    <Field
      label="Email"
      error={invalid ? "Enter a valid email address." : undefined}
      style={(state) => ({ gap: 4, opacity: state.invalid ? 0.9 : 1 })}
    >
      <Input
        accessibilityLabel="Email"
        value={email}
        onValueChange={setEmail}
        placeholder="ada@example.com"
      />
    </Field>
  );
}
```

### Accessibility

- The error `Text` carries `accessibilityLiveRegion="polite"`, so
  the message is announced when it appears — without stealing focus.
- The label is a plain `Text` above the control: Field does not yet
  wire a programmatic label ↔ control association. That gap is
  documented, not silent (contract §5): name the control itself
  with `accessibilityLabel` (or `accessibilityLabelledBy` where the
  platform supports it).
- Field never validates, blocks input, or announces on its own
  schedule — validity and timing are the caller's state.
- `state.invalid` through function `style`/`render` is the hook for
  invalid-state visuals (WCAG 2.2 AA contrast remains the caller's
  responsibility — Field is unstyled).

### Composition

`Field` takes `render` (an element, cloned with the field props
merged under its own, or a `(props, state)` function over
`{ invalid }`) and value-or-function `style`; `labelStyle`/
`errorStyle` stay static (the text nodes carry no state).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11, parity D1). Verified
by RNTL in the input suite (`docs/COVERAGE.md`).
