## Table

Tabular structure: a root `View` (`Table`) carrying an optional
header group (`TableHeader`, the column-label row container)
followed by body rows (`TableRow` of `TableCell`). Plain `View`s
throughout, no virtualization (`ScrollView` is not in the
boundary allowlist, so windowing large data sets stays a caller
concern — e.g. a virtualized list rendering `TableRow`s). No
default visuals — column widths, alignment, and zebra striping
are the caller's. Sorting, pagination, row selection, and column
resizing are explicitly deferred: each needs its own state
domain and contract section first, not flags on this type.

Source of truth: `TableProps`, `TableHeaderProps`,
`TableRowProps`, `TableRowState`, `TableCellProps` in
`@xoroh/axis` (`packages/axis/src/components/Table.tsx:37-107`).

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
| `Table` | — | Root container (accessible name via `accessibilityLabel`). No Base UI counterpart. |
| `TableHeader` | — | Column-label row container. |
| `TableRow` | — | Row container; `header` marks the header row. |
| `TableCell` | — | Cell container; optional children so empty (spacer) cells render. |

### Props

#### `Table` (root)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | — | Table content: a `TableHeader` followed by body `TableRow`s, in order. |
| `accessibilityLabel` | `string` | no | — | Accessible name source (e.g. "Order history"). |
| `testID` | `string` | no | — | Test identifier, forwarded to the root host. |
| `style` | `StyleProp<ViewStyle>` | no | — | Root container style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution (Base UI parity); the function form receives an empty state object. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the root host element. |

#### `TableHeader`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | — | Header content: the column-label row (`TableRow header` or bare `TableCell`s). |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Header group container style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

#### `TableRow`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | — | Row content (`TableCell`s). |
| `header` | `boolean` | no | `false` | Structural marker only: when true the row is announced with the generic `header` role (React Native maps no rowheader role). Carries NO styling — header is a structural grouping, not a visual variant. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Row container style, caller-provided. |
| `render` | `RenderProp<TableRowState, SlotProps>` | no | — | Element or function substitution; the function form receives `(props, state)` with `{ header }`. |

`TableRowState`: `{ header: boolean }` — whether this row is a
header row.

#### `TableCell`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | Cell content. Optional so empty (spacer) cells render. |
| `testID` | `string` | no | — | Test identifier. |
| `style` | `StyleProp<ViewStyle>` | no | — | Cell container style, caller-provided. |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution; the function form receives an empty state object. |

### Examples

Order history with a header row:

```tsx
import { Text } from "react-native";
import { Table, TableCell, TableHeader, TableRow } from "@xoroh/axis";

function Orders() {
  return (
    <Table accessibilityLabel="Order history">
      <TableHeader>
        <TableRow header>
          <TableCell>
            <Text>Item</Text>
          </TableCell>
          <TableCell>
            <Text>Total</Text>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableRow>
        <TableCell>
          <Text>Socks</Text>
        </TableCell>
        <TableCell>
          <Text>$12</Text>
        </TableCell>
      </TableRow>
    </Table>
  );
}
```

Zebra striping is caller style (data rows stay plain `TableRow`s):

```tsx
import { Text } from "react-native";
import { Table, TableCell, TableRow } from "@xoroh/axis";

function Striped() {
  return (
    <Table>
      <TableRow style={{ backgroundColor: "#f5f5f5" }}>
        <TableCell>
          <Text>Row one</Text>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell>
          <Text>Row two</Text>
        </TableCell>
      </TableRow>
    </Table>
  );
}
```

### Accessibility

- No table-family role is declared on `Table`, `TableHeader`,
  or `TableCell`: React Native's screen-reader-mapped
  `accessibilityRole` defines no table, rowgroup, row, cell, or
  columnheader value (verified against `ViewAccessibility.d.ts`
  in the pinned `react-native` — the union has `header`,
  `list`, `grid`, `pager`, but nothing tabular). The newer ARIA
  `role` prop lists table-family values, but it has no
  consistent native screen-reader mapping and no package
  precedent, so no role is asserted anywhere and the gap is
  documented instead (contract §5).
- A header row (`TableRow header`) is announced with the
  generic `header` role — the closest mapped value — and nothing
  else.

### Composition

Every part takes `render` (an element, cloned with the part
props merged under its own, or a `(props, state)` function);
only `TableRow`'s function form receives state (`{ header }`) —
`Table`/`Header`/`Cell` styles stay static (the `DialogTitle`
precedent — a function of empty state adds nothing); `data-*`
attributes are deliberately absent on native — state flows
through those functions instead (contract §11, parity D1).
Verified by the table RNTL suites (5 tests —
`docs/COVERAGE.md`). Renders in
`apps/example/src/demos/display.tsx`.
