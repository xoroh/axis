/**
 * The reasoning helper — streaming auto-open over the existing
 * `Collapsible`.
 *
 * ## Why this reuses Collapsible instead of adding a primitive
 *
 * A reasoning block is a disclosure unit: a trigger ("Thought for
 * 4s") with a panel (the thinking stream) that mounts while open.
 * That is exactly what `Collapsible` already is — same boolean
 * domain, same mount-on-open presence, same button-with-expanded
 * trigger. The only chat-specific behavior is WHEN it opens: live
 * thinking auto-opens while streaming and returns to caller control
 * once settled. A one-line resolver expresses that; a new primitive
 * would duplicate `Collapsible` to own a single conditional.
 *
 * ## How Kern wires it
 *
 * `open={resolveReasoningOpen(callerOpen, status)}` on the
 * `Collapsible`, with the caller's toggle feeding back through
 * `onOpenChange`. No hook, no component, no state here — the open
 * bit stays where `Collapsible` already keeps it.
 */

import type { ChatStatus } from "./chatStatus";

/**
 * Whether the reasoning disclosure reads open: streaming thinking
 * auto-opens (the reader watches the thought form); settled thinking
 * follows the caller's `open` (`undefined` reads closed — an
 * uncontrolled disclosure starts collapsed, the `Collapsible`
 * default).
 */
export function resolveReasoningOpen(
  open: boolean | undefined,
  status: ChatStatus,
): boolean {
  if (status === "streaming") return true;
  return open ?? false;
}
