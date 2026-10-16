# 002. Drawer as primary name

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Edge navigation drawer had competing names (`Drawer` vs `NavigationDrawer`).

## Decision

`Drawer` is the primary name; `NavigationDrawer` remains only as a warn-once alias.

## Rationale

RN-ecosystem term wins; one canonical export, no duplicate behavior. Checked against VISION principle 1 (match the ecosystem term).

## Status

Accepted. Record: `docs/COVERAGE.md` (Navigation Bar/Rail/Drawer row).
