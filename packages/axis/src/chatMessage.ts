/**
 * The message model — identity, role, and the accessible name.
 *
 * ## Why this is a primitive
 *
 * Every renderer draws the same distinction: the reader's own turns
 * (end-aligned bubble) versus everyone else's (full-width row), and a
 * screen reader must announce whose turn each one is. If the web side
 * labels "You" while native labels the raw user id, the same
 * conversation reads differently per renderer for the users who can
 * least afford the ambiguity.
 *
 * ## What is genuinely shared, and what is not
 *
 * The SHAPE and the NAME are shared: the role vocabulary, the message
 * identity, and the speaker label both renderers announce. The LAYOUT
 * is not — bubbles, rows, grouping, and markdown rendering are styled
 * composition in Kern (there is no markdown renderer here by design:
 * renderer/highlighter dependencies would break the token-free,
 * platform-neutral boundary). Message PARTS (text/image/reasoning/
 * tool-call part trees) are transport-owned and stay out: this model
 * names the turn, never its payload.
 */

/** Whose turn a message is. `tool` is a tool result rendered as a turn. */
export type ChatRole = "user" | "assistant" | "system" | "tool";

/** The identity of one conversation turn. Payload stays transport-owned. */
export type ChatMessage = {
  /** Stable turn identity, used as the list key. */
  id: string;
  role: ChatRole;
  /** Milliseconds since epoch; ordering aid only, never rendered here. */
  createdAt?: number;
};

/**
 * The announced speaker for a role: the explicit author name wins
 * (a named agent, a display name), else the role's plain-language
 * fallback. Never returns `""` — a renderer branching on the speaker
 * must always have an answer.
 */
export function resolveChatMessageSpeaker(options: {
  role: ChatRole;
  authorName?: string;
}): string {
  if (options.authorName?.trim()) return options.authorName.trim();
  switch (options.role) {
    case "user":
      return "You";
    case "assistant":
      return "Assistant";
    case "system":
      return "System";
    case "tool":
      return "Tool";
  }
}

/**
 * The accessible name for a turn: `Speaker: text`, or the bare
 * speaker when there is no plain-text preview (a turn carrying only
 * tool calls or attachments has nothing quotable — the speaker alone
 * is the honest label, never an empty string or a placeholder).
 */
export function resolveChatMessageLabel(options: {
  role: ChatRole;
  authorName?: string;
  text?: string;
}): string {
  const speaker = resolveChatMessageSpeaker(options);
  const text = options.text?.trim();
  return text ? `${speaker}: ${text}` : speaker;
}

/** Whether the turn is the reader's own (end-aligned bubble side). */
export function isUserMessage(message: Pick<ChatMessage, "role">): boolean {
  return message.role === "user";
}
