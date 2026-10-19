## Form

Submit-and-validate root for field groups. There is no native form
submit on React Native, so submission is explicit: wire a control to
`actions.submit()` (via `actionsRef`), which validates every
registered field and calls `onFormSubmit` with the collected values
only when everything passes.

Source of truth: `FormProps`, `FormActions`, `FormState` in
`@xoroh/axis` (`packages/axis/src/components/Form.tsx`).

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `Form` | `Form` | The whole API: validation registry, submit gating, server-error mapping. Renders a plain `View` host (no native form element exists). |

`actionsRef` carries `{ submit, validate, clearErrors }` — a
superset of Base UI's `{ validate }`, because there is no native
submit event to hook. Field registration replaces per-field
imperative handles: fields register on mount with their
name, value getter, and validator.

### Props

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `errors` | `Record<string, string \| string[]>` | no | — | Server errors, keyed by field `name`. Take precedence over locally computed errors while present. |
| `onClearErrors` | `() => void` | no | — | Fires when the form clears errors on its own (the `clearErrors` action). Use it to drop the caller-owned server map. |
| `onFormSubmit` | `(values: Record<string, unknown>) => void` | no | — | Called with the collected field values when `submit()` validates every registered field. Never fires when anything is invalid. |
| `validationMode` | `"onSubmit" \| "onBlur" \| "onChange"` | no | `"onSubmit"` | Fallback validation timing for fields without their own `validationMode`. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StateStyle<FormState, StyleProp<ViewStyle>>` | no | — | Container style: value or function of form state. |
| `render` | `RenderProp<FormState, SlotProps>` | no | — | Element or function substitution for the host; field registration stays on the part. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the container `View`. |
| `children` | `ReactNode` | no | — | Fields plus the caller's own submit control. |
| `actionsRef` | `Ref<FormActions>` | no | — | Imperative handle: `{ submit, validate, clearErrors }`. |

`FormState`: `{ valid: boolean | null }` — overall validity (`null`
until the first validation).

Field errors shown in the UI travel through the fields themselves
(`FieldError` for messages, `FieldValidity` for state); the form
only coordinates. To show a summary, read the boolean returned by
`validate()` / `submit()`.

### Examples

Sign-up with required, pattern, and custom validation plus a
server-error round-trip:

```tsx
import { useRef, useState } from "react";
import { Text } from "react-native";
import {
  FieldControl,
  FieldError,
  FieldLabel,
  FieldRoot,
  Form,
  Input,
  type FieldErrors,
  type FormActions,
} from "@xoroh/axis";

function SignUp() {
  const [name, setName] = useState("");
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const actions = useRef<FormActions>(null);
  return (
    <Form
      errors={serverErrors}
      onClearErrors={() => setServerErrors({})}
      onFormSubmit={(values) => console.log(values)}
      actionsRef={actions}
    >
      <FieldRoot
        name="name"
        validate={(v) => (typeof v === "string" && v !== "" ? null : "Required")}
      >
        <FieldLabel>Name</FieldLabel>
        <FieldControl>
          <Input testID="name" value={name} onValueChange={setName} />
        </FieldControl>
        <FieldError>
          <Text>Name is required</Text>
        </FieldError>
      </FieldRoot>
      <Text onPress={() => actions.current?.submit()}>Create account</Text>
    </Form>
  );
}
```

Validate one field from the outside (e.g. a "check availability"
button next to the field):

```tsx
await actions.current?.validate("username");
```

### Accessibility

- Fields associate through native ids: `FieldLabel` carries
  `nativeID`, the control points back via
  `accessibilityLabelledBy`. Descriptions render as plain
  traversable text (native labelled-by takes a single id).
- Invalidity is announced through the error live region
  (`accessibilityLiveRegion="polite"` on `FieldError`). There is no
  `aria-invalid` / `accessibilityState.invalid` on this React Native
  version, so no invalid flag is asserted anywhere — the announced
  error text carries the semantics.
- The group/container carries no role: the fields, not the form,
  own the semantics.

### Composition

`Form` takes `render` (an element, cloned with the form props
merged under its own, or a `(props, state)` function) and
value-or-function `style` over `{ valid }`. `data-*` attributes are
deliberately absent on native — state flows through those functions
instead (contract §11, parity D1). Verified by the form RNTL suites
(`docs/COVERAGE.md`). The sign-up form renders in
`apps/example/src/demos/forms.tsx`.
