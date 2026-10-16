# 009. No wrapping sufficient RN core components

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Thin wrappers around React Native core components that add no behavior would grow the API without adding value.

## Decision

Axis does not wrap RN core components that are already sufficient. A component enters Axis only with behavior, accessibility, or composition semantics beyond the core.

## Rationale

Small honest surface; every export earns its place. Checked against VISION quality bar (no export-alone completeness).

## Status

Accepted. Applies to all future component slices per `docs/COMPONENT_CONTRACT.md` §1.
