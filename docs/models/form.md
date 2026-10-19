# Form model

Source of truth: `packages/axis/src/form.ts` in `@xoroh/axis`
(the `.` entry and the `./models` subpath export the same names).

RN-free validation plumbing: error maps keyed by field name, server
errors taking precedence while present, and emptiness checks. Used
by `Field`/`Form`; usable standalone wherever error maps travel.

## API

| Export | Kind | Behavior |
|---|---|---|
| `FieldErrors` | type | `Record<string, string \| string[]>`: per-field messages. |
| `normalizeFieldErrors(error?)` | function | Wraps a lone message into a list; missing becomes `[]`. |
| `mergeFormErrors(internal, server)` | function | Merges per field with server entries winning while present. |
| `isEmptyValue(value)` | function | `true` for `undefined`, `null`, and `""`. |

## Usage

```ts
import {
  isEmptyValue,
  mergeFormErrors,
  normalizeFieldErrors,
} from "@xoroh/axis/models";

const internal = { name: normalizeFieldErrors(validate(name)) };
const errors = mergeFormErrors(internal, serverErrors);
const empty = isEmptyValue(value);
```
