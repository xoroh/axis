/**
 * The prompt-input model — draft value, the send gate, submit keys,
 * and composer sizing.
 *
 * ## Why this is a primitive
 *
 * The composer on both renderers answers the same questions on every
 * keystroke: is there anything sendable, does this key submit or
 * newline, and how tall is the multiline field. If the web side sends
 * on Enter while native needs Ctrl+Enter, the same keyboard habit
 * submits on one renderer and litters newlines on the other — a
 * submit mode is behavior, and behavior belongs here once.
 *
 * ## What is genuinely shared, and what is not
 *
 * The DRAFT PROTOCOL is shared: value state, the `canSend` gate over
 * the shared `ChatStatus` vocabulary, the submit-key rule per
 * `submitMode`, Escape cancellation, and the clamped composer height.
 * The FIELD is not — the text host, autosize measurement, focus, and
 * the model-picker / tools-menu / mic chrome are styled composition
 * in Kern. Sending itself stays app-owned: `submit` reports the draft
 * through `onSubmit` and leaves clearing to the caller, so controlled
 * and uncontrolled drafts behave identically.
 */

import { useCallback } from "react";
import { type ChatStatus, isChatBusy } from "./chatStatus";
import { useControllableState } from "./useControllableState";

/** Which key commits the draft. `none` submits from the Send affordance only. */
export type PromptInputSubmitMode = "enter" | "ctrlEnter" | "none";

/**
 * Whether the draft may send now: non-blank text, no run in flight
 * (a busy composer offers Stop instead — the `isChatBusy` half of
 * the shared vocabulary), and within `maxLength` when one is set.
 * An `error` status sends: retry reuses the draft.
 */
export function resolveCanSend(options: {
  text: string;
  status: ChatStatus;
  maxLength?: number;
}): boolean {
  if (!options.text.trim()) return false;
  if (isChatBusy(options.status)) return false;
  if (
    options.maxLength !== undefined &&
    options.text.length > options.maxLength
  ) {
    return false;
  }
  return true;
}

/**
 * Whether a key event commits the draft under `submitMode`: plain
 * Enter submits in `enter` mode (Shift+Enter holds the newline
 * convention both renderers share); `ctrlEnter` needs Ctrl or Cmd;
 * `none` never submits by key. Key names are plain strings — each
 * renderer maps its own key events onto them.
 */
export function shouldSubmitOnKey(options: {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  submitMode: PromptInputSubmitMode;
}): boolean {
  if (options.key !== "Enter") return false;
  switch (options.submitMode) {
    case "enter":
      return !options.shiftKey;
    case "ctrlEnter":
      return Boolean(options.ctrlKey || options.metaKey);
    case "none":
      return false;
  }
}

/**
 * Whether an Escape key cancels the draft when `cancelOnEscape` is
 * set. The renderer owns blur; this only answers the key question so
 * both renderers clear-or-keep identically.
 */
export function shouldCancelOnEscapeKey(
  key: string,
  cancelOnEscape: boolean,
): boolean {
  return cancelOnEscape && key === "Escape";
}

/**
 * The composer height for `lineCount` lines at `lineHeight` per line,
 * clamped to `minLines`..`maxLines` (defaults `1`..`5`, the range
 * every flagship composer grows through before scrolling). The
 * renderer counts lines from its own measurement; this clamps.
 */
export function resolveComposerHeight(options: {
  lineCount: number;
  lineHeight: number;
  minLines?: number;
  maxLines?: number;
}): number {
  const minLines = Math.max(1, options.minLines ?? 1);
  const maxLines = Math.max(minLines, options.maxLines ?? 5);
  const lines = Math.min(Math.max(options.lineCount, minLines), maxLines);
  return lines * options.lineHeight;
}

/**
 * The composer draft, controlled or uncontrolled, gated on the run
 * status. `submit` reports the draft through `onSubmit` when
 * `canSend` holds and is otherwise a terminal no-op (no callbacks
 * from an empty or busy composer). `submit` never clears: the caller
 * clears after handing the draft to its transport, so the clear
 * visibly follows the send on every renderer.
 */
export function usePromptInput(options?: {
  value?: string;
  defaultValue?: string;
  onChange?: (next: string) => void;
  status?: ChatStatus;
  submitMode?: PromptInputSubmitMode;
  cancelOnEscape?: boolean;
  maxLength?: number;
  onSubmit?: (text: string) => void;
}): {
  value: string;
  setValue: (next: string) => void;
  canSend: boolean;
  submit: () => void;
  clear: () => void;
  handleKey: (event: {
    key: string;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
  }) => boolean;
} {
  const [raw, setRaw] = useControllableState<string>(
    options?.value,
    options?.defaultValue ?? "",
    options?.onChange,
  );
  const value = raw ?? "";
  const {
    status = "idle",
    submitMode = "enter",
    cancelOnEscape = false,
    maxLength,
    onSubmit,
  } = options ?? {};
  const canSend = resolveCanSend({ text: value, status, maxLength });

  const setValue = useCallback(
    (next: string) => {
      setRaw(next);
    },
    [setRaw],
  );

  const clear = useCallback(() => {
    setRaw("");
  }, [setRaw]);

  const submit = useCallback(() => {
    if (!resolveCanSend({ text: value, status, maxLength })) return;
    onSubmit?.(value);
  }, [value, status, maxLength, onSubmit]);

  const handleKey = useCallback(
    (event: {
      key: string;
      shiftKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
    }) => {
      if (
        shouldSubmitOnKey({ ...event, submitMode }) &&
        resolveCanSend({ text: value, status, maxLength })
      ) {
        onSubmit?.(value);
        return true;
      }
      if (shouldCancelOnEscapeKey(event.key, cancelOnEscape)) {
        setRaw("");
        return true;
      }
      return false;
    },
    [value, status, maxLength, submitMode, cancelOnEscape, onSubmit, setRaw],
  );

  return { value, setValue, canSend, submit, clear, handleKey };
}
