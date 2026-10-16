# Research: AI chat UI — Axis vs Kern placement

Date: 2026-10-16. Read-only research; no repo edits except this untracked report.
Scope: `axis` (unstyled RN primitives, Base UI counterpart, token-free, must never
depend on Kern) vs `kern` (multi-design-system platform, web + native, each design
system owns its components, M3 first, Kern consumes Axis).
Local sources: `axis/docs/COMPONENT_CONTRACT.md`, `axis/docs/BASE_UI_PARITY.md`,
`axis/AGENTS.md`, `kern/AGENTS.md`, `kern/packages/kern-cli/src/blocks.{ts,json}`,
`kern/packages/mcp/src/tools.ts`.

## 1. Sources (official docs + GitHub)

| Library | Docs | Source |
|---|---|---|
| Vercel AI Elements | https://elements.ai-sdk.dev (moving to shadcn; banner: deprecated end Nov 2026) | https://github.com/vercel/ai-elements |
| shadcn AI Elements (successor) | https://ui.shadcn.com/docs/ai-elements | https://github.com/shadcn-ui/ui |
| assistant-ui | https://www.assistant-ui.com ; primitives https://www.assistant-ui.com/docs/primitives ; virtualization https://www.assistant-ui.com/docs/guides/virtualization | https://github.com/assistant-ui/assistant-ui |
| prompt-kit | https://www.prompt-kit.com/ (e.g. `/docs/prompt-input`, `/docs/message`, `/docs/reasoning`, `/docs/tool`, `/docs/markdown`) | https://github.com/ibelick/prompt-kit |
| CopilotKit v2 | https://docs.copilotkit.ai/ (e.g. `/reference/v2/components/CopilotChat`) | https://github.com/CopilotKit/CopilotKit |
| Gifted Chat (RN) | README in repo; keyboard/maintain-scroll notes | https://github.com/FaridSafi/react-native-gifted-chat |
| Stream Chat RN | https://getstream.io/chat/docs/sdk/react-native/ ; message-list https://getstream.io/chat/docs/sdk/react-native/v6/ui-components/message-list/ ; message-input https://getstream.io/chat/docs/sdk/react-native/v6/ui-components/message-input/ ; keyboard https://getstream.io/chat/docs/sdk/react-native/v6/guides/keyboard/ | https://github.com/GetStream/stream-chat-react-native |
| ChatScope (web React) | https://chatscope.io/docs/ ; Storybook https://chatscope.io/storybook/react/ | https://github.com/chatscope/chat-ui-kit-react ; headless https://github.com/chatscope/use-chat |
| Base UI (web unstyled ref) | https://base-ui.com/react/components/collapsible ; https://base-ui.com/react/components/scroll-area ; https://base-ui.com/react/components/menu | https://github.com/mui/base-ui |
| Flagship UIs | Artifacts https://academy.claude.com/courses/claude-101/creating-with-artifacts ; voice https://help.openai.com/en/articles/20001274-chatgpt-voice ; bubble-vs-row critique https://www.xda-developers.com/chatgpt-claude-gemini-still-have-ui-flaw-not-easy-to-fix/ ; markdown-cost thread https://www.reddit.com/r/programming/comments/1s1i43t/chatgpt_claude_and_gemini_render_markdown_in_the/ | n/a (observed UIs) |

## 2. Findings — how leading libraries structure chat

### 2.1 Vercel AI Elements (styled shadcn/Tailwind copy-paste; no runtime package)

