import {
  createContext,
  type ElementRef,
  type JSX,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  type Text,
  type View,
} from "react-native";

/**
 * Screen-reader + DOM focus wiring for overlay surfaces (internal —
 * not barrel-exported: RN-specific measurement plumbing like
 * `useFloatingPlacement`, not a public behavior model).
 *
 * Two focus worlds, one module:
 * - Native: "focus" is `AccessibilityInfo.setAccessibilityFocus`
 *   (`findNodeHandle`), plus the duck-typed imperative `focus()` on
 *   hosts that expose one. No traversal exists — containment is the
 *   modality flags (`accessibilityViewIsModal` on the top popup,
 *   background isolation on the app root), never a tab loop.
 * - Web (React Native Web, detected by duck-typing, never an import):
 *   "focus" is DOM `.focus()`; modal popups additionally trap Tab
 *   inside the surface and expose `aria-modal`.
 *
 * Timing rule (upstream rn-primitives finding at the pinned SHA):
 * synchronous `setAccessibilityFocus` on a freshly-mounted node is
 * unreliable on both platforms, so the SR-tree focus is deferred
 * ~50ms while the duck-typed imperative `focus()` on a host that
 * exposes one stays synchronous (a mounted host is safe to call).
 * Every deferred call returns its cancel so effects clean up.
 */

export type FocusNode = ElementRef<typeof View> | null;

/** How the surface opened (what a function-form focus target receives). */
export type FocusInteraction = "trigger-press" | "programmatic";

/**
 * A focus target: a ref object, a bare element, a function returning
 * either (or `false` to stay silent) based on the open interaction, or
 * `false`/`null`/`undefined` for "no explicit target — use the
 * default". Matches Base UI (`initialFocus`/`finalFocus` accept a ref
 * or, where Base UI allows it, a function).
 */
export type OverlayFocusValue =
  | RefObject<FocusNode>
  | FocusNode
  | ((
      interaction: FocusInteraction,
    ) => RefObject<FocusNode> | FocusNode | false | null | undefined)
  | false
  | null
  | undefined;

/** Resolve an `OverlayFocusValue` to a node, or `null` for "no opinion". */
export function resolveFocusNode(
  value: OverlayFocusValue,
  interaction: FocusInteraction,
): FocusNode {
  if (value === false || value == null) return null;
  if (typeof value === "function") {
    const out = value(interaction);
    if (out === false || out == null) return null;
    if (typeof out === "object" && "current" in out) {
      return (out as RefObject<FocusNode>).current;
    }
    return out as FocusNode;
  }
  if (typeof value === "object" && "current" in value) {
    return (value as RefObject<FocusNode>).current;
  }
  return value as FocusNode;
}

/** True on web (React Native Web): a DOM `document` exists. No DOM import. */
export function isWebEnvironment(): boolean {
  return typeof (globalThis as { document?: unknown }).document !== "undefined";
}

/**
 * Web-only `tabIndex={-1}` spread for popup and title hosts: makes the
 * node programmatically focusable (a fallback initial target, and the
 * Tab-trap container) without adding a tab stop. React Native Web maps
 * it to the attribute; native ignores it. Typed for `View` (whose
 * props declare `tabIndex`); `Text` hosts spread the same shape with a
 * local suppression — RN types omit `tabIndex` there even though RNW
 * honors it.
 */
export function webTabIndexProps(web: boolean): { tabIndex?: -1 } {
  return web ? { tabIndex: -1 } : {};
}

/** Move screen-reader focus to `target`. Returns a cancel for the deferred SR-tree focus. */
export function focusAccessibilityNode(target: unknown): () => void {
  if (!target) return () => {};
  const maybeFocusable = target as { focus?: () => void };
  if (typeof maybeFocusable.focus === "function") maybeFocusable.focus();
  const tag = findNodeHandle(target as never);
  if (!tag) return () => {};
  const timer = setTimeout(() => {
    AccessibilityInfo.setAccessibilityFocus(tag);
  }, 50);
  return () => {
    clearTimeout(timer);
  };
}

/* ------------------------------------------------------------------ */
/* DOM helpers (web only — every shape duck-typed, no DOM imports)      */
/* ------------------------------------------------------------------ */

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const FOCUSABLE_TAGS = new Set([
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "AUDIO",
  "VIDEO",
]);

