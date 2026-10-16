# Manual package releases

Axis packages are **not published by GitHub Actions on push**.
Publishing is owner-authorized only and stays on HOLD until the
first release is explicitly authorized (the 0.1.0 that ships
alongside Kern 0.1.0 needs that authorization first — preparing
the flow below performs no publish, no version bump, and no tag).

Two paths, same gates:

1. **Release workflow** (`.github/workflows/release.yml`,
   preferred): trigger `Release` manually from the Actions tab.
   It verifies (install → build → publint/attw) and then stops
   unless the `RELEASE_CHANGESSETS` repository variable is
   `'true'` AND the `npm-publish` environment approves (human
   approver, isolated write token). With all three satisfied it
   runs `changesets/action` (`version-packages` then `release`),
   which opens the version PR or publishes with provenance.
2. **Manual fallback** (from the package directory, after a human
   approves the release): `bun install --frozen-lockfile`,
   `bun test`, `npm pack --dry-run` (inspect tarball contents
   and metadata), then `npm publish --access public`.

Before a package is released (either path):

1. Add its real source, documented entry points, build output, and tests.
2. Confirm its `package.json` has the correct `@xoroh/*` name, version, `exports`, `files`, repository URL, and MIT license.
3. Remove `"private": true` from that package only when it is explicitly approved for release. Keep the monorepo root private.
4. Add a changeset with `bun run changeset`, then review the version changes with `bun run version-packages` on a release branch.
5. From the monorepo root, run `bun install --frozen-lockfile` and `bun test`. Then run `npm pack --dry-run` from the package directory and inspect the tarball contents and metadata.
6. After a human approves the release, publish the package manually from its directory with `npm publish --access public`.

The npm account must have publish rights to the `@xoroh` scope. A successful `npm whoami` only confirms authentication, not scope ownership. Never put an npm token in the repository or its Git history.
