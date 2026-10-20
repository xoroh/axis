# Releasing `@xoroh/axis`

Axis shipped its first public release (0.1.0) through this pipeline on
2026-10-20. Every future version goes through the same one publish
path — releases never run on push, never run from a local terminal
with the production config, and never publish an unverified tree.

## The one publish path

`.github/workflows/release.yml` is the only authorized publish path.
It NEVER runs on push or PR — `workflow_dispatch` only — and even a
manual run exits before touching the registry unless ALL gates hold:

1. The `npm-publish` GitHub environment approves (human approver).
2. The `RELEASE_CHANGESSETS` repository variable is `'true'`
   (the release switch; absent/false by default).

The `verify` job (read-only `contents: read` permission) mirrors CI's
package gates — install, lint, typecheck, vitest, jest, boundary (+ its
mutation suite), readme, readme-examples, build, publint/attw — so a
manual dispatch can never publish a red tree. The `release` job needs
`contents: write` + `pull-requests: write` (the changesets version-PR
flow) and `id-token: write` (Sigstore signing for provenance and OIDC
token exchange).

## Auth: npm Trusted Publishing (OIDC tokenless)

- **Setup:** Uses npm Trusted Publishing via OpenID Connect (OIDC).
  GitHub Actions requests a short-lived publication token from
  npmjs.com using `id-token: write`. No static long-lived `NPM_TOKEN`
  secret is required or used.
- **Bootstrap:** 0.1.0 was published once manually (npm requires the
  package to exist before its Trusted Publisher settings UI appears).
- **Ongoing configuration (verify after any npm-side change):**
  1. Go to `npmjs.com/package/@xoroh/axis` → Settings → Trusted
     publishing.
  2. Confirm the GitHub Actions publisher (`xoroh` / `axis` /
     `release.yml` / `npm-publish`).
  3. In Settings → Publishing access, select "Require two-factor
     authentication and disallow tokens".
  4. From that point forward, all releases publish tokenlessly via
     GitHub Actions with cryptographic Sigstore provenance.

## Release checklist (run in order, all green or stop)

Pre-flight (local, from a clean tree on `main`):

1. `bun install --frozen-lockfile`, then `bun run build`.
2. Every gate: `bun run lint`, `bun run --filter @xoroh/axis typecheck`,
   `bun run --filter @xoroh/axis test` (vitest),
   `bun run --filter @xoroh/axis test:jest`,
   `bun run --filter @xoroh/axis check:boundary` (+ `bun test
   packages/axis/scripts/lib/boundary-policy.test.mjs`),
   `bun run --filter @xoroh/axis check:readme`,
   `bun run --filter @xoroh/axis check:readme-examples`,
   `bun run --filter @xoroh/axis-example typecheck`,
   `bun run --filter @xoroh/axis-example check:demos`,
   `bun run --filter @xoroh/axis check:publish` (publint + attw).
3. Dry run from `packages/axis`: `npm pack --dry-run` (inspect the
   file list — allowlist in the sweep section below) and
   `npm publish --dry-run` (expect `+ @xoroh/axis@<version>` with
   `public access`, tag `latest`).

Version + CHANGELOG cut:

4. Add a `.changeset/<name>.md` (patch/minor/major per change) on the
   contributing PR; changesets accumulate on `main`.
5. Trigger the `Release` workflow manually from `main` with the
   environment approval and the switch set:
   - with pending changesets, `changesets/action` opens a
     `chore: version packages` PR (VERSION + CHANGELOG under
     `packages/axis`) — review it and merge green;
   - on the next dispatch after the version PR merges, changesets
     publishes with `--access public` (from `publishConfig.access`)
     and provenance (from `publishConfig.provenance` +
     `id-token: write`).

Tag + GitHub release:

6. Tag the release commit: `git tag axis-v<version>` (annotated;
   push the tag).
7. Cut a GitHub Release from the tag with the version's CHANGELOG
   section as the notes.

Verify on npm (anyone, no auth needed):

8. `npm view @xoroh/axis version` shows the new version;
   `npm view @xoroh/axis dist.attestations` is non-empty
   (provenance attestation present).
9. Install from the registry in a scratch project and import both
   entries: `import '@xoroh/axis'` (RN host) and
   `import '@xoroh/axis/models'` (must load under plain node —
   RN-free by the boundary gate). Repeat under npm, pnpm, yarn, and
   bun.

## Rollback

Rollback is **deprecate, never unpublish**: if the release is bad,
`npm deprecate @xoroh/axis@<version> "<reason, use X instead>"`
and publish a fixed version forward. Unpublishing breaks every
consumer install and (past 72h / with dependents) is blocked by
npm policy.

## Final pre-release sweep: no internal files ship

The repo holds only files users and contributors need (source, tests,
user docs, README, LICENSE, CONTRIBUTING, SECURITY, SUPPORT,
CHANGELOG, CI/release config, `.github` templates). Reports, audits,
plans, roadmaps, archives, agent notes, and scratch live outside git.
Before any bump, prove both halves:

1. **Nothing internal is tracked.** From a clean tree:
   `git ls-files | grep -E '^\.(reports|team|changeset-[a-z]+\.md)'`
   must print nothing.
2. **Nothing internal is packed.** From `packages/axis`:
   `npm pack --dry-run` must list exactly the allowlist below —
   `package.json`, `LICENSE`, `README.md`, and `dist/` build output
   only. No tests, no demos, no source maps, no `src`:

   ```text
   package/package.json
   package/LICENSE
   package/README.md
   package/dist/index.js
   package/dist/index.cjs
   package/dist/index.d.ts
   package/dist/index.d.cts
   package/dist/models.js
   package/dist/models.cjs
   package/dist/models.d.cts
   package/dist/models.d.ts
   package/dist/chunk-<content-hash>.js   # tsup shared chunk; name varies
   ```
