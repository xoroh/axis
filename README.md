# Axis

Unstyled, accessible UI components and native interaction primitives for React Native.

Axis provides composable state models, hooks, and unstyled rendered components with complete control over styling, native accessibility, and predictable interaction flows.

## Packages

- [`@xoroh/axis`](packages/axis/) ([README](packages/axis/README.md)) — the library. Install: `bun add @xoroh/axis react react-native` (peers `react >= 18`, `react-native >=0.86 <0.89`).

```tsx
import { Text } from "react-native";
import { DialogRoot, DialogTrigger, DialogPortal, DialogPopup } from "@xoroh/axis";

<DialogRoot>
  <DialogTrigger>
    <Text>Open</Text>
  </DialogTrigger>
  <DialogPortal>
    <DialogPopup aria-label="Example dialog">
      <Text>Hello</Text>
    </DialogPopup>
  </DialogPortal>
</DialogRoot>;
```

## Docs

- [`docs/VISION.md`](docs/VISION.md) — north star, principles, non-goals, quality bar.
- [`docs/decisions/`](docs/decisions/) — owner decisions (ADR per decision).
- [`docs/COMPONENT_CONTRACT.md`](docs/COMPONENT_CONTRACT.md) — what a component is, and the rules every slice follows.
- [`docs/BASE_UI_PARITY.md`](docs/BASE_UI_PARITY.md) — per-component Base UI parity with documented native deviations.
- [`docs/COVERAGE.md`](docs/COVERAGE.md) — the component coverage matrix across all 43 components.
- [`docs/RELEASING.md`](docs/RELEASING.md) — release checklist, gates, and automated release pipeline.
- [`docs/components/`](docs/components/) — individual documentation and source-of-truth types for all 43 components.

## License

MIT © Xoroh
