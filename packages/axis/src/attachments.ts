/**
 * The attachments model — picked files with upload progress and
 * composer limits.
 *
 * ## Why this is a primitive
 *
 * The composer on both renderers tracks the same list: picked files
 * awaiting or completing upload, each with an id, a size, and a
 * transfer phase, bounded by the same limits (at most N files, at
 * most M bytes each). If the web side caps at ten files while native
 * caps at five, the same conversation refuses the same photo per
 * renderer — a limit is behavior, and behavior belongs here once.
 *
 * ## What is genuinely shared, and what is not
 *
 * The LIST and the LIMITS are shared: add/remove/update/clear over
 * `{id, name, size, mimeType, uri, state}`, with `maxFiles` /
 * `maxFileSize` validation reporting a typed error the caller
 * surfaces. The PICKING and the UPLOAD are not — image pickers,
 * drag-drop, paste, and the async transfer are platform code the app
 * owns; the app marks uploads finished through `update`. Rendering
 * (chips, previews, progress bars) is styled composition in the host design system.
 */

import { useCallback } from "react";
import { useControllableState } from "./useControllableState";

/**
 * One file's transfer phase, mirroring the channel-SDK shape both
 * native chat lists already use: accepted and moving, moved, or moved
 * and acknowledged by the transport.
 */
export type AttachmentState = "uploading" | "finished" | "uploaded";

/** One picked file in the composer. `size` is bytes; `uri` is local. */
export type ChatAttachment = {
  /** Stable identity, used as the list key. */
  id: string;
  /** Display name with extension. */
  name: string;
  /** Byte size, when the picker reported one. */
  size?: number;
  /** MIME type, when the picker reported one. */
  mimeType?: string;
  /** Local URI for previews; remote URL only after upload. */
  uri?: string;
  state: AttachmentState;
};

/** Composer limits. Both optional; absent means unbounded. */
export type AttachmentLimits = {
  /** Maximum attachments held at once. */
  maxFiles?: number;
  /** Maximum bytes per attachment. */
  maxFileSize?: number;
};

/** Why a candidate was refused. The caller surfaces this, never a throw. */
export type AttachmentError = "too-many" | "too-large" | "duplicate";

/**
 * Whether `candidate` may join `current` under `limits`: duplicate
 * ids, the per-file byte cap, and the list cap, in that order — a
 * file that is both a duplicate and oversized reports `duplicate`,
 * the identity problem first.
 */
export function validateAttachment(
  current: readonly ChatAttachment[],
  candidate: Pick<ChatAttachment, "id" | "size">,
  limits?: AttachmentLimits,
): AttachmentError | null {
  if (current.some((entry) => entry.id === candidate.id)) return "duplicate";
  if (
    limits?.maxFileSize !== undefined &&
    candidate.size !== undefined &&
    candidate.size > limits.maxFileSize
  ) {
    return "too-large";
  }
  if (limits?.maxFiles !== undefined && current.length >= limits.maxFiles) {
    return "too-many";
  }
  return null;
}

/** Apply a patch to one attachment by id; unknown ids leave the list alone. */
export function updateAttachment(
  current: readonly ChatAttachment[],
  id: string,
  patch: Partial<Pick<ChatAttachment, "state" | "uri" | "name">>,
): ChatAttachment[] {
  return current.map((entry) =>
    entry.id === id ? { ...entry, ...patch } : entry,
  );
}

/**
 * The composer attachment list, controlled or uncontrolled. `add`
 * validates first: refused candidates report through `onError` and
 * never enter the list. Accepted candidates enter as `uploading`
 * unless the caller states otherwise (a synchronously-available file
 * reports `finished` at add time); the app moves them on through
 * `update` as its transfer progresses. `remove` by id is a no-op for
 * unknown ids.
 */
export function useAttachments(options?: {
  value?: readonly ChatAttachment[];
  defaultValue?: readonly ChatAttachment[];
  onChange?: (next: readonly ChatAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (error: AttachmentError, candidate: ChatAttachment) => void;
}): {
  attachments: readonly ChatAttachment[];
  add: (candidate: ChatAttachment) => void;
  addMany: (candidates: readonly ChatAttachment[]) => void;
  update: (
    id: string,
    patch: Partial<Pick<ChatAttachment, "state" | "uri" | "name">>,
  ) => void;
  remove: (id: string) => void;
  clear: () => void;
} {
  const [raw, setRaw] = useControllableState<readonly ChatAttachment[]>(
    options?.value,
    options?.defaultValue ?? [],
    options?.onChange,
  );
  const attachments = raw ?? [];
  const { maxFiles, maxFileSize, onError } = options ?? {};

  const addMany = useCallback(
    (candidates: readonly ChatAttachment[]) => {
      // Validated sequentially against the accumulating list in ONE
      // state write: a multi-file pick loops here, and per-candidate
      // writes would each close over the same pre-pick list and keep
      // only the last file.
      const working = [...attachments];
      let accepted = false;
      for (const candidate of candidates) {
        const error = validateAttachment(working, candidate, {
          maxFiles,
          maxFileSize,
        });
        if (error) {
          onError?.(error, candidate);
          continue;
        }
        working.push(candidate);
        accepted = true;
      }
      if (accepted) setRaw(working);
    },
    [attachments, maxFiles, maxFileSize, onError, setRaw],
  );

  const add = useCallback(
    (candidate: ChatAttachment) => {
      addMany([candidate]);
    },
    [addMany],
  );

  const update = useCallback(
    (
      id: string,
      patch: Partial<Pick<ChatAttachment, "state" | "uri" | "name">>,
    ) => {
      setRaw((previous) => updateAttachment(previous ?? [], id, patch));
    },
    [setRaw],
  );

  const remove = useCallback(
    (id: string) => {
      setRaw((previous) => (previous ?? []).filter((entry) => entry.id !== id));
    },
    [setRaw],
  );

  const clear = useCallback(() => {
    setRaw([]);
  }, [setRaw]);

  return { attachments, add, addMany, update, remove, clear };
}
