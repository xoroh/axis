# AI chat behavior models

Status: current. Date: 2026-10-16. Placement: ADR
[010](decisions/010-ai-chat-models.md) — behavior in Axis, styling in
Kern. Research: `.reports/research-ai-chat-ui.md`.

AI chat state that is identical on every renderer lives here as
platform-neutral behavior models (`@xoroh/axis` and
`@xoroh/axis/models` — no `react-native` in the transitive closure,
boundary-gated). Styled chat parts (`MessageBubble`, `PromptInput`,
`ToolCard`, `BranchPicker`, …) and composed screens (`chat-screen`
block) live in Kern design systems and consume these models.

Base UI has **no chat primitives**, so this family introduces new
API surface on both platforms. There is nothing to mirror and
therefore no parity table: the contract below IS the cross-platform
agreement, and Kern web mirrors these prop names.

## Shared status vocabulary (`chatStatus`)

Source of truth: `ChatStatus`, `isChatBusy`, `isChatStreaming`,
`isChatError` in `@xoroh/axis`.

One generation status every model reads: `idle` (rest — the
composer accepts input) · `submitted` (waiting on the transport
before the first token) · `streaming` (tokens flowing) ·
`error` (failed run — retry reuses the draft). `isChatBusy`
(`submitted | streaming`) drives the composer's Send→Stop swap;
`isChatStreaming` drives stream cursors and reasoning auto-open.
The transport is never owned here: the app maps its own client
status onto `ChatStatus` at the edge.

Attachment transfer phases (`uploading | finished | uploaded`)
stay separate on purpose: they describe file transfer, not
generation, and gating send on uploads the transport may handle
inline would conflate the two.

## Stick-to-bottom (`stickToBottom`)

Source of truth: `StickToBottomMetrics`, `isAtBottom`,
`resolveScrollButtonVisible`, `useStickToBottom` in `@xoroh/axis`.

Auto-scroll that pauses when the reader scrolls up and resumes at
the bottom, over plain rect numbers (`contentHeight`,
`viewportHeight`, `scrollOffset` — the `positioning` precedent:
the renderer measures, this decides). `isAtBottom` pins within a
`24` threshold (default — sub-line fractional drift must not
unpin); short content counts as pinned. The hook owns the `stuck`
bit (controlled or uncontrolled):

- `handleScroll(metrics)` — the reader moved: stuck follows
  `isAtBottom`, so scrolling up pauses and reaching the bottom
  resumes.
- `handleContentChange(metrics)` — new content arrived: returns
  whether the caller scrolls to the newest edge now (true only
  while stuck — a paused reader is never yanked).
- `scrollToBottom()` — the scroll-button press re-pins; the caller
  performs the scroll and feeds the result back through
  `handleScroll`.
- `showScrollButton(metrics)` — visible only when unpinned AND the
  content overflows (a short list never shows the button).

No virtualization here: RN `FlatList` inversion/windowing stays
caller-measured per contract §4.

## Message (`chatMessage`)

Source of truth: `ChatRole`, `ChatMessage`,
`resolveChatMessageSpeaker`, `resolveChatMessageLabel`,
`isUserMessage` in `@xoroh/axis`.

Turn identity plus the announced name — structure and roles only,
never layout. Roles: `user | assistant | system | tool`.
`resolveChatMessageSpeaker` prefers the explicit author name and
falls back to plain language (`You`, `Assistant`, `System`,
`Tool`) — never empty. `resolveChatMessageLabel` reads
`Speaker: text`, or the bare speaker for content-free turns (tool
calls, attachments) rather than a placeholder. `isUserMessage`
marks the reader's own turns (end-aligned bubble side). Message
PARTS (text/image/reasoning/tool-call trees) and markdown
rendering stay transport- and Kern-owned: this model names the
turn, never its payload.

## Tool call (`toolCall`)

Source of truth: `ToolCallState`, `isToolCallRunning`,
`isToolCallComplete`, `isToolCallError`, `isToolCallApproval`,
`resolveToolCallLabel`, `useToolCall` in `@xoroh/axis`.

One call's lifecycle in the AI SDK v5 `ToolUIPart` vocabulary:
`input-streaming | input-available | output-available |
output-error | output-denied | approval-requested`. Running =
arguments flowing or queued; complete = output or denial; error =
failed (`errorText` announced in the label, never a bare
"error"); approval = the run is paused on the human and the card
must offer Approve/Deny. The hook owns the state (controlled or
uncontrolled): `approve` resumes (`approval-requested` →
`input-available`), `deny` settles (`approval-requested` →
`output-denied`); from any other state both are terminal no-ops —
no transitions, no callbacks. Which tools exist and how they
execute is app state; this tracks one call the transport owns.

## Attachments (`attachments`)

