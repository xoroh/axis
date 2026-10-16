# 001. Base UI naming and parity

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Axis needs one naming authority so native components stay substitutable with web Base UI patterns.

## Decision

Axis mirrors Base UI as closely as React Native allows: same component names, compound part structure, prop names and semantics, controlled + uncontrolled patterns, `render`-style composition. Every intentional deviation is documented with its native reason.

## Rationale

One vocabulary across foundations; native constraints (no `data-*`, RN `Modal` portal, accessibility-focus over DOM traps) are explicit instead of silent. Checked against VISION principles 1–2.

## Status

Accepted. Record: `docs/COMPONENT_CONTRACT.md` §11, `docs/BASE_UI_PARITY.md`.
