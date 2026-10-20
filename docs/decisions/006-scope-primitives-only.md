# 006. Scope is primitives only

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Axis coverage grew past behavior primitives into design patterns, which belong in consuming design systems.

## Decision

Axis holds base behavior primitives only. 21 design-pattern components leave Axis for consuming design systems; the list is recorded in `docs/BASE_UI_PARITY.md` (moved-out-scope section).

## Rationale

Keeps Axis neutral and composable; patterns get styling, tokens, and system ownership in the consuming design system. Checked against VISION principle 5.

## Status

Accepted. Moves execute as hard cuts with no aliases (see 011), one component at a time behind the contract gates.
