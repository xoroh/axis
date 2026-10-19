# Releasing `@xoroh/axis`

Release HOLD: **nothing here ships until Faroeq explicitly authorizes
the first release** (the 0.1.0 that ships alongside Kern 0.1.0, per
`docs/decisions/005-ship-with-kern-0-1-0.md`). Preparing, dry-running,
and documenting the flow perform no publish, no version bump, and no
tag. The `.team` release-hold list (npm publish · version bumps · tags
or releases · deploys · DNS · secrets · paid models) needs Faroeq's own
yes; the `npm-publish` environment approver and the `RELEASE_CHANGESSETS`
variable below never substitute for it.

## The one publish path

`.github/workflows/release.yml` is the only authorized publish path.
It NEVER runs on push or PR — `workflow_dispatch` only — and even a
manual run exits before touching the registry unless ALL hold:

1. The `npm-publish` GitHub environment approves (human approver,
   write token isolated to the `release` job).
2. The `RELEASE_CHANGESSETS` repository variable is `'true'`
   (the HOLD switch; absent/false by default).

The `verify` job (read-only `contents: read` permission) mirrors CI's
package gates — install, lint, typecheck, vitest, jest, boundary (+ its
mutation suite), readme, readme-examples, build, publint/attw — so a
manual dispatch can never publish a red tree. The `release` job needs
`contents: write` + `pull-requests: write` (the changesets version-PR
flow) and `id-token: write` (Sigstore signing for provenance).

## Auth: token-based today, OIDC not set up

- **Current state:** registry auth uses the `NPM_TOKEN` secret
  (`NODE_AUTH_TOKEN` mirrors it for `setup-node`'s registry-url
  `.npmrc`). Provenance does NOT come from an env var — `changeset
  publish` passes only `--access`/`--tag` to `npm publish` (verified
  in `@changesets/cli`), so the attestation comes from
  `publishConfig.provenance: true` in `packages/axis/package.json`
  plus the job's `id-token: write` permission.
- **Not set up (owner-authorized, do not configure in this lane):**
  OIDC trusted publishing (no stored token). Switching to it is a
  Faroeq decision; until then the token + `publishConfig.provenance`
  combination above is the working setup.
- The workflow pins every action to a commit SHA (no floating tags)
  and `bun 1.3.8` (matching the root `packageManager`).

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

Bump + CHANGELOG cut (only after Faroeq's yes):

4. `bun run changeset version` on a release branch: consumes
   `.changeset/*.md` into `CHANGELOG.md` and bumps
   `packages/axis/package.json`. Review the diff — the hand-written
   `## Unreleased` migration notes fold into the new
   `## <version>` section (first release: `## 0.1.0`).
5. Commit as `chore: version packages`, or let the release workflow's
   `changesets/action` open the version PR and merge it green.

Tag + publish:

6. Tag the release commit: `git tag axis-v<version>` (annotated;
   push the tag). No GitHub Release needed for the first publish —
   npm + tag is the record (add one later only if Faroeq asks).
7. Trigger the `Release` workflow manually from `main` (or the
   tagged commit), with the environment approval and the HOLD switch
   set. It runs `changeset publish`, which publishes with
   `--access public` (from the changesets `access: public` config
   and `publishConfig.access`) and provenance (from
   `publishConfig.provenance` + `id-token: write`).

Verify on npm (anyone, no auth needed):

8. `npm view @xoroh/axis version` shows the new version;
   `npm view @xoroh/axis dist.attestations` is non-empty
   (provenance attestation present).
9. Install from the registry in a scratch project and import both
   entries: `import '@xoroh/axis'` (RN host) and
   `import '@xoroh/axis/models'` (must load under plain node —
   RN-free by the boundary gate).

Kern bump + rollback:

10. Kern cuts over per its roadmap (vendored tarball pre-publish,
    semver after): bump Kern's pin to the published version and run
    Kern's gates.
11. Rollback is **deprecate, never unpublish**: if the release is bad,
    `npm deprecate @xoroh/axis@<version> "<reason, use X instead>"`
    and publish a fixed version forward. Unpublishing breaks every
    consumer install and (past 72h / with dependents) is blocked by
    npm policy.

## Final pre-release sweep: no internal files ship

The repo holds only files users and contributors need (source, tests,
user docs, README, LICENSE, CONTRIBUTING, SECURITY, SUPPORT,
CHANGELOG, CI/release config, `.github` templates). Reports, audits,
plans, roadmaps, archives, agent notes, and scratch live in
`.team/reports/axis` / `.team/plans/axis`, outside git. Before any
bump, prove both halves:

1. **Nothing internal is tracked.** From a clean tree:
   `git ls-files | grep -E '^(\.reports/|docs/IDEAS\.md)'` must print
   nothing (reports/audits/screenshots live under `.team/`, and
   `docs/IDEAS.md` planning has moved to `.team/plans/axis`). The
   per-file KEEP/MOVE/DELETE inventory lives in the release-prep
   report under `.team/reports/axis/` until Faroeq signs it off and
   the cleanup PR lands.
2. **Nothing internal is packed.** From `packages/axis`:
   `npm pack --dry-run` must list exactly the allowlist below —
   `package.json`, `LICENSE`, `README.md`, and `dist/` build output
   only. No tests, no `.reports`, no demos, no source maps, no `src`:

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

   (12 files total. `dist/` filenames other than the shared chunk are
   fixed by the `tsup` invocation in `packages/axis/package.json`.)
