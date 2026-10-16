/**
 * The shared generation-status vocabulary for every chat model.
 *
 * ## Why this is a primitive
 *
 * The composer (send/stop swap), the message list (streaming cursor),
 * reasoning disclosure (auto-open while streaming), and tool cards
 * (running vs settled) all branch on the same question: what is the
 * run doing right now. Four independent spellings of that answer is
 * how a composer offers Send mid-generation on one renderer and Stop
 * on the other.
 *
 * ## What is genuinely shared, and what is not
 *
 * The VOCABULARY is shared: one `ChatStatus` every model reads, so
 * `usePromptInput`'s send gate and `resolveReasoningOpen`'s auto-open
 * can never disagree about what "streaming" means. The TRANSPORT is
 * not — the app brings its own AI SDK / AG-UI / channel client and
 * maps its status onto this type at the edge. Attachment upload
 * states (`uploading | finished | uploaded`) stay separate on purpose:
 * they describe file transfer, not generation, and conflating the two
 * would gate sending on uploads the transport may handle inline.
 */

/**
 * Where the current run stands. `idle` is the rest state (composer
 * accepts input); `submitted` is waiting on the transport before the
 * first token; `streaming` is tokens flowing; `error` is a failed run
 * the caller may retry from.
 */
export type ChatStatus = "idle" | "submitted" | "streaming" | "error";

/** A run is in flight: the composer must offer Stop, never Send. */
export function isChatBusy(status: ChatStatus): boolean {
  return status === "submitted" || status === "streaming";
}

/** Tokens are flowing now: stream cursors show, reasoning auto-opens. */
export function isChatStreaming(status: ChatStatus): boolean {
  return status === "streaming";
}

/** The last run failed: the composer may offer retry. */
export function isChatError(status: ChatStatus): boolean {
  return status === "error";
}