Install: `npx ai-elements@latest add <name>` or `npx shadcn@latest add
https://elements.ai-sdk.dev/api/registry/<name>.json` → owned code under
`@/components/ai-elements/`. Behavior is thin; styling baked in.
Key exports: `Conversation/*` (`ConversationContent`, `EmptyState`,
`ScrollButton`, `Download`) wrapping `@stick-to-bottom/react` — **no
virtualization**; `Message/MessageContent/MessageResponse` (Streamdown markdown,
GFM+math, `parseIncompleteMarkdown`); `MessageActions/MessageAction/MessageToolbar`
(hand-wired copy/retry/like); `MessageBranch*` (local `defaultBranch +
onBranchChange` tab state; docs note AI SDK has no built-in branching);
`PromptInput/*` (~25 parts incl. `Textarea`, `Submit`, `Select`, `ActionMenu`,
`usePromptInputAttachments`, `usePromptInputController`);
`Reasoning/ReasoningTrigger/ReasoningContent + useReasoning()` (auto-open while
streaming, duration display); `ChainOfThought` (discrete steps vs single stream);
`Tool/ToolHeader/ToolContent/ToolInput/ToolOutput` over `ToolUIPart
{type, state, input, output, errorText}` states
`input-streaming/input-available/output-available/output-error/approval-*`;
agentic `Task/Plan/Queue/Context/Checkpoint/Confirmation/Question`;
`Suggestion/Suggestions` (dumb buttons, caller calls `sendMessage`);
`Sources/SourcesTrigger/SourcesContent/Source` + `InlineCitation`;
`Attachments/Attachment/AttachmentPreview/AttachmentRemove/*` (`grid|inline|list`);
`CodeBlock(+Header/Title/Filename/CopyButton/...)` via Shiki (also used inside
`MessageResponse`); `ModelSelector` (a `PromptInputSelect` pattern);
`Shimmer/Loader`, voice (`MicSelector/SpeechInput/Transcription`),
`Canvas/Node/Edge` (React Flow).

### 2.2 assistant-ui (unstyled primitives + styled Elements — closest to Axis/Kern split)

Two layers: **Primitives** (unstyled, Radix-style `Root/Part + asChild`,
`AssistantRuntimeProvider` context) vs **Elements** (styled shadcn/Base-UI theme,
`npx assistant-ui init`). Primitives:
`ThreadPrimitive` (`Root, Viewport(+autoScroll, turnAnchor, scrollToBottomOn*)`,
`ViewportFooter`, `Messages, MessageByIndex, Row`, `ScrollToBottom, LoadEarlier,
Suggestions/SuggestionByIndex`); `ComposerPrimitive` (`Root=form`, `Input`
`submitMode: enter|ctrlEnter|none`, `Send/Cancel, AddAttachment, Attachments,
AttachmentDropzone, Dictate/StopDictation, Quote, TriggerPopover`);
`MessagePrimitive` (`Root, Parts/Content, GroupedParts(groupPartByType),
PartByIndex, Attachments, Error`) + `MessagePartPrimitive (Text, Image,
InProgress)` over `text|image|file|reasoning|source|tool-call|generative-ui|data`;
`ActionBarPrimitive` (`Copy/Reload/Edit/Speak/FeedbackPositive-Negative/
ExportMarkdown, autohide`); `BranchPickerPrimitive (Previous/Next, Number/Count,
hideWhenSingleBranch)`; `AttachmentPrimitive`, `SuggestionPrimitive`,
`ChainOfThoughtPrimitive` (legacy; now `GroupedParts` accordion),
`ThreadListPrimitive`, `AssistantModalPrimitive`. Runtime/tool system:
`useChatRuntime/useLocalRuntime/useExternalStoreRuntime/...`,
`makeAssistantToolUI({toolName, render})`, `Tools({toolkit, mcpApp})`,
`GenerativeUI` allowlist, `SuggestionAdapter`. Notable: virtualization is
explicit (`Row + Unstable_MessageById + unstable_useThreadMessageIds`,
`/docs/guides/virtualization`); auto-scroll pauses on scroll-up or open
`details/summary`, resumes via `ScrollToBottom`/new run; branching is
**runtime-native** (edit/regenerate creates branch); tool approval via
`addResult/resume/respondToApproval`; composer has no built-in model picker.

### 2.3 prompt-kit (small styled shadcn blocks; app wires AI SDK itself)

