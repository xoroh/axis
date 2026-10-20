/**
 * The tool-call model — run state plus the human-approval handshake.
 *
 * ## Why this is a primitive
 *
 * Tool progress rows on both renderers branch on the same question:
 * is this call still running, did it settle, did it fail, or is it
 * waiting on the human. Two spellings of "waiting on the human" is
 * how one renderer shows an Approve/Deny row while the other shows a
 * spinner — the approval a safety review demanded, silently missing
 * on one platform.
 *
 * ## What is genuinely shared, and what is not
 *
 * The STATE MACHINE is shared: the AI SDK v5 `ToolUIPart` vocabulary
 * (`input-streaming`, `input-available`, `output-available`,
 * `output-error`, `output-denied`, `approval-requested`), the
 * running/error/approval predicates every card reads, and the
 * approve/deny transitions (approve resumes the run, deny settles it
 * as denied). The REGISTRY is not — which tools exist and how they
 * execute is app state; this model tracks one call the transport
 * owns, never the catalogue. Rendering (header/content/input/output
 * cards) is styled composition in the host design system.
 */

import { useCallback } from "react";
import { useControllableState } from "./useControllableState";

/**
 * One tool call's lifecycle, mirroring the AI SDK v5 `ToolUIPart`
 * states: arguments still streaming in, arguments complete and queued,
 * output produced, output failed, denied by the human, or paused for
 * an approval decision.
 */
export type ToolCallState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error"
  | "output-denied"
  | "approval-requested";

/** Arguments flowing or queued: progress UI shows, no result yet. */
export function isToolCallRunning(state: ToolCallState): boolean {
  return state === "input-streaming" || state === "input-available";
}

/** The call settled with a result the card can render. */
export function isToolCallComplete(state: ToolCallState): boolean {
  return state === "output-available" || state === "output-denied";
}

/** The call failed: the card shows `errorText`, never output. */
export function isToolCallError(state: ToolCallState): boolean {
  return state === "output-error";
}

/** The run is paused on the human: the card must offer approve/deny. */
export function isToolCallApproval(state: ToolCallState): boolean {
  return state === "approval-requested";
}

/**
 * The announced label for a call: tool name plus its plain-language
 * phase, with the error text appended on failure so the announcement
 * never reports "error" without saying which one.
 */
export function resolveToolCallLabel(options: {
  name: string;
  state: ToolCallState;
  errorText?: string;
}): string {
  const { name, state } = options;
  switch (state) {
    case "input-streaming":
      return `Tool ${name} running`;
    case "input-available":
      return `Tool ${name} queued`;
    case "output-available":
      return `Tool ${name} completed`;
    case "output-denied":
      return `Tool ${name} denied`;
    case "approval-requested":
      return `Tool ${name} needs approval`;
    case "output-error": {
      const detail = options.errorText?.trim();
      return detail ? `Tool ${name} failed: ${detail}` : `Tool ${name} failed`;
    }
  }
}

/**
 * One call's state, controlled or uncontrolled, with the approval
 * handshake. `approve` resumes the run (`approval-requested` →
 * `input-available`) and `deny` settles it (`approval-requested` →
 * `output-denied`); from any other state both are terminal no-ops —
 * no transitions, no callbacks — following the `disabled` precedent
 * that a control which cannot act reports nothing.
 */
export function useToolCall(options?: {
  state?: ToolCallState;
  defaultState?: ToolCallState;
  onStateChange?: (state: ToolCallState) => void;
  onApprove?: () => void;
  onDeny?: () => void;
}): {
  state: ToolCallState;
  approve: () => void;
  deny: () => void;
} {
  const [state, setState] = useControllableState<ToolCallState>(
    options?.state,
    options?.defaultState ?? "input-streaming",
    options?.onStateChange,
  );
  const current = state ?? "input-streaming";
  // Destructured so the callbacks stay stable across renders that
  // pass a fresh options object (the `useSelection` notify precedent:
  // `useControllableState` keeps `onChange` in its setter deps).
  const { onApprove, onDeny } = options ?? {};

  const approve = useCallback(() => {
    if (current !== "approval-requested") return;
    setState("input-available");
    onApprove?.();
  }, [current, setState, onApprove]);

  const deny = useCallback(() => {
    if (current !== "approval-requested") return;
    setState("output-denied");
    onDeny?.();
  }, [current, setState, onDeny]);

  return { state: current, approve, deny };
}
