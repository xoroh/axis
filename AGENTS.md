# AGENTS.md — Axis (`xoroh/axis`)

Axis provides design-system-neutral native-mobile behavior and
accessibility primitives. Bun monorepo. Install: `bun install
--frozen-lockfile`. Validate: `bun run test`, `bun run lint`,
`bun run --filter @xoroh/axis typecheck`.

## Scope

Work in this repository only; do not touch other projects. This
package must stay platform-neutral, except for rendered components:
no DOM, Expo, or design-system token imports anywhere; React Native
host imports are allowed only under `packages/axis/src/components/`
(rendered components per `docs/COMPONENT_CONTRACT.md`) and forbidden
in behavior models (enforced by
`packages/axis/scripts/check-boundary.mjs`). Two zones, one package:
`src/*.ts` behavior models are universal (re-exported alone as
`@xoroh/axis/models` for web consumers); `src/components/` is
native-only, permanently.

## Direction

- `docs/VISION.md` is the test every decision is checked against.
- `docs/decisions/` holds ADRs; proposals become roadmap work through
  an ADR.
- `docs/COMPONENT_CONTRACT.md`, `docs/BASE_UI_PARITY.md`, and
  `docs/COVERAGE.md` are the component-level sources of truth.

## Rules

1. Publishing happens only through the release pipeline
   (`docs/RELEASING.md`); never publish, tag, or bump versions outside
   it.
2. Keep `main` green: full validation (lint, typecheck, both test
   suites, boundary gates, readme checks, build, example checks)
   before every push; fix or revert a red tree before landing more
   work.
3. No secrets in files, logs, or prompts. Never bypass failing checks.
4. Human approval is required before any irreversible action
   (publishes, deletions, destructive Git operations).
5. Verify against `docs/` and `GOVERNANCE.md`; project specifics stay
   here.

## Reporting

Report commands run, validation results, failures, and anything you
could not verify.
