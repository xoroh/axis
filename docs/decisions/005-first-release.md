# 005. Ships as @xoroh/axis alongside Kern 0.1.0

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Kern’s native side needs a stable public foundation; Axis needs release discipline before Kern cuts over.

## Decision

Axis ships as `@xoroh/axis` alongside Kern 0.1.0. Release HOLD still applies: no versions, tags, or publish until explicitly authorized.

## Rationale

Independent package, coordinated train; Kern consumes the public entry (vendored tarball pre-publish, semver at first authorized publish). Checked against VISION principles 3, 5.

## Status

Accepted. Record: `docs/RELEASING.md`; Kern roadmap D-AXIS-SHIP / Phase 4.