~19 blocks: `PromptInput(+Textarea/Actions/Action)` (`isLoading/value/onSubmit`,
autosize, Enter submits, `isLoading` swaps send→stop manually — no stop logic);
`Message(+Avatar/Content/Actions/Action)`; `ChatContainer`; `Markdown`
(`react-markdown`+`remark-gfm`, per-block memoization keyed `id={message.id}` so
only changed block re-renders per token); `CodeBlock` (+copy);
`Reasoning(+Trigger/Content)` (`isStreaming` auto-collapse); `ChainOfThought,
Steps, ThinkingBar, TextShimmer, Loader`; `Tool` (AI SDK v5 `toolPart`,
pending/running/completed/error); `Source` chip; `FileUpload, Image`;
`PromptSuggestion`; `ScrollButton, SystemMessage, FeedbackBar`. No model picker.

### 2.4 shadcn AI Elements (pattern library on base components; strongest AI SDK v5 conventions)

Patterns (~21) composed from base `Message, MessageScroller, Bubble, Attachment,
CodeBlock, Trace, Questionnaire, InputGroup`: `Chat` (thread list,
`MessageScroller` holds position while streaming); `Message` (user =
`Bubble align=end variant=muted`, agent = markdown + `MessageFooter` actions);
`PromptInput` (`sendMessage({text, files})`, `canSend` gate, Enter=send /
Shift+Enter=newline, submit/stop icon swap by `status`); `Reasoning,
ChainOfThought, Task, Plan, Queue` (all on `Trace`); `Tool` (maps
`input-streaming/input-available/output-available/output-error/output-denied/
approval-requested` to running/error, `addToolApprovalResponse`,
`sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`);
`Sources, InlineCitation`; `Suggestion`; `ModelSelector` (model + effort menus);
`Confirmation, Checkpoint, Context, Subagent, Terminal, FileTree, StackTrace,
TestResults`. Chatbot template: https://github.com/shadcn-ui/chatbot-template.

### 2.5 CopilotKit v2 (full agentic framework over AG-UI wire protocol)

`CopilotKit` provider; `CopilotChat` (high-level: `useAgent(agentId)` + greeting);
`CopilotChatView` (layout slots); `CopilotChatMessageView(+Cursor)` (>50-msg
virtualization, `transformMessages/groupMessages`, render-prop override);
`CopilotChatAssistantMessage/CopilotChatUserMessage` (assistant toolbar,
`toolbarVisible`, hidden while running); `CopilotChatInput(+AudioRecorder)`
(autogrow 5 rows, `value/onChange/onSubmitMessage/onStop`,
`isRunning` swaps send→stop, `toolsMenu` nested menu, `onAddFile`, voice
`mode=transcribe`); `CopilotPopup/CopilotSidebar/CopilotThreadsDrawer`;
`useAgent, useSuggestions/useConfigureSuggestions, useThreads`;
`useFrontendTool(s), useRenderTool, useHumanInTheLoop/useInterrupt,
useComponent`. No model picker (server-side). Styled but slot-overridable
(`Component | className(twMerge) | partial props` + render-prop children).

### 2.6 Gifted Chat (RN, maintenance mode; fork `kesha-antonov/react-native-chat` for streaming)

