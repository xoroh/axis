# Manual package releases

Axis packages are **not published by GitHub Actions**. Publishing must remain a deliberate manual step; do not publish the initial `@xoroh/axis-core` placeholder.

Before a package is released:

1. Add its real source, documented entry points, build output, and tests.
2. Confirm its `package.json` has the correct `@xoroh/*` name, version, `exports`, `files`, repository URL, and MIT license.
3. Remove `"private": true` from that package only when it is explicitly approved for release. Keep the monorepo root private.
4. Add a changeset with `bun run changeset`, then review the version changes with `bun run version-packages` on a release branch.
5. From the monorepo root, run `bun install --frozen-lockfile` and `bun test`. Then run `npm pack --dry-run` from the package directory and inspect the tarball contents and metadata.
6. After a human approves the release, publish the package manually from its directory with `npm publish --access public`.

The npm account must have publish rights to the `@xoroh` scope. A successful `npm whoami` only confirms authentication, not scope ownership. Never put an npm token in the repository or its Git history.
