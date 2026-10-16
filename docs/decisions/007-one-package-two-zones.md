# 007. One package, two zones

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Behavior models are platform-neutral; rendered components are native-only. One package needs a boundary that keeps the two honest.

## Decision

Single `@xoroh/axis` package with two zones: universal models (plus a `./models` subpath) and native-only components. Models stay free of React Native host imports (boundary gate enforces); components live under `src/components/` only.

## Rationale

One versioned surface, no split-package overhead, with the neutral/native line mechanically enforced instead of documented.

## Status

Accepted. Extends the two-zone rule in `docs/COMPONENT_CONTRACT.md` §4.
