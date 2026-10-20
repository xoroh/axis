# 010. AI chat behavior models live in Axis

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: accepted. Date: 2026-10-16.

## Context

AI chat UI needs a home: unstyled conversation behavior versus styled chat components.

## Decision

AI chat behavior models (thread/composer/message/tool flows as neutral state models with native bindings) live in Axis. Styled chat parts and blocks live in host design systems.

## Rationale

Behavior in Axis, styling in hosts — the same split as every other family. Checked against VISION principle 5.

## Status

Accepted. Models built (status, stick-to-bottom, message, tool call, attachments, prompt input, branch, source; see `docs/AI_CHAT_MODELS.md`). Styled side is per-design-system composition, out of Axis scope.
