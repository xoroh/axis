import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useMemo,
} from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * Menubar — an unstyled menu-command bar.
 *
 * A row of `MenuRoot` commands (each with a `value`), each opening
 * a menu panel; exactly one panel is open at a time. This is
 * composition, not a second menu implementation: each joined
 * `MenuRoot` (same trigger/item/sub parts, same dismissal stack,
 * same scrim) is controlled by the bar's open value. It differs
 * from `NavigationMenuRoot` in what opens: menu-command panels
 * (`menuitem` content, cascade-capable) rather than navigation
 * panels. The desktop-bar pattern adapts to touch by press (no
 * hover): pressing another menu's trigger while one is open
 * switches panels, because each menu's scrim fills only its own
 * container — never the whole bar. The open menu follows the
 * `useControllableState` pattern (`openValue`/`defaultOpenValue`/
 * `onOpenValueChange`, `null` closed): the open panel is
 * application state, like `NavigationMenuRoot`.
 *
 * Deferred, each for a named reason (not oversight): no animation
 * (the `Menu` rationale), no hover or keyboard traversal (no touch
 * equivalent; `roving`/`collection` unadopted for menus), no
 * portal/`Modal` host (paints inside the parent's box).
 */

export type MenubarState = {
  /** Currently open menu value (`null` closed). */
  openValue: string | null;
};

export type MenubarProps = {
  /** Controlled open menu value (`null` closed). Wins over `defaultOpenValue`. */
  openValue?: string | null;
  /** Uncontrolled initial open menu value. Default `null` (closed). */
  defaultOpenValue?: string | null;
  /** Fires with the next open value on every committed open or dismissal. */
  onOpenValueChange?: (value: string | null) => void;
  /** Accessible name source for the menu bar (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Bar container style: value or function of menubar state (row layout is default). */
  style?: StateStyle<MenubarState, StyleProp<ViewStyle>>;
  /** `MenuRoot` elements (each with a `value` to join the bar). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<MenubarState, SlotProps>;
  /** Forwarded to the bar container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

type MenubarDisclosure = {
  /** Currently open menu value (`null` closed). */
  openValue: string | null;
  /** Report an open state change for `value`. */
  report: (value: string, open: boolean) => void;
};

/**
 * Shared open-menu state for the bar's menus. Exported for `MenuRoot`
 * menu-joining only — not part of the public barrel: `MenuRoot`
 * menus with `value` must render inside a `Menubar` to join; outside
 * one they behave standalone.
 */
export const MenubarDisclosureContext = createContext<MenubarDisclosure | null>(
  null,
);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: MenubarProps["ref"],
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

export function Menubar({
  openValue,
  defaultOpenValue = null,
  onOpenValueChange,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: MenubarProps): React.ReactNode {
  const [current, setCurrent] = useControllableState<string | null>(
    openValue,
    defaultOpenValue,
    onOpenValueChange,
  );

  const report = useCallback(
    (value: string, open: boolean) => {
      setCurrent(open ? value : null);
    },
    [setCurrent],
  );

  const disclosure = useMemo<MenubarDisclosure>(
    () => ({ openValue: current ?? null, report }),
    [current, report],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render.
  const setBarRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: MenubarState = { openValue: current ?? null };
  const substituted = resolveRender(
    render,
    {
      accessible: true,
      role: "menubar",
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {}),
      testID,
      style: [{ flexDirection: "row" }, resolveStyle(style, state)],
      children,
      ref: setBarRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setBarRef}
      accessible
      role="menubar"
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
      testID={testID}
      style={[{ flexDirection: "row" }, resolveStyle(style, state)]}
    >
      <MenubarDisclosureContext.Provider value={disclosure}>
        {children}
      </MenubarDisclosureContext.Provider>
    </View>
  );
}
