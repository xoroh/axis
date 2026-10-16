# `@xoroh/axis`

Design-system-neutral, native-first behavior and interaction primitives
for React Native. Composable state models, hooks, and utilities with no
token reads, no styling, and no web-only APIs.

## Scope and independence

- Axis is an independent, standalone, unstyled React Native library. It
  never depends on Kern, Kern tokens, or any design system, and it is
  usable without Kern.
- Today Axis provides **behavior foundations** (state models, hooks,
  registries, math) — not rendered components and not design-system
  styling. Rendered, accessible components arrive under the component
  contract as it is reviewed; until then, nothing here renders UI.
- The public entry (`.`) is the whole contract. Deep imports are
  unsupported. Factory internals and web-only behavior stay private
  even where they exist in source for hooks or tests.

Status: extraction slices 1–2 (`time`, `useControllableState`, selection,
slot, overlay modality, dismissal, portal registry, focus/presence/press/
roving models with native bindings per contract, positioning rect math),
plus native verification (jest + React Native preset: `*.rntest.tsx`
behavior suites proving the public entry in the RN runtime; the shipped
artifact additionally bundles under the Expo 57 host — see the Kern
roadmap for that evidence). `collection` and `mergeRefs` transfer only
through their adoption gates.
See the [Axis repository](https://github.com/xoroh/axis) and
`docs/RELEASING.md` (manual releases only; nothing is published yet).

## Install

```sh
bun add @xoroh/axis react react-native
```

`react >= 18` is a peer dependency. `react-native` peer ranges are
declared as native-binding modules land; the current slice is pure React
and runs anywhere React runs, including React Native.

## Usage

```ts
import { useControllableState, normalizeTimeValue } from "@xoroh/axis";
```

Only the documented public entry (`.`) is supported. Deep imports are
not part of the contract.
