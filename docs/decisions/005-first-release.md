# 005. First release of `@xoroh/axis`

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16. Satisfied: 0.1.0 shipped 2026-10-20.

## Context

Axis needs release discipline before the first public publish: exactly one authorized pipeline, no ad-hoc versions, no unverified trees reaching the registry.

## Decision

Axis ships as `@xoroh/axis` through the release pipeline only
(`docs/RELEASING.md`): dispatch-only workflow, human environment
approval, changesets-driven versions. No publish happens outside the
pipeline, ever.

## Rationale

An independent public package with semver consumers from the first
publish. Checked against VISION principles 3, 5.

## Status

Accepted — and satisfied: 0.1.0 shipped on 2026-10-20 through the
release pipeline. Record: `docs/RELEASING.md`.
