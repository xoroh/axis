# 011. No backward compatibility before the first public release (0.1.0 Preview)

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Nothing is published, so there are no consumers to migrate. Aliases, shims, redirects, and fallbacks would tax every future reader to protect nobody.

## Decision

No backward compatibility anywhere until the first public release (0.1.0 Preview): remove deprecated aliases (old prop names, `NavigationDrawer`, warn-once shims), compat barrels and re-exports, legacy paths, URL redirects, and defensive dead code. One clean current API per thing. Only fallbacks that are real runtime/platform needs stay, each with its reason stated in code.

## Rationale

Pre-release velocity with a clean surface; the 1.0 stability promise (one-minor deprecation window) starts at 1.0, not before. Checked against the VISION quality bar (complete, correct, polished).

## Status

Accepted. Applies to everything touched, including this branch: 002 carries no alias; 006 moves are hard cuts.