function isFocusableElement(value: unknown): boolean {
  // Tag-based, not `.focus`-based: every HTMLElement carries a
  // `.focus` function (including in jsdom), which would make every
  // container "focusable". Only genuinely tabbable elements count.
  if (typeof value !== "object" || value === null) return false;
  const el = value as {
    disabled?: unknown;
    focus?: unknown;
    hidden?: unknown;
    tagName?: unknown;
    getAttribute?: unknown;
  };
  if (typeof el.focus !== "function") return false;
  if (el.disabled === true || el.hidden === true) return false;
  const get = (name: string): string | null => {
    if (typeof el.getAttribute !== "function") return null;
    try {
      return (el.getAttribute as (n: string) => string | null).call(el, name);
    } catch {
      return null;
    }
  };
  if (get("aria-hidden") === "true") return false;
  const tab = get("tabindex");
  // Opted out of the tab order entirely — even for natively
  // focusable tags (the querySelectorAll union matches `button`
  // regardless of its tabindex, so this cannot live in the selector).
  if (tab === "-1") return false;
  const tag = typeof el.tagName === "string" ? el.tagName.toUpperCase() : "";
  if (tag === "INPUT" && get("type") === "hidden") return false;
  if (FOCUSABLE_TAGS.has(tag)) return true;
  if (tag === "A" && get("href") !== null) return true;
  return tab !== null;
}

/** Tabbable descendants of `container` in DOM order (web only). */
export function getFocusableElements(container: unknown): unknown[] {
  if (typeof container !== "object" || container === null) return [];
  const query = (container as { querySelectorAll?: unknown }).querySelectorAll;
  if (typeof query !== "function") return [];
  let list: ArrayLike<unknown>;
  try {
    list = (query as (selector: string) => ArrayLike<unknown>).call(
      container,
      FOCUSABLE_SELECTOR,
    );
  } catch {
    return [];
  }
  return Array.from(list).filter(isFocusableElement);
}

/** DOM `.focus()` on `node` (web only). Returns whether it was attempted. */
export function focusDomNode(node: unknown): boolean {
  if (typeof node !== "object" || node === null) return false;
  const focus = (node as { focus?: unknown }).focus;
  if (typeof focus !== "function") return false;
  try {
    (focus as () => void).call(node);
    return true;
  } catch {
    return false;
  }
}

/**
 * Trap Tab inside `container` (web only, modal popups): focus wraps
 * from last to first (and back with Shift). Non-Tab keys pass through.
 */
export function trapTabKey(
  container: unknown,
  event: {
    key?: unknown;
    shiftKey?: unknown;
    preventDefault?: unknown;
  },
): void {
  if ((event as { key?: unknown }).key !== "Tab") return;
  const items = getFocusableElements(container);
  const prevent = event.preventDefault;
  if (items.length === 0) {
    if (typeof prevent === "function") {
      (prevent as () => void).call(event);
    }
    return;
  }
  const owner = (
    container as { ownerDocument?: { activeElement?: unknown } | null }
  ).ownerDocument;
  const active = owner?.activeElement;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && active === first) {
    if (typeof prevent === "function") {
      (prevent as () => void).call(event);
    }
    focusDomNode(last);
  } else if (!event.shiftKey && active === last) {
    if (typeof prevent === "function") {
      (prevent as () => void).call(event);
    }
    focusDomNode(first);
  }
}

/**
 * Nearest focusable ancestor of `node`, excluding `node` itself (web
 * only). The D11 fallback is computed from the LIVE trigger while the
 * surface is open and stashed — a detached node's chain cannot be
 * focused (browsers no-op `.focus()` on disconnected elements), so
 * the stash must name an element that is still attached.
 */
export function closestFocusableAncestor(node: unknown): unknown | null {
  let current: unknown =
    (node as { parentNode?: unknown } | null)?.parentNode ?? null;
  for (let depth = 0; depth < 64 && current != null; depth += 1) {
    if (isFocusableElement(current)) return current;
    current = (current as { parentNode?: unknown }).parentNode ?? null;
  }
  return null;
}

