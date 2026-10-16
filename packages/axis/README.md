# `@xoroh/axis`

Design-system-neutral, native-first behavior and interaction primitives
for React Native. Composable state models, hooks, and utilities with no
token reads, no styling, and no web-only APIs.

Status: extraction slices 1–2 (`time`, `useControllableState`, selection,
slot, overlay modality, dismissal, portal registry, focus/presence/press/
roving models with native bindings per contract, positioning rect math).
`collection` and `mergeRefs` transfer only through their adoption gates.
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
