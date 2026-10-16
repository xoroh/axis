# AGENTS.md — Axis (`xoroh/axis`)

Axis provides design-system-neutral native-mobile behavior and
accessibility primitives. Bun monorepo. Install: `bun install
--frozen-lockfile`. Validate: `bun run test`, `bun run lint`,
`bun run --filter @xoroh/axis typecheck`.

## Scope

Work in this repository only. Kern, Xoroh governance, and other projects
are separate — never access or modify them. This package must stay
platform-neutral, except for rendered components: no DOM, Expo, or
design-system token imports anywhere; React Native host imports are
allowed only under `packages/axis/src/components/` (rendered components
per `docs/COMPONENT_CONTRACT.md`) and forbidden in behavior models
(enforced by `packages/axis/scripts/check-boundary.mjs`).
Two zones, one package: `src/*.ts` behavior models are universal
(re-exported alone as `@xoroh/axis/models` for web consumers);
`src/components/` is native-only, permanently.

## On-demand Xoroh standards audit

Agents may be asked to audit this repository against Xoroh standards:

1. Read `ADOPTED_STANDARDS.md` when present; otherwise record that no
   baseline is pinned yet and audit against the current central revision
   explicitly as latest-only.
2. Inspect actual code, config, CI, and settings — never assume.
3. Classify findings: compliant / noncompliant / partial / blocked /
   exception / owner-decision-required / recommendation / not-applicable,
   each with evidence.
4. Audits are read-only by default; standardization needs explicit scope
   and follows the central cross-repo workflow. Never roll changes out to
   other repositories from an audit.

## Rules

1. Do not publish, release, tag, deploy, merge, or change remote settings.
2. Do not push to `main`; do not run destructive Git operations.
3. Do not interfere with other agents' branches, stashes, or working changes.
4. No secrets in files, logs, or prompts. Never bypass failing checks.
5. Human approval is required before any irreversible action.
6. Verify against `docs/` and `GOVERNANCE.md`; project specifics stay here.

## Reporting

Report commands run, validation results, failures, and anything you could
not verify. State approval requirements explicitly; do not assume
authorization.