Single `<GiftedChat messages onSend user />`; `IMessage {_id, text, createdAt,
user, image, video, audio, system, quickReplies, reactions, replyMessage}`;
`render*` overrides: `renderMessage→Message→renderBubble+renderDay+renderAvatar+
renderSystemMessage`; `Bubble→renderMessageText/MessageImage/MessageVideo/
MessageAudio/renderCustomView/renderTime/renderUsername`;
`InputToolbar→renderComposer (TextInput, min/maxComposerHeight,
textInputProps)/renderSend/renderActions/renderAccessory`; `Day` (Day.js,
sticky-day animation), `Avatar`, `Actions/Send/SystemMessage`,
`LoadEarlier/QuickReplies(renderQuickReplies)/ScrollToBottom`,
emoji reactions, swipe-to-reply, `renderChatEmpty/renderChatFooter/renderLoading`.
List: **inverted `FlatList`** (`isInverted=true`, newest at index 0,
`maintainVisibleContentPosition + autoscrollToTopThreshold` for AI streaming
stability; header/footer swap meaning under inversion). Typing:
`isTyping + renderTypingIndicator + typingIndicatorStyle` (known Android freeze:
issue #2277). Keyboard: `react-native-keyboard-controller` `KeyboardProvider +
KeyboardAvoidingView (keyboardVerticalOffset)`.

### 2.7 Stream Chat RN (channel-scoped provider SDK)

`<OverlayProvider><Chat client><Channel channel><MessageList/><MessageInput/>`;
`MessageList` = inverted `FlatList` + `HeaderComponent/FooterComponent
(InlineLoadingMore*)`, `ScrollToBottomButton, TypingIndicator, DateHeader
(sticky)`, `threadList/onThreadSelect`, `noGroupByUser`; `MessageInput` =
`Input/AutoCompleteInput`, `InputButtons (AttachButton, CommandsButton,
MoreOptionsButton)`, `SendButton`, `ImageUploadPreview/FileUploadPreview
(imageUploads/fileUploads {id, file, state: uploading|finished|uploaded},
maxNumberOfFiles=10, asyncUploads)`, `InputReplyStateHeader/Reply
(quotedMessage)`, `InputEditingStateHeader`, `InputGiphySearch`,
autocomplete (`command|emoji|mention`), audio recording
(`AudioRecorder/.../Waveform`), `ShowThreadMessageInChannelButton`.

### 2.8 ChatScope (web-only declarative kit; RN not supported)

`MainContainer(responsive)` > `ChatContainer` (only
`ConversationHeader|MessageList|MessageInput|InputToolbox`) >
`MessageList(typingIndicator, loading)` > `Message model={{message, sentTime,
sender, direction: incoming|outgoing, position: single|first|normal|last}}
(+Avatar, MessageHeader/Footer)`; `MessageInput(placeholder, attachButton,
sendButton, onSend)`; `TypingIndicator`; `ConversationHeader.Back/Content/Actions`;
plus `ConversationList/Conversation/Search/Sidebar, MessageSeparator, Loader,
Status`. Logic via `@chatscope/use-chat`. Non-inverted web scroll + CSS themes.

### 2.9 Flagship UIs (ChatGPT / Claude / Gemini — converged pattern)

Full-width assistant rows + right-aligned user bubble (break from
bubble-both-sides); centered ~768px column; avatars mostly removed. Token
streaming into markdown with blinking cursor; **Stop replaces Send**
mid-generation. Full markdown/GFM/code-with-Copy/LaTeX. Collapsible
"Thought for Xs / Show thinking" chevron above answer. Tool/web-search progress
rows, citation chips/footnotes, Claude Artifacts side panel (editable docs/code/
apps in place). Paperclip composer (camera/gallery/files) with upload progress;
mic → dictation vs full-duplex voice overlay; model picker + tools menu in
composer. Empty state: centered logo + 3–4 starter cards; follow-up chips.
Feedback row per assistant message: copy / like-dislike / regenerate / share +
model label + timestamp. Branching: edit user message → edit-and-resubmit
creates branch (ChatGPT currently only latest pair editable). Mobile: KB-avoiding
+ safe-area, multiline composer grows to max-height then scrolls, send-on-return
vs newline, `keyboardVerticalOffset = headerHeight`.

## 3. Part inventory → placement (Axis primitive / Kern styled / both)

Decision rule (from contract §11 + AGENTS scope): Axis owns **platform-neutral
behavior models + unstyled RN structure/a11y** (token-free, no Kern import,
`render`-composition + function-`style(state)` instead of `data-*` per D1);
Kern owns **all visual design** (per-DS: M3 first) and **composed screens/blocks**.
"Both" = Axis behavior + Kern styled consumer (the normal pattern).
Web column "Base UI equiv." = what a Base UI-idiomatic web implementation would
wrap; Base UI has **no chat primitives**, so chat introduces new API surface on
both platforms (Axis defines the contract; Kern web mirrors prop names).

| # | Part | Web: Base UI equiv. (none exists → new) | Native: Axis (unstyled behavior) | Kern styled (per-DS, M3 first) | Verdict |
|---|---|---|---|---|---|
| 1 | Message list + virtualization | New pattern over Base UI `ScrollArea` (scroll container only); virtualization = caller/`MessageScroller`-style (shadcn) or `Row`-virtualization (assistant-ui) | **Axis: stick-to-bottom model only** (plain-rect math like `positioning` precedent; `autoScroll` pause-on-scroll-up/resume, `ScrollToBottom` visibility state). **No virtualization in Axis** — RN `FlatList` inversion/windowing stays caller-measured per contract §4 | Kern `MessageList` (web + `kern-native` FlatList-based, inverted on RN like Gifted/Stream) + `ScrollToBottomButton`, `DateHeader`, `LoadEarlier` | **Both** (Axis model, Kern styled list) |
| 2 | Auto-scroll / stick-to-bottom | `useStickToBottom`-style hook (Elements wraps `@stick-to-bottom/react`) | Axis `useStickToBottom` model (no DOM/RN imports; refs+rects in, callbacks out) | Kern wires it into `MessageList`; `ConversationScrollButton` equivalent | **Both** |
| 3 | Message bubble / row | New (`Bubble`-equivalent; flagship = full-width assistant row, user bubble end-aligned) | Axis `Message` structure + roles/a11y only (role/state/label per §5) | Kern `MessageBubble`/`MessageRow` per DS (M3 shapes/type), avatar/day/grouping style | **Both** |
| 4 | Streaming text (+ cursor) | Caller stream (`useChat`-style `status: submitted\|streaming\|ready\|error`); `InProgress`/cursor slot | Axis: **status model only** (`idle|submitted|streaming|error`, `isStreaming` flag driving auto-open/cancel) — never the transport | Kern `StreamingText`/`Shimmer` placeholder + cursor style | **Both** (model vs styled) |
| 5 | Markdown + code blocks | Streamdown/`react-markdown`+GFM routed to `CodeBlock` (Shiki, copy, line numbers) | **Not in Axis** — renderer/highlighter deps violate token-free/platform-neutral boundary; Axis exposes `render`-slot + plain-text fallback | Kern `MarkdownText` + `CodeBlock` (web: Streamdown/Shiki; native: `react-native-markdown-display`-class lib, TBD) per DS | **Kern only** |
| 6 | Reasoning / thinking disclosure | Base UI `Collapsible` composition (`ReasoningTrigger/Content`, auto-open while streaming + duration) | Axis: reuse existing `Collapsible` behavior (no new primitive if sufficient); only add `isStreaming`-auto-open state helper if `Collapsible` can't express it | Kern `ReasoningCard`/`ChainOfThought` styled (chevron, "Thought for Xs") | **Both** (Axis `Collapsible` + Kern styled) |
| 7 | Tool-call cards (+ approval/HITL) | `Trace`-style collapsible (`ToolHeader/Content/Input/Output`, states `input-streaming/available/output-available/error/approval-*`) | Axis `ToolCall` state model (`state`, `input`, `output`, `errorText`, approve/deny callbacks — no UI) | Kern `ToolCard`/`Confirmation`/`Checkpoint` styled per DS | **Both** |
| 8 | Sources / citations | `SourcesTrigger(count)/SourcesContent/Source(href)` + `InlineCitation` | Axis: minimal `Source` data shape + list behavior (nothing visual) | Kern `SourceCard`/`CitationChip` styled | **Both** (thin) — or Kern-only if shape stays ` {href,title}` trivial |
| 9 | Attachments (pick/preview/progress) | Hidden file input + `Attachment size=sm` chips, drag-drop/paste, `maxFiles/maxFileSize/onError` | Axis `useAttachments` model (`{id, name, size, type, uri, state: uploading\|finished\|uploaded}`, add/remove/clear, limits validation) — mirrors Stream's upload-state shape | Kern `AttachmentChip/AttachmentPreview` + picker bar styled; native image-picker wiring in Kern | **Both** |
| 10 | Prompt input (multiline, submit/stop, attach, model picker) | `PromptInputTextarea` (autosize, Enter=submit/Shift+Enter=newline) + `Submit(status)` + `Select` model picker + `ActionMenu` | Axis `usePromptInput` model (value, `canSend`, `submitMode: enter\|ctrlEnter\|none`, `cancelOnEscape`, multiline height state) + a11y roles | Kern `PromptInput` styled per DS (M3 text-field + send/stop swap, `ModelSelector`, `ToolsMenu`, mic) for web + native | **Both** (biggest Axis+Kern pair) |
| 11 | Suggestions / starter cards | Dumb buttons (`onClick(suggestion)` → caller `sendMessage`); static vs `SuggestionAdapter` dynamic | Axis: `Suggestion` list state (selected/clear) — or fold into `Menu`/`ListItem` selection model; no new primitive if covered | Kern `SuggestionChip/SuggestionRow` + empty-state block ("3–4 starter cards") | **Mostly Kern**; Axis only if selection model gap proven |
| 12 | Typing indicator | `Spinner/Shimmer` while `status==="submitted"`; `InProgress` part | Axis: derive from streaming-status model (§4 row); `announce*` only if contract §5 section requires it | Kern `TypingIndicator` (three-dot, per-DS motion) | **Kern only** (state from Axis model) |
| 13 | Feedback actions (copy/like/retry/share) | Hand-wired `MessageAction onClick` (`regenerate()`, clipboard); `FeedbackPositive/Negative (data-submitted)` | Axis: `composeEventHandlers` composition only (existing `slot` model) — no feedback primitive | Kern `MessageActions`/`FeedbackBar` styled (copy/like-dislike/regenerate/share) | **Kern only** |
| 14 | Branching (edit-and-retry pager) | Local `defaultBranch+onBranchChange` (Elements) vs runtime-native (assistant-ui `BranchPicker Previous/Next/Number/Count`) | Axis `useBranch` index model (`count/index/previous/next`, `hideWhenSingleBranch`) — pure state, matches `selection`-model precedent | Kern `BranchPicker` styled pager per DS | **Both** |
| 15 | Mobile keyboard handling | n/a (web) | **Not a component**: `KeyboardAvoidingView` + `keyboardVerticalOffset = headerHeight` + safe-area stays caller composition (contract §4: measurement per-consumer); Axis documents the pattern in the prompt-input doc | Kern `ChatScreen` block wires `react-native-keyboard-controller`-class KB provider + safe-area in example/block code | **Doc + Kern block** (no Axis API) |
| 16 | Full chat screen / thread (composition) | `Chat/CopilotChatView/ChatContainer` equivalents | **Never in Axis** (contract non-goals: no screens) | Kern **block** `chat-screen` (`kern add chat-screen`): `MessageList + PromptInput + Suggestions + BranchPicker` per DS, web + native variants | **Kern block only** |

Cross-cutting: model picker = Kern `Select` composition (Axis `Select` behavior +
Kern M3 menu styling); voice/dictation = Kern-only (native audio + Web Speech
have no platform-neutral model yet — open question Q3); threads/history drawer =
Kern block only (persistence is app state, cf. CopilotKit `useThreads`).

## 4. Fit with Kern's AI-first tooling (MCP / CLI / blocks)

- **CLI (`packages/kern-cli/src/blocks.ts`, `blocks.json`)**: chat lands as
  **blocks, not components** — `chat-screen` (full thread + composer),
  `prompt-input` (composer with model picker/tools menu), `message-list`
  (streaming list + scroll button), each with `registryDependencies` on the
  styled parts it composes (e.g. `Card, Field, Input, Menu, Collapsible,
  Progress`) and `dependencies` declaring the stream/markdown libs the app must
  bring (Streamdown/Shiki web; markdown RN lib). Follows the existing
  `settings-screen`/`auth-form`/`empty-search` block shape (root + siblings, no
  relative imports, manifest is the contract).
- **MCP (`packages/mcp/src/tools.ts`, `manifest.ts`)**: no new tools required
  for v1 — existing component-source readers already serve any new Kern files
  once they ship. Consider (non-breaking, additive): a `get_block <name>`
  reader mirroring component reads, and token/bundle entries so agents discover
  `chat-screen` styling tokens. Do not put Axis behavior-model docs behind MCP
  component reads — agents need both `axis` docs and `kern` sources; note the
  cross-repo pointer in the block's doc header.
- **Docs site (`apps/site`, llms.txt/per-page `.md`, MCP `index.json`)**: each
  chat part needs the standard page (purpose, install, example, prop table,
  a11y) per Axis contract §9 / Kern docs skill, so the agent loop (`llms.txt` →
  page `.md` → `kern add`) works for chat on day one. Streaming/approval flows
  need tested fixtures, never untested copy-paste.
- ** axis boundary reminder**: Kern consumes Axis (`import { useStickToBottom,
  usePromptInput, useAttachments, useBranch } from "@xoroh/axis"`-style models);
  Axis must never import Kern, tokens, or `--*` CSS (boundary gate
  `check-boundary.mjs`).

## 5. Migration steps (no breaking change without deprecation)

No chat code ships in either repo today (verified: `axis/src/components/` has
~50 primitives, none chat; Kern has no `chat-*` component or block), so this is
greenfield — the only "migration" risk is **future renames**. Rules per Axis
contract §10 + `BASE_UI_PARITY.md` alignment practice:

1. Land Axis models first (minor changeset each: `useStickToBottom`,
   `usePromptInput`, `useAttachments`, `useBranch`, `ToolCall` state), each with
   unit tests + parity row (Base UI equiv. or "no Base UI counterpart — new
   surface, rationale: chat").
2. Land Kern styled parts per DS (M3 first) consuming the Axis models; web and
   native in the same slice where the API is shared, `*.rntest.tsx` for native
   behavior (public-entry imports only, §8).
3. Add `chat-screen` / `prompt-input` blocks via `kern add` with manifest rows +
   `check-blocks` agreement; publish docs pages + MCP registry entries.
4. If any shipped name later needs to change: one minor release with runtime
   warning + docs note before removal (contract §10); single-part concise APIs
   stay alongside compound `Root/Trigger/Content`-style anatomy pre-1.0 (the
   Dialog/Menu precedent — never remove the concise form to add the compound
   one).
5. `D-DEVICE` gate: no physical-device claims until executed; label
   emulator-independent suites as such (contract §8).

## 6. Open questions

1. **Markdown/code renderer choice (esp. native)**: web is settled
   (Streamdown + Shiki per Elements/shadcn); RN needs evaluation
   (`react-native-markdown-display` vs alternatives) for streaming perf
   (per-block memoization like prompt-kit `id={message.id}`), GFM/tables/LaTeX
   coverage, and M3 styling hooks. Blocks native code choice.
2. **Virtualization strategy on RN**: inverted-`FlatList` (Gifted/Stream) vs
   FlashList; `maintainVisibleContentPosition`-equivalent props and the Android
   typing-indicator freeze (Gifted #2277) need a device-verified spike before
   `MessageList` API freezes.
3. **Voice/dictation**: CopilotKit/Elements ship mic→transcription + overlays;
   no platform-neutral model exists (Web Speech vs native audio). Kern-only
   styled wrappers for v1, or defer entirely?
4. **Tool-approval runtime**: Elements maps states presentationally while
   assistant-ui/CopilotKit own registries + HITL pause/resume. Does Kern need a
   `useToolApproval` runtime, or is presentational `ToolCard` + app-wired
   callbacks enough for M3 v1?
5. **Branching depth**: local pager state (Elements, cheap) vs runtime-native
   branches with message-tree persistence (assistant-ui/CopilotKit). v1 = local
   `useBranch` pager; confirm no consumer needs persisted trees yet.
6. **Model picker ownership**: Axis `Select` behavior already exists — confirm
   no chat-specific select semantics (effort menus, icons) force a new Axis
   part vs pure Kern composition.
7. **Suggestions dynamism**: static starter cards (Kern block, trivial) vs
   `SuggestionAdapter`-style dynamic follow-ups — needs a runtime owner if
   dynamic; otherwise Kern-only dumb chips.
8. **Streaming transport**: out of scope for both repos (app brings AI SDK /
   AG-UI / Stream client), but the `status` vocabulary (`submitted|streaming|
   ready|error` vs `uploading|finished|uploaded`) should be aligned once across
   the Axis models — confirm in design review before first slice lands.
