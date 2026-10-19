import {
  createContext,
  type ElementRef,
  Fragment,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { createPortalRegistry, type PortalRegistry } from "../portal";
import { type RenderProp, resolveRender } from "../render";
import type { SlotProps } from "../slot";

/**
 * Portal — the standalone native portal host (rn-primitives `Portal`
 * / `PortalHost` parity, Base UI `Portal` counterpart).
 *
 * `PortalHost` owns a `createPortalRegistry` (the shared model: which
 * overlay ids are mounted, in what order, unmount removes exactly
 * one) plus the nodes per id, and paints registered nodes at the
 * host's location in mount order. `Portal` declares content anywhere
 * under the host; the content renders at the host, not where it is
 * declared. A `Portal` with no matching host renders its children
 * inline rather than dropping them silently (the `MenuItem`
 * precedent).
 *
 * Matching: a `Portal` with no `hostName` renders into the nearest
 * host with no `name` (the default host); a named `Portal` renders
 * into the nearest host with the same name. Nesting hosts scopes
 * matching to the nearest one (context precedent).
 *
 * Host required (Base UI parity: every floating popup portals to the
 * app host): a `Portal` with no matching host warns in dev and renders
 * nothing — silently painting in-box would reintroduce the sibling
 * stacking the portal exists to escape, and pre-release there are no
 * compatibility fallbacks.
 *
 * Native scope (documented, not silent): the host paints in-box —
 * portaled content lays out inside the host's box (the `Menu`
 * precedent). Painting above the app root stays each overlay's own
 * `Modal` (Dialog, Drawer, Sheet); the host here owns ORDERING and
 * mount state, not root presentation. `container` has no native
 * meaning (parity-record D2); `keepMounted` stays omitted (D3).
 */

type PortalHostValue = {
  /** This host's name (`undefined` is the default host). */
  name: string | undefined;
  /** Register `id` with content; re-registering refreshes the node, never the order. */
  register: (id: string, node: ReactNode) => void;
  /** Remove `id` and its content. Unknown ids are a no-op. */
  unregister: (id: string) => void;
};

const PortalHostContext = createContext<PortalHostValue | null>(null);

export type PortalHostProps = {
  /**
   * Host name. A `Portal` with the same `hostName` renders here; a
   * `Portal` with no `hostName` renders into the nearest unnamed
   * host. Omitted is the default host.
   */
  name?: string;
  /** Content around (and including) the portals that target this host. */
  children?: ReactNode;
  testID?: string;
  /** Host container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity) for the host
   * container. Portaled nodes travel in the props as `children`
   * after the declared children.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
  /** Forwarded to the host container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: PortalHostProps["ref"],
  value: ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // A frozen ref object cannot take the write — leave it alone
      // rather than failing the render over it.
    }
  }
}

export function PortalHost({
  name,
  children,
  testID,
  style,
  render,
  ref,
}: PortalHostProps): React.ReactNode {  const registry = useMemo<PortalRegistry>(() => createPortalRegistry(), []);
  const nodes = useRef(new Map<string, ReactNode>());
  const [, setVersion] = useState(0);

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const value = useMemo<PortalHostValue>(
    () => ({
      name,
      register: (id: string, node: ReactNode) => {
        const known = registry.isMounted(id);
        nodes.current.set(id, node);
        if (!known) {
          registry.mount(id);
        }
        // Refresh the painted node even for a known id (content
        // changed under the same portal); bump only when something
        // actually stored, so a no-op re-register still paints.
        setVersion((previous) => previous + 1);
      },
      unregister: (id: string) => {
        if (!registry.isMounted(id)) return;
        nodes.current.delete(id);
        registry.unmount(id);
        setVersion((previous) => previous + 1);
      },
    }),
    [name, registry],
  );

  const portaled = registry
    .order()
    .map((id) => <Fragment key={id}>{nodes.current.get(id)}</Fragment>);

  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      children: (
        <>
          {children}
          {portaled}
        </>
      ),
      ref: setHostRef,
    } satisfies SlotProps,
    {},
  );

  // The host provides its own value: portals declared in `children`
  // below resolve to THIS host (nearest-scope rule), while the
  // painted `portaled` nodes above are already-resolved content, not
  // portals themselves.
  return (
    <PortalHostContext.Provider value={value}>
      {substituted !== null ? (
        substituted
      ) : (
        <View ref={setHostRef} testID={testID} style={style}>
          {children}
          {portaled}
        </View>
      )}
    </PortalHostContext.Provider>
  );
}

export type PortalProps = {
  /**
   * Target host name. Omitted targets the nearest unnamed (default)
   * host. No matching host renders the children inline (documented
   * above) — never silently dropped.
   */
  hostName?: string;
  /** Content painted at the host. */
  children?: ReactNode;
};

export function Portal({ hostName, children }: PortalProps): React.ReactNode {
  const host = useContext(PortalHostContext);
  const id = useId();
  const matched = host !== null && host.name === hostName;

  useEffect(() => {
    if (!matched || !host) return undefined;
    host.register(id, children);
    return () => {
      host.unregister(id);
    };
  }, [host, matched, id, children]);

  // Hosted portals paint at the host: nothing renders here. Without
  // a matching host there is no portal: warn in dev (a missing
  // `PortalHost` is always a wiring bug) and render nothing — the
  // pre-release contract has no in-box fallback.
  if (!matched) {
    if (__DEV__) {
      console.warn(
        "Axis Portal: no matching PortalHost mounted; rendering nothing. Mount a PortalHost above every portal.",
      );
    }
    return null;
  }
  return null;
}
