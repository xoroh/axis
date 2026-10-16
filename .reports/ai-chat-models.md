# Report — AI chat behavior models (Axis)

Date: 2026-10-16. Branch: `feat/axis-ai-chat-models` in worktree
`/tmp/opencode/axis-ai-chat` (main checkout untouched). One PR,
no merge (Axis Lead merges). No publish/deploy. No aliases, shims,
or deprecations anywhere (greenfield per ADR 011).

## What landed

Nine models-zone modules (`packages/axis/src/*.ts`, pure
TypeScript/React, zero `react-native` — boundary-gated), exported
identically from `.` and `./models` per the models-parity gate:

- `chatStatus` — shared vocabulary `idle | submitted | streaming |
  error` + `isChatBusy / isChatStreaming / isChatError` (research
  row 4 verbatim; Q8 answered: generation status shared,
  attachment transfer phases stay separate, recorded in-doc).
- `stickToBottom` — `isAtBottom` (24dp default threshold),
  `resolveScrollButtonVisible`, `useStickToBottom`
  (pause-on-scroll-up, resume-at-bottom, content-growth
  auto-scroll only while stuck). No virtualization (contract §4).
- `chatMessage` — `ChatRole`, `ChatMessage`, speaker/label
  resolvers (never empty), `isUserMessage`. No parts, no markdown.
- `toolCall` — AI SDK v5 states + running/complete/error/
  approval predicates + label, `useToolCall` with approve→resume /
  deny→settle and terminal no-ops elsewhere.
- `attachments` — `{id, name, size?, mimeType?, uri?, state}`,
  `validateAttachment` (duplicate → too-large → too-many),
  `useAttachments` with `addMany` single-write multi-pick.
- `promptInput` — `resolveCanSend` (busy blocks, error retries),
  `shouldSubmitOnKey` (enter / ctrlEnter / none), Escape opt-in,
  clamped composer height, `usePromptInput` (submit reports,
  never clears — caller clears post-send).
- `chatBranch` — `useBranch` pager with wrap-around, clamp,
  shrink-normalise, `hideWhenSingleBranch` (selection precedent).
- `chatSource` — `{href, title?}` + trim/drop/dedupe + label.
- `reasoning` — `resolveReasoningOpen` over the existing
  `Collapsible` only (streaming auto-opens, else caller state).
  No new primitive, per research row 6.

Docs: `docs/AI_CHAT_MODELS.md` (contract), parity section in
`docs/BASE_UI_PARITY.md` (new surface, no Base UI counterpart),
behavior-models paragraph in `docs/COVERAGE.md`, changeset
`axis-ai-chat-models.md` (minor). Follows VISION (neutral
behavior, Kern styles) and ADRs 006/007/010/011.

## Validation (full CI battery, all green)

`bun run test` 2 pass · vitest 24 files / 228 pass ·
jest-RN 48 suites / 337 pass · typecheck clean · boundary +
policy tests (26) clean · check:readme clean · build clean ·
check:publish clean · lint clean (1 warning pre-existing on main).

## Notes for review

1. Branch pager wraps rather than clamps (toggle-equivalent at
   count 2, cycling above) — flagged as the one judgment call;
   easy to flip if Lead prefers clamp.
2. `usePromptInput.submit` deliberately never clears the draft;
   docs show the `onSubmit → send → clear` wiring.
3. Token budget: fine — no truncation; everything above is
   implemented, tested, and documented.
