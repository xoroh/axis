# 002. Drawer as the name

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Edge navigation drawer had competing names (`Drawer` vs `NavigationDrawer`).

## Decision

`Drawer` is the name. No `NavigationDrawer` alias — nothing is published, so there is nobody to migrate (see 011).

## Rationale

RN-ecosystem term wins; one canonical export, no duplicate behavior. Checked against VISION principle 1 (match the ecosystem term).

## Status

Accepted. Record: `docs/COVERAGE.md` (Navigation Bar/Rail/Drawer row).
