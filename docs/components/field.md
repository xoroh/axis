## Field

Validation-aware label/control grouping, in Base UI compound parts:
`FieldRoot` (state + validation) + `FieldLabel` (association) +
`FieldControl` (wiring) + `FieldDescription` (helper text) +
`FieldError` (message) + `FieldValidity` (state render prop).

Source of truth: `FieldRootProps` and friends in `@xoroh/axis`
(`packages/axis/src/components/Field.tsx`); the error-map helpers
live in the `form` model (`packages/axis/src/form.ts`).

State follows the controlled + uncontrolled pattern throughout:
`value` (+ `onValueChange`) for controlled use, `defaultValue` for
uncontrolled. Validation runs per `validationMode` (`"onSubmit"`
default, then re-validates on change; `"onBlur"`; `"onChange"`), with
a field-level mode winning over the Form's. `validate` receives the
value (and the sibling form values) and returns a message, messages,
or nothing; async validators are awaited. Initial, untouched fields
are never invalid (`valid` starts `null`).

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `FieldRoot` | `Field.Root` | State owner (renders a plain `View`). Holds the value, runs validation, registers with the enclosing Form. |
| `FieldLabel` | `Field.Label` | Association text with an auto-generated `nativeID`. |
| `FieldControl` | `Field.Control` | Wiring wrapper: injects value reporting, blur/focus tracking, and `accessibilityLabelledBy` into its child (or a default Axis `Input`). |
| `FieldDescription` | `Field.Description` | Helper text with an auto-generated `nativeID`. |
| `FieldError` | `Field.Error` | Message shown while the field is invalid (announced politely). |
| `FieldValidity` | `Field.Validity` | Renders a function child with the validity state. |

`Field` (the monolith) is kept as a thin adapter over the compound:
`label` / control / `error` with the same props and behavior as
before, now with label association and Form participation built in.

Base UI parts with no native counterpart are omitted: `Field.Item`
(use the group components), `Field.Error match` (no DOM
ValidityState to match against — errors show by presence), external
`valid` (computed from validation; `invalid` covers the override),
per-field `actionsRef` (covered by `Form.validate(name)`), and
`aria-invalid` / `accessibilityState.invalid` (absent from this
React Native version — invalidity is announced through the error
live region instead).

### Props

#### `FieldRoot`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `name` | `string` | no | — | Field name: the errors-map key and submit payload key. |
| `value` | `unknown` | no | — | Controlled value. Wins over `defaultValue`. |
| `defaultValue` | `unknown` | no | — | Uncontrolled initial value. |
| `onValueChange` | `(value: unknown) => void` | no | — | Fires with the next reported value. |
| `validate` | `(value, formValues) => string \| string[] \| null \| undefined \| Promise<…>` | no | — | Custom validation; message(s) when invalid, nothing when valid. Async is awaited. |
| `validationMode` | `"onSubmit" \| "onBlur" \| "onChange"` | no | `"onSubmit"` | When to validate; wins over the Form's. |
| `disabled` | `boolean` | no | `false` | Terminal: no entry, skips validation. |
| `readOnly` | `boolean` | no | `false` | Terminal like `disabled`, never announced as disabled. Validates normally. |
| `invalid` | `boolean \| null` | no | — | Externally controlled invalid flag. |
| `dirty` | `boolean` | no | — | Externally controlled dirty flag. |
| `touched` | `boolean` | no | — | Externally controlled touched flag. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<FieldState, StyleProp<ViewStyle>>` | no | — | Container style: value or function of field state. |
| `render` | `RenderProp<FieldState, SlotProps>` | no | — | Element or function substitution for the root host. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root host. |
| `children` | `ReactNode` | no | — | Label, control, description, error, validity — in any order. |

`FieldState`: `{ value, disabled, touched, dirty, valid, invalid,
filled, focused, readOnly }` — `valid` is `null` until the first
validation; `invalid` is true with a server or local error (or the
explicit prop).

`FieldLabel` takes `children?`, `testID?`, `style?`, `render?`.
`FieldControl` takes `children?` (element or function receiving the
control props) plus `testID?`, `style?`, `render?`. `FieldControl`
does not take value props: the Root owns the field value and the
control reports into it — do not bind a second value onto the child.
`FieldDescription` takes `children?`, `testID?`, `style?`,
`render?`. `FieldError` takes `children?` (shown only while
invalid), `testID?`, `style?`, `render?`. `FieldValidity` takes one
required child: a function receiving `{ value, errors, error,
initialValue, valid, invalid, touched, dirty, filled, focused,
readOnly }`.

### Examples

Compound field with blur validation:

```tsx
import { Text } from "react-native";
import {
  FieldControl,
  FieldError,
  FieldLabel,
  FieldRoot,
  Input,
} from "@xoroh/axis";

function Email() {
  return (
    <FieldRoot
      name="email"
      validationMode="onBlur"
      validate={(v) =>
        typeof v === "string" && v.includes("@") ? null : "Bad email"
      }
    >
      <FieldLabel>Email</FieldLabel>
      <FieldControl>
        <Input testID="email" placeholder="e.g. ada@example.com" />
      </FieldControl>
      <FieldError>
        <Text>Enter a valid email</Text>
      </FieldError>
    </FieldRoot>
  );
}
```

Monolith (unchanged API, now with label association and Form
participation):

```tsx
import { Field, Input } from "@xoroh/axis";

function Name() {
  return (
    <Field label="Name">
      <Input testID="name" />
    </Field>
  );
}
```

### Accessibility

- The label carries an auto-generated `nativeID`; the control
  points back through `accessibilityLabelledBy` (Axis `Input`
  forwards it to the host).
- Errors render with `accessibilityLiveRegion="polite"` so they are
  announced on appearance.
- No `aria-invalid` exists on this React Native version, so no
  invalid flag is asserted — the announced error text carries the
  semantics instead.
- Descriptions render as plain traversable text alongside the
  labelled control (native labelled-by takes a single id).

### Composition

Every part takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function) and
value-or-function `style`. The root renders a plain `View`; roots
compose under `Form`, which supplies the fallback validation mode
and collects values. `data-*` attributes are deliberately absent on
native — state flows through those functions instead (contract §11,
parity D1). Verified by the field RNTL suites (22 tests —
`docs/COVERAGE.md`). Renders in `apps/example/src/demos/forms.tsx`
and `apps/example/src/demos/entry.tsx`.
