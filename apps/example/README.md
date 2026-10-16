# Axis example app

Runnable Expo demo app: one unstyled demo per `@xoroh/axis`
component family. Never published (`private: true`).

## Run

```sh
# from the repo root
bun install --frozen-lockfile
bun run --filter @xoroh/axis build   # demos resolve the built barrel
cd apps/example && bunx expo start
```

Open in Expo Go, an emulator, or `expo start --web` (web needs
`react-native-web`, not installed — native first).

## Conventions

- Plain caller styles only (layout + readability). No tokens, no
  design system, no Kern dependencies — demos prove the unstyled
  contract, and this repo must not grow Kern coupling.
- One file per demo in `src/demos/`, registered in
  `src/demos/registry.ts` with the barrel exports it demonstrates.
- Navigation is `useState` by design (no navigation library).
- `bun run check:demos` verifies every barrel component export
  has a demo (informational until coverage completes; joins CI
  with the final batch).
