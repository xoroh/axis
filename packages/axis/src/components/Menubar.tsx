import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { DropdownMenu, type DropdownMenuState } from "./DropdownMenu";

/**
 * Menubar — an unstyled menu-command bar.
 *
 * A row of `MenubarMenu` commands, each opening a dropdown panel;
 * exactly one panel is open at a time. This is composition, not a
 * second menu implementation: each `MenubarMenu` IS a
 * `DropdownMenu` (same trigger/item/sub parts, same dismissal
 * stack, same scrim), controlled by the root's open value. It
 * differs from `NavigationMenu` in what opens: menu-command panels
 * (`menuitem` content, cascade-capable) rather than navigation
 * panels. The desktop-bar pattern adapts to touch by press (no
 * hover): pressing another menu's trigger while one is open
 * switches panels, because each menu's scrim fills only its own
 * container — never the whole bar. The open menu follows the
 * `useControllableState` pattern (`openValue`/`defaultOpenValue`/
 * `onOpenValueChange`, `null` closed): the open panel is
 * application state, like `NavigationMenu`.
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
  /** Accessible name source for the menu bar. */
  accessibilityLabel?: string;
  testID?: string;
  /** Bar container style: value or function of menubar state (row layout is default). */
  style?: StateStyle<MenubarState, StyleProp<ViewStyle>>;
  /** `MenubarMenu` elements. */
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

export type MenubarMenuProps = {
  /** Menu value identifying this trigger/panel pair (required). */
  value: string;
  /** Trigger content plus `DropdownMenuItem`/`DropdownMenuSub` elements. */
  children?: ReactNode;
  testID?: string;
  /** Menu content box style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution, forwarded to the menu's
   * content box (see `DropdownMenuProps.render`).
   */
  render?: RenderProp<DropdownMenuState, SlotProps>;
};

type MenubarDisclosure = {
  /** Currently open menu value (`null` closed). */
  openValue: string | null;
  /** Report an open state change for `value`. */
  report: (value: string, open: boolean) => void;
};

/**
 * Shared open-menu state. Internal (not exported).
 */
const MenubarDisclosureContext = createContext<MenubarDisclosure | null>(null);

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

export function MenubarMenu({
  value,
  children,
  testID,
  style,
  render,
}: MenubarMenuProps): React.ReactNode {
  const disclosure = useContext(MenubarDisclosureContext);
  // Outside a menubar there is no coordinated open state: render
  // nothing rather than an uncoordinated dropdown.
  if (!disclosure) return null;

  return (
    <DropdownMenu
      open={disclosure.openValue === value}
      onOpenChange={(open) => disclosure.report(value, open)}
      testID={testID}
      style={style}
      render={render}
    >
      {children}
    </DropdownMenu>
  );
}

export function Menubar({
  openValue,
  defaultOpenValue = null,
  onOpenValueChange,
  accessibilityLabel,
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
      accessibilityRole: "menubar",
      accessibilityLabel,
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
      accessibilityRole="menubar"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[{ flexDirection: "row" }, resolveStyle(style, state)]}
    >
      <MenubarDisclosureContext.Provider value={disclosure}>
        {children}
      </MenubarDisclosureContext.Provider>
    </View>
  );
}
