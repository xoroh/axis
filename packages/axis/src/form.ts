/**
 * Form validation plumbing — error maps and emptiness checks as pure
 * functions. No React, no React Native.
 *
 * Errors travel as plain strings keyed by field name; a field is
 * invalid while its list is non-empty. Server errors take precedence
 * over locally computed ones while present (the caller explicitly set
 * them); editing a field drops its server entry so a fix is never
 * shadowed by a stale server message. Nothing here throws on caller
 * input.
 */

/** Per-field error messages, keyed by field `name`. */
export type FieldErrors = Record<string, string | string[]>;

/** Normalize one field's errors to a list. Missing means none. */
export function normalizeFieldErrors(
  error: string | string[] | undefined,
): string[] {
  if (error === undefined) return [];
  return Array.isArray(error) ? [...error] : [error];
}

/**
 * Merge locally computed errors under server errors: a field shows
 * its server entry while one exists, else its local entries.
 */
export function mergeFormErrors(
  internal: FieldErrors,
  server: FieldErrors,
): FieldErrors {
  const merged: FieldErrors = {};
  const names = new Set([...Object.keys(internal), ...Object.keys(server)]);
  for (const name of names) {
    const fromServer = server[name];
    if (fromServer !== undefined) {
      merged[name] = fromServer;
      continue;
    }
    const fromInternal = internal[name];
    if (fromInternal !== undefined) merged[name] = fromInternal;
  }
  return merged;
}

/** Whether a value counts as empty: `undefined`, `null`, or `""`. */
export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}
