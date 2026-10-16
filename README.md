# Axis

Axis is an open-source React Native component library by
[Xoroh](https://github.com/xoroh) — the counterpart of Base UI for
native: unstyled, accessible behavior primitives and components,
usable with or without Kern.

## Packages

- [`@xoroh/axis`](packages/axis/) ([README](packages/axis/README.md))
  — the library. Install: `bun add @xoroh/axis react
  react-native` (peers `react >= 18`, `react-native >=0.86
  <0.89`).

```tsx
import { Text } from "react-native";
import { DialogRoot, DialogTrigger, DialogPortal, DialogPopup } from "@xoroh/axis";

<DialogRoot>
  <DialogTrigger>
    <Text>Open</Text>
  </DialogTrigger>
  <DialogPortal>
    <DialogPopup accessibilityLabel="Example dialog">
      <Text>Hello</Text>
    </DialogPopup>
  </DialogPortal>
</DialogRoot>;
```

## Docs

- [`docs/VISION.md`](docs/VISION.md) — north star, principles, non-goals, quality bar.
- [`docs/decisions/`](docs/decisions/) — owner decisions (ADR per decision).
- [`docs/IDEAS.md`](docs/IDEAS.md) — owner ideas not yet decided.
- [`docs/COMPONENT_CONTRACT.md`](docs/COMPONENT_CONTRACT.md) —
  what a component is, and the rules every slice follows.
- [`docs/BASE_UI_PARITY.md`](docs/BASE_UI_PARITY.md) — per-component
  Base UI parity with documented native deviations.
- [`docs/COVERAGE.md`](docs/COVERAGE.md) — the component coverage
  inventory.
- [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) — what the
  supported ranges rest on, honestly labeled.
- [`docs/components/`](docs/components/) — per-component notes
  (props, examples, accessibility).
- [`docs/RELEASING.md`](docs/RELEASING.md) — releases, owner-gated;
  nothing is published yet.

## Workspace layout

- `apps/*` — applications (each a Bun workspace with its own
  `package.json`).
- `packages/*` — reusable packages.

## Getting started

Requirements: [Bun](https://bun.sh/) 1.3.8 or newer.

```sh
bun install --frozen-lockfile
bun run test:all
bun run lint
bun run typecheck
bun run build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and contribution guidance. Please open an issue before starting a substantial change so its scope can be discussed.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Releases

Publishing is owner-gated (release HOLD). See
[docs/RELEASING.md](docs/RELEASING.md) and the gated `Release`
workflow; no push publishes packages.
