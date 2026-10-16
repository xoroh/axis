# 008. No web components

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

Axis mirrors Base UI for native; owning web renderers would duplicate Base UI plus Kern web.

## Decision

Axis ships no web components. Base UI is the web layer; Axis is native-only.

## Rationale

One foundation per platform, no parallel web stack to maintain. Checked against VISION non-goals.

## Status

Accepted. Web needs stay in `xoroh/kern` (`@xoroh/kern` on Base UI).
