---
"@xoroh/axis": minor
---

AI chat behavior models (ADR 010): `chatStatus` (shared generation vocabulary), `useStickToBottom`, `chatMessage`, `useToolCall`, `useAttachments`, `usePromptInput`, `useBranch`, `chatSource`, plus `resolveReasoningOpen` over the existing `Collapsible` (no new reasoning primitive). Platform-neutral models-zone exports with unit tests, contract in `docs/AI_CHAT_MODELS.md`, parity recorded as new surface (no Base UI counterpart). Styled chat parts live in Kern. Not published.
