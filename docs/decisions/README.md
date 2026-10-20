# Decisions

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: current. Date: 2026-10-16.

- Vision: [`../VISION.md`](../VISION.md). Component rules: [`../COMPONENT_CONTRACT.md`](../COMPONENT_CONTRACT.md). Parity: [`../BASE_UI_PARITY.md`](../BASE_UI_PARITY.md). Coverage: [`../COVERAGE.md`](../COVERAGE.md).
- Each file has context, decision, rationale, status, date.

| ADR | Decision |
| --- | --- |
| [001](001-base-ui-naming-and-parity.md) | Base UI naming and parity |
| [002](002-drawer-primary-name.md) | Drawer as the name (no alias) |
| [003](003-example-app-not-playground.md) | One runnable example app instead of a playground |
| [004](004-short-readme-plus-docs.md) | Short README plus docs |
| [005](005-first-release.md) | First release of `@xoroh/axis` (release discipline) |
| [006](006-scope-primitives-only.md) | Scope is primitives only; 21 design-pattern components leave Axis |
| [007](007-one-package-two-zones.md) | One package: universal models zone (+ `./models`) and native-only components zone |
| [008](008-no-web-components.md) | No web components (Base UI is the web layer) |
| [009](009-no-core-wrappers.md) | Axis does not wrap sufficient RN core components |
| [010](010-ai-chat-models.md) | AI chat behavior models live in Axis |
| [011](011-no-backward-compat.md) | No backward compatibility before the first public release (0.1.0 Preview) |
