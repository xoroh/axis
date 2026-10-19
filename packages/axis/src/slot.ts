/**
 * The Slot composition model — prop merging for element substitution.
 *
 * ## Why this is a primitive
 *
 * Every overlay part (`Dialog.Trigger`, `Popover.Trigger`, `Menu.Trigger`, …)
 * lets the consumer substitute the rendered element while the part keeps its
 * own behaviour props (event handlers, `aria-*`, refs). Both renderers do that
 * merge today with independent inline spreads, so a fix to handler ordering on
 * one side silently does not reach the other — the `useControllableState`
 * failure mode repeating.
 *
 * ## What is genuinely shared, and what is not
 *
 * The MERGE is shared and belongs here: event handlers chain (the part's own
 * handler runs, then the consumer's), `className` concatenates, `style` merges
 * shallow with the consumer winning, and every other prop takes the consumer's
 * value unless it is `undefined`. The ELEMENT is not — cloning a React element
 * is the web renderer's job, and the native renderer maps the merged props onto
 * its own host. So this returns merged props; each renderer applies them.
 *
 * That split is what keeps it a primitive rather than a component: pure data
 * over plain objects, with no element type in sight.
 */

export type SlotProps = Record<string, unknown>;

/** True for values that behave as event handlers when merged. */
function isHandler(value: unknown): value is (...args: never[]) => void {
  return typeof value === "function";
}

/**
 * Chain two optional event handlers into one.
 *
 * The part's own handler runs first so its behaviour (opening, selecting)
 * cannot be swallowed by a consumer handler that stops propagation; the
 * consumer's runs second so it still observes the event. Either side may be
 * absent. Neither return value is used — an event handler that needs to veto
 * must do so through state, not through merge order.
 */
export function composeEventHandlers<E>(
  partHandler: ((event: E) => void) | undefined,
  consumerHandler: ((event: E) => void) | undefined,
): ((event: E) => void) | undefined {
  if (!partHandler) return consumerHandler;
  if (!consumerHandler) return partHandler;
  return (event: E) => {
    partHandler(event);
    consumerHandler(event);
  };
}

/**
 * Flatten an RN-style `style` prop (object, array, or nullish entry) into
 * a single object for shallow merging. Array entries apply left to right
 * (later wins), matching RN array semantics; nested arrays recurse.
 * Non-object entries (null, false, registered numbers unresolvable
 * without the host runtime) contribute nothing.
 */
function flattenStyleProp(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    const out: Record<string, unknown> = {};
    for (const entry of style) {
      Object.assign(out, flattenStyleProp(entry));
    }
    return out;
  }
  if (typeof style === "object" && style !== null) {
    return { ...(style as Record<string, unknown>) };
  }
  return {};
}

/**
 * Merge part props with consumer (slot child) props.
 *
 * - `on*` function props chain via {@link composeEventHandlers}
 * - `className` concatenates with a space (consumer last, so equal-specificity
 *   utilities resolve toward the consumer)
 * - `style` flattens RN arrays (later entries win) then merges shallow
 *   with the consumer winning per key
 * - every other prop takes the consumer's value unless it is `undefined`,
 *   in which case the part's stands
 *
 * Later consumer sets win over earlier ones, left to right.
 */
export function mergeSlotProps<T extends SlotProps>(
  partProps: T,
  ...consumerSets: readonly (Partial<T> | undefined | null)[]
): T {
  const merged: SlotProps = { ...(partProps as SlotProps) };
  for (const set of consumerSets) {
    if (!set) continue;
    for (const key of Object.keys(set as SlotProps)) {
      const incoming = (set as SlotProps)[key];
      if (incoming === undefined) continue;
      const current = merged[key];
      if (key.startsWith("on") && isHandler(current) && isHandler(incoming)) {
        merged[key] = composeEventHandlers(
          current as (event: never) => void,
          incoming as (event: never) => void,
        );
        continue;
      }
      if (
        key === "className" &&
        typeof current === "string" &&
        typeof incoming === "string"
      ) {
        merged[key] = `${current} ${incoming}`;
        continue;
      }
      if (
        key === "style" &&
        (typeof current === "object" || Array.isArray(current)) &&
        current !== null &&
        (typeof incoming === "object" || Array.isArray(incoming)) &&
        incoming !== null
      ) {
        merged[key] = {
          ...flattenStyleProp(current),
          ...flattenStyleProp(incoming),
        };
        continue;
      }
      merged[key] = incoming;
    }
  }
  return merged as T;
}
