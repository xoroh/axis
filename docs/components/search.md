## Search

Search entry with clear affordance: composes the Axis `Input`
(no reimplemented text entry) with a clear `Pressable` rendered
only while the query is non-empty. Submit is the caller's
`onSubmit` on the return key (`onSubmitEditing`); result
filtering belongs to the caller, never here — this component
owns entry, not data. State follows the controlled +
uncontrolled pattern throughout: `value` (plus `onValueChange`)
for controlled use, `defaultValue` for uncontrolled.

Source of truth: `SearchProps`, `SearchState` in `@xoroh/axis`
(`packages/axis/src/components/Search.tsx:26-60`).

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
| `Search` | — | The whole API: entry + clear affordance. No Base UI counterpart. |

Filtering composes outside: the `Menu` filter parts (`Input` /
`Clear` / `Empty` on a compound `MenuRoot`) are the menu-list
counterpart (see `docs/components/menu.md`).

### Props

#### `Search` (single-part API)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `value` | `string` | no | — | Controlled query. Wins over `defaultValue` when defined. |
| `defaultValue` | `string` | no | `""` | Uncontrolled initial query. |
| `onValueChange` | `(value: string) => void` | no | — | Fires with the next query on every change. |
| `onSubmit` | `(value: string) => void` | no | — | Fires with the current query on submit (return key). |
| `placeholder` | `string` | no | — | Placeholder text. Visual only, caller-provided. |
| `accessibilityLabel` | `string` | no | — | Accessible name source. |
| `testID` | `string` | no | — | Test identifier, forwarded to the container. |
| `style` | `StateStyle<SearchState, StyleProp<ViewStyle>>` | no | — | Container style: a value or a function of search state. |
| `inputStyle` | `StyleProp<TextStyle>` | no | — | Input style, caller-provided. |
| `clearAccessibilityLabel` | `string` | no | `"Clear search"` | Clear-button label for assistive tech. |
| `render` | `RenderProp<SearchState, SlotProps>` | no | — | Element or function substitution; replaces the whole search container (entry plus clear affordance). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the container host element. |

`SearchState`: `{ value: string }` — the current query.

### Examples

Minimal search, uncontrolled:

```tsx
import { Search } from "@xoroh/axis";

function Finder() {
  return <Search placeholder="Search files" accessibilityLabel="Search files" />;
}
```

Controlled with submit handling (parent owns the query):

```tsx
import { useState } from "react";
import { Search } from "@xoroh/axis";

function ControlledFinder() {
  const [value, setValue] = useState("");
  return (
    <Search
      value={value}
      onValueChange={setValue}
      onSubmit={(query) => console.log(query)}
      placeholder="Search files"
      accessibilityLabel="Search files"
    />
  );
}
```

Styled container and input (every visual value is
caller-provided):

```tsx
import { Search } from "@xoroh/axis";

function StyledFinder() {
  return (
    <Search
      placeholder="Search files"
      accessibilityLabel="Search files"
      style={{ flexDirection: "row", padding: 8 }}
      inputStyle={{ flex: 1 }}
    />
  );
}
```

### Accessibility

- The entry carries the caller's `accessibilityLabel`; the
  clear button is a `button`-role `Pressable` labelled
  `clearAccessibilityLabel` (default "Clear search"), rendered
  only while the query is non-empty — no phantom affordance for
  an empty query.
- Filtering and result announcement belong to the caller: this
  component owns entry, not data.

### Composition

`Search` takes `render` (an element, cloned with the part props
merged under its own, or a `(props, state)` function) and
value-or-function `style` over its state object (`{ value }`);
`inputStyle` stays static (entry chrome carries no extra state).
`data-*` attributes are deliberately absent on native — state
flows through those functions instead (contract §11, parity D1).
Verified by the search RNTL suites (4 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/entry.tsx`.