Source of truth: `AttachmentState`, `ChatAttachment`,
`AttachmentLimits`, `AttachmentError`, `validateAttachment`,
`updateAttachment`, `useAttachments` in `@xoroh/axis`.

The composer file list: `{id, name, size?, mimeType?, uri?,
state}` with transfer phases `uploading | finished | uploaded`
(the channel-SDK shape). Limits (`maxFiles`, `maxFileSize`)
validate before entry: refused candidates report a typed error
(`duplicate | too-large | too-many`) through `onError` and never
enter the list. The hook
offers `add` / `addMany` (one state write per multi-file pick —
per-file writes would close over the same pre-pick list and keep
only the last file) / `update` (the app marks transfer progress)
/ `remove` / `clear`, controlled or uncontrolled. Picking,
drag-drop, paste, and the async transfer are platform code the app
owns; chips, previews, and progress bars are Kern composition.

## Prompt input (`promptInput`)

Source of truth: `PromptInputSubmitMode`, `resolveCanSend`,
`shouldSubmitOnKey`, `shouldCancelOnEscapeKey`,
`resolveComposerHeight`, `usePromptInput` in `@xoroh/axis`.

The composer draft protocol. `resolveCanSend`: non-blank text, no
run in flight (a busy composer offers Stop instead), within
`maxLength` when set — an `error` status sends, since retry reuses
the draft. `shouldSubmitOnKey`: plain Enter submits in `enter`
mode (Shift+Enter keeps the newline); `ctrlEnter` needs Ctrl or
Cmd; `none` submits from the Send affordance only. Key names are
plain strings each renderer maps its own events onto.
`resolveComposerHeight` clamps line counts to `minLines..maxLines`
(default `1..5`) times the caller-measured `lineHeight`. The hook
owns the draft (controlled or uncontrolled): `submit` reports
through `onSubmit` only when sendable and never clears — by
decision the caller clears after handing the draft to its
transport (`onSubmit={(text) => { send(text); clear(); }}`), so
the clear visibly follows the send on every renderer and
controlled drafts behave exactly like uncontrolled ones.
`handleKey`
commits or Escape-clears (opt-in `cancelOnEscape`) and reports
whether it consumed the event.

## Branch (`chatBranch`)

Source of truth: `normalizeBranchIndex`, `nextBranchIndex`,
`previousBranchIndex`, `shouldHideBranchPicker`, `useBranch` in
`@xoroh/axis`.

The edit-and-retry pager over `count` answer variants (the
`selection`-model precedent: pure transitions plus a
controlled/uncontrolled hook). Steps stop at both ends — Next on
the last and Previous on the first are no-ops; `goTo` clamps; `count` shrinkage normalises immediately to the last
remaining variant, so the pager never points past its own list.
The pager hides for single-branch turns by default
(`hideWhenSingleBranch`). Persisted message trees stay
transport-owned — this is the local pager, the cheap v1, until a
consumer proves it needs more.

## Source (`chatSource`)

Source of truth: `ChatSource`, `normalizeChatSources`,
`resolveChatSourceLabel` in `@xoroh/axis`.

Cited references, deliberately thin: `{href, title?}` plus list
hygiene — trim, drop empty hrefs, first-wins dedupe by `href`
(the earliest citation keeps its position and title). The label
prefers the title, else the href — never empty, so a screen
reader never meets a silent chip. Fetching, opening, previewing,
chips, and cards are app and Kern code.

## Reasoning (reuses `Collapsible` — no new primitive)

Source of truth: `resolveReasoningOpen` in `@xoroh/axis`;
`Collapsible` in `@xoroh/axis`.

A reasoning block is a disclosure unit, which is exactly what
`Collapsible` already is — adding a primitive would duplicate it
to own a single conditional. The only chat-specific behavior is
WHEN it opens: `resolveReasoningOpen(open, status)` auto-opens
while `streaming` and follows the caller's `open` once settled
(`undefined` reads closed, the `Collapsible` default). Kern wires
`open={resolveReasoningOpen(callerOpen, status)}` with the toggle
feeding back through `onOpenChange`.

## What stays out (by design)

- Streaming transport (app brings its AI SDK / AG-UI / channel
  client).
- Markdown and code rendering (renderer/highlighter dependencies
  would break the token-free boundary) — Kern `MarkdownText` /
  `CodeBlock` with a `render`-slot and plain-text fallback.
- Virtualization (caller-measured `FlatList` work, contract §4).
- Keyboard avoidance and safe-area (caller composition; the
  prompt-input doc records the pattern, no Axis API).
- Full chat screens (contract non-goal) — Kern `chat-screen`
  block composes these models per design system.
- Voice/dictation and threads/history (no platform-neutral model
  yet; Kern-only or deferred per the research open questions).
