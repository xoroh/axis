# Contributing to Axis

Axis is an early-stage open-source project. Contributions are welcome; for a substantial change, please open an issue first so the scope can be discussed.

## Development setup

Requirements: Bun 1.3.8 or newer.

```sh
git clone https://github.com/xoroh/axis.git
cd axis
bun install
```

Run the relevant tests before opening a pull request:

```sh
bun test
```

Add new applications under `apps/` and reusable workspaces under `packages/`. Each workspace should have a unique package name and its own tests and documentation where appropriate.

## Pull requests

- Branch from `development` and target pull requests at `development`.
- Keep each change focused and explain the problem it solves.
- Add or update tests and documentation when behavior changes.
- Do not include secrets, credentials, or private user data.
- Use a clear, conventional commit message (for example, `feat: add ...` or `fix: ...`).

By submitting a contribution, you agree that it may be distributed under the repository's MIT License. Please preserve existing copyright and license notices.
