# Contributing to Axis

Axis is an open-source project. Contributions are welcome; for a
substantial change, please open an issue first so the scope can be
discussed.

## Development setup

Requirements: Bun 1.3.8 or newer.

```sh
git clone https://github.com/xoroh/axis.git
cd axis
bun install
```

Run the relevant tests before opening a pull request:

```sh
bun run lint
bun run test:all
```

Behavior changes should come with RNTL/RTL tests and a paragraph in the
matching `docs/components/<component>.md`.

## Pull requests

- Branch from `main` and target pull requests at `main`.
- Keep each change focused and explain the problem it solves.
- Add or update tests and documentation when behavior changes.
- Do not include secrets, credentials, or private user data.
- Use a clear, conventional commit message (for example, `feat: add ...`
  or `fix: ...`).

## Release notes

User-facing changes get a changeset: add a `.changeset/<name>.md`
(`"@xoroh/axis": "patch" | "minor" | "major"`) describing the change.
Versions are cut and published only through the release pipeline
(`docs/RELEASING.md`).

By submitting a contribution, you agree that it may be distributed
under the repository's MIT License. Please preserve existing copyright
and license notices.
