# Axis

Axis is an open-source project by [Xoroh](https://github.com/xoroh), set up as a Bun workspace monorepo.

> **Status:** This repository currently contains the project and open-source scaffolding. The product scope and first workspace will be documented here as they are defined.

## Workspace layout

- `apps/*` — applications
- `packages/*` — reusable packages

Each workspace should have its own `package.json` and a unique package name.
`packages/axis` is the `@xoroh/axis` behavior-primitives package (currently
an initial extraction slice; see its README). The retired
`@xoroh/axis-core` placeholder no longer exists.

## Getting started

Requirements: [Bun](https://bun.sh/) 1.3.8 or newer.

```sh
bun install
bun test
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

Packages will be versioned and published manually. See [docs/RELEASING.md](docs/RELEASING.md); no workflow publishes packages.

## License

Axis is licensed under the [MIT License](LICENSE).
