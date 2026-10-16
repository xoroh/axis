# 004. Short README plus docs

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Root README risked duplicating the contract, parity, and coverage docs.

## Decision

Keep a short root README (scope, install, usage) plus `docs/` for the contract, parity, coverage, compatibility, per-component notes, and releasing.

## Rationale

One place per fact; README points, `docs/` states. Checked against VISION quality bar (docs build from a clean clone).

## Status

Accepted. Record: `README.md` Docs section; `docs/` inventory.
