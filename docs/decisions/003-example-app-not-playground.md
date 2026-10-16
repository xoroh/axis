# 003. One runnable example app instead of a playground

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Contributors need a runnable host to prove native behavior; a full playground/website is a second product.

## Decision

Ship one runnable example app (`apps/*` example) instead of a playground. Website/playground stays deferred and must not gate primitives work.

## Rationale

Proves Expo-host behavior with minimum surface; keeps docs neutral. Checked against VISION non-goals.

## Status

Accepted. Record: `apps/` layout in `README.md`; Kern roadmap Phase 2–3 (Expo 57 host proof).