/** Whether `node` is still attached (web only). */
export function isConnectedNode(node: unknown): boolean {
  if (typeof node !== "object" || node === null) return false;
  const connected = (node as { isConnected?: unknown }).isConnected;
  if (typeof connected === "boolean") return connected;
  const doc = (node as { ownerDocument?: { contains?: unknown } })
    .ownerDocument;
  if (doc && typeof doc.contains === "function") {
    try {
      return (doc.contains as (n: unknown) => boolean).call(doc, node);
    } catch {
      return false;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Focus scope (native default-target registry)                        */
/* ------------------------------------------------------------------ */

/**
 * What a part registers as: the popup `Title`, a focusable `stop`
 * (Close, Handle), or the caller-marked `initial` target (a Close with
 * the `initialFocus` marker — how AlertDialog marks Cancel).
 */
export type FocusScopeKind = "title" | "stop" | "initial";

export type FocusScope = {
  /** Register `node`; returns its unregister. Ordered by mount. */
  register(node: unknown, kind: FocusScopeKind): () => void;
  /** Resolve the default target: marked-initial, then stops/titles. */
  resolveDefault(includeStops: boolean): unknown | null;
  /** Caller-marked initial target, or `null`. Wins on both platforms. */
  markedInitial(): unknown | null;
};

/**
 * Ordered focusable registry for one popup. RN exposes no focusable
 * enumeration, so focusable parts register themselves in mount order
 * and the default initial target resolves from the registry (marked
 * initial, else first stop, else title). Web queries the DOM instead —
 * the registry still supplies the Title fallback there.
 */
export function createFocusScope(): FocusScope {
  const entries: Array<{ node: unknown; kind: FocusScopeKind }> = [];
  const markedInitial = (): unknown | null =>
    entries.find((entry) => entry.kind === "initial")?.node ?? null;
  return {
    register(node: unknown, kind: FocusScopeKind) {
      const entry = { node, kind };
      entries.push(entry);
      return () => {
        const index = entries.indexOf(entry);
        if (index !== -1) entries.splice(index, 1);
      };
    },
    markedInitial,
    resolveDefault(includeStops: boolean) {
      const marked = markedInitial();
      if (marked != null) return marked;
      if (includeStops) {
        const stop = entries.find((entry) => entry.kind === "stop");
        if (stop) return stop.node;
      }
      const title = entries.find((entry) => entry.kind === "title");
      return title?.node ?? null;
    },
  };
}

const FocusScopeContext = createContext<FocusScope | null>(null);

/**
 * The nearest popup's focus scope, or `null` outside one. Parts
 * register their node here; popups resolve the default initial target
 * from it.
 */
export function useFocusScopeMaybe(): FocusScope | null {
  return useContext(FocusScopeContext);
}

/** Provide `scope` to Title/Close/Handle parts below. */
export function FocusScopeProvider({
  scope,
  children,
}: {
  scope: FocusScope;
  children: ReactNode;
}): JSX.Element {
  return (
    <FocusScopeContext.Provider value={scope}>
      {children}
    </FocusScopeContext.Provider>
  );
}

/**
 * Title registration for popup parts. Returns a ref callback that
 * registers the node as the scope's title (the default-target
 * fallback) and unregisters on unmount or node change. Shared by
 * DialogTitle, DrawerTitle, PopoverTitle, … — one implementation so
 * the fallback resolves identically in every family.
 */
export function useScopeTitle(
  scope: FocusScope | null,
): (node: ElementRef<Text> | null) => void {
  const unregisterRef = useRef<(() => void) | null>(null);
  const setNode = useCallback(
    (node: ElementRef<Text> | null) => {
      unregisterRef.current?.();
      unregisterRef.current = null;
      if (node && scope) {
        unregisterRef.current = scope.register(node, "title");
      }
    },
    [scope],
  );
  useEffect(() => () => unregisterRef.current?.(), []);
  return setNode;
}

/**
 * Focus-stop registration for closer/handle parts. `initial` marks
 * the node as the default initial target (how AlertDialog marks
 * Cancel). Shared by DialogClose, AlertDialogClose, PopoverClose,
 * DrawerClose, … — one implementation, identical resolution.
 */
export function useScopeStop(
  scope: FocusScope | null,
  initial: boolean,
): (node: ElementRef<View> | null) => void {
  const unregisterRef = useRef<(() => void) | null>(null);
  const setNode = useCallback(
    (node: ElementRef<View> | null) => {
      unregisterRef.current?.();
      unregisterRef.current = null;
      if (node && scope) {
        unregisterRef.current = scope.register(
          node,
          initial ? "initial" : "stop",
        );
      }
    },
    [scope, initial],
  );
  useEffect(() => () => unregisterRef.current?.(), []);
  return setNode;
}

/**
 * Open-transition bookkeeping shared across a root's lifetime. Lives
 * in the stable per-root refs (not in hook-local `useRef`s) so a
 * portal remount — e.g. a sibling trigger unmounting in the same
 * commit as close, which remounts the keyless portal subtree — never
 * loses the open transition or the D11 ancestor stash.
 */
export type FocusTransitionState = {
  wasOpen: boolean;
  moved: boolean;
  ancestor: unknown;
};

/* ------------------------------------------------------------------ */
/* Unified popup focus (move in, restore out)                          */
/* ------------------------------------------------------------------ */

export function useModalFocus(options: {
  /** Whether the surface is currently open. */
  open: boolean;
  /**
   * Master switch for focus movement (wired to `trapFocus` on the
   * root). Silent surfaces (e.g. an unlabelled tip) also opt out
   * here. Default `true`.
   */
  enabled?: boolean;
  /** Gate for the restore half (wired to `restoreFocus`). Default `true`. */
  restoreEnabled?: boolean;
  /** Explicit initial target (popup prop wins over root — see callers). */
  initialFocus?: OverlayFocusValue;
  /** Explicit restore target (wins over the trigger). */
  finalFocus?: OverlayFocusValue;
  /**
   * Focus scope for the default target (marked initial, stops,
   * titles). May be `null` (generic surfaces fall back to the popup).
   */
  scope?: FocusScope | null;
  /**
   * Skip registered stops when resolving the default (drawers default
   * to the container or Title — never a destructive action).
   * Default `false`.
   */
  skipStops?: boolean;
  /** How the surface opened (trigger press vs programmatic). Default `programmatic`. */
  interactionRef?: { current: FocusInteraction };
  /**
   * Transition bookkeeping shared across a root's lifetime. When
   * provided, the open transition, move flag, and D11 ancestor stash
   * live here instead of hook-local refs — so a portal remount (e.g.
   * a sibling trigger unmounting in the same commit as close, which
   * remounts the keyless portal subtree) never loses the transition
   * the restore path needs. Omit for monoliths (their component
   * persists across open and close).
   */
  sharedState?: FocusTransitionState;
  /** Node receiving focus on open when nothing else resolves. */
  popupRef: { readonly current: unknown };
  /** Node receiving focus back on close (the trigger). */
  restoreRef: { readonly current: unknown };
}): void {
  const {
    open,
    enabled = true,
    restoreEnabled = true,
    initialFocus,
    finalFocus,
    scope = null,
    skipStops = false,
    interactionRef,
    sharedState,
    popupRef,
    restoreRef,
  } = options;
  // Hook-local fallback for surfaces without a root (monoliths): their
  // component persists, so locals survive open and close.
  const localState = useRef<FocusTransitionState>({
    wasOpen: false,
    moved: false,
    ancestor: null,
  });
  const st = sharedState ?? localState.current;
  useEffect(() => {
    const web = isWebEnvironment();
    if (web && open && restoreRef.current != null) {
      st.ancestor = closestFocusableAncestor(restoreRef.current);
    }
    const wasOpen = st.wasOpen;
    st.wasOpen = open;

    if (open && !wasOpen) {
      st.moved = false;
      if (!enabled || initialFocus === false) return undefined;
      const interaction = interactionRef?.current ?? "programmatic";
      if (interactionRef) interactionRef.current = "programmatic";
      const explicit = resolveFocusNode(initialFocus, interaction);
      const target =
        explicit ?? resolveDefaultTarget(web, scope, skipStops, popupRef);
      if (target == null) return undefined;
      st.moved = true;
      if (web) {
        focusDomNode(target);
        return undefined;
      }
      return focusAccessibilityNode(target);
    }

    if (!open && wasOpen) {
      if (!st.moved) return undefined;
      st.moved = false;
      if (!enabled || !restoreEnabled || finalFocus === false) return undefined;
      const interaction = interactionRef?.current ?? "programmatic";
      const explicit = resolveFocusNode(finalFocus, interaction);
      const live = restoreRef.current ?? null;
      const target = explicit ?? live;
      if (target != null) {
        if (web) {
          focusDomNode(target);
          return undefined;
        }
        return focusAccessibilityNode(target);
      }
      // Trigger unmounted: on web fall back to the stashed nearest
      // focusable ancestor when it is still connected (D11); on native
      // do nothing and never throw — RN has no focusable-ancestor
      // query, so a stale target is a silent no-op.
      if (web && isConnectedNode(st.ancestor)) {
        focusDomNode(st.ancestor);
      }
      return undefined;
    }
    return undefined;
    // Refs are stable identities; `.current` is read at transition time.
  }, [
    open,
    enabled,
    restoreEnabled,
    initialFocus,
    finalFocus,
    scope,
    skipStops,
    interactionRef,
    st,
    popupRef,
    restoreRef,
  ]);
}

/**
 * Default initial target: the caller-marked node wins on both
 * platforms (explicit intent); on web the first tabbable in the popup
 * is next (the DOM query native lacks); then registered stops (unless
 * skipped) and titles; finally the popup itself.
 */
function resolveDefaultTarget(
  web: boolean,
  scope: FocusScope | null,
  skipStops: boolean,
  popupRef: { readonly current: unknown },
): unknown | null {
  const marked = scope?.markedInitial() ?? null;
  if (marked != null) return marked;
  const node = popupRef.current;
  // Web first-tabbable — unless the family skips stops (drawers
  // default to the container or Title, never a destructive action,
  // so no DOM query either).
  if (web && !skipStops && node != null) {
    const tabbables = getFocusableElements(node);
    if (tabbables.length > 0) return tabbables[0];
  }
  if (scope != null) {
    const fallback = scope.resolveDefault(!skipStops);
    if (fallback != null) return fallback;
  }
  return node ?? null;
}
