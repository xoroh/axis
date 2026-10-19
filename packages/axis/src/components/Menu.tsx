function wrapText(node: ReactNode): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return <Text>{node}</Text>;
  }
  return node;
}

import {
  createContext,
  type ElementRef,
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
import {
  Pressable,
  type StyleProp,
  Text,
  TextInput,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import {
  type CollectionItem,
  defaultCollectionMatch,
  useCollectionRegistry,
} from "../collection";
import type { Align, Placement } from "../positioning";
import {
  type RenderProp,
  resolveRender,
  resolveStyle,
  type StateStyle,
} from "../render";
import type { SlotProps } from "../slot";
import {
  appendTypeaheadQuery,
  matchTypeaheadKey,
  type TypeaheadBuffer,
} from "../typeahead";
import { useControllableState } from "../useControllableState";
import {
  DropdownDisclosureContext,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./DropdownMenu";
import { OverlayPortal, OverlayRoot } from "./Overlay";
import { Portal } from "./Portal";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Menu — a compound popup menu (Base UI parity).
 *
 * `MenuRoot` owns open state (renders no element, wrapped in an
 * `OverlayRoot` so stacking, dismissal and focus belong to one
 * owner); `MenuTrigger` toggles and registers the anchor;
 * `MenuPortal` presents at the app's portal host (overlay host when
 * modal, plain in-box `Portal` when not); `MenuBackdrop` is the
 * scrim; `MenuPositioner` measures placement against the trigger
 * anchor; `MenuPopup` is the content box; `MenuItem` /
 * `MenuLinkItem` / `MenuCheckboxItem` / `MenuRadioItem` (+ indicators)
 * are rows; `MenuGroup` + `MenuGroupLabel` group them;
 * `MenuSeparator` divides; `MenuInput` / `MenuClear` / `MenuEmpty`
 * filter over the `collection` registry; `MenuSubmenuRoot` /
 * `MenuSubmenuTrigger` / `MenuSubmenuContent` cascade. No default
 * visuals — every visual value is caller-provided. State follows the
 * `useControllableState` pattern: `open` (+ `onOpenChange`) for
 * controlled use, `defaultOpen` for uncontrolled (default `false`).
 *
 * Filter parts work in the compound form only (items publish
 * `filterText` through the registry; `MenuEmpty` shows on zero
 * visible matches). Non-modal roots (`modal={false}`) present
 * through the plain `Portal` with no scrim; outside-press without a
 * scrim reaches the app (press-capture would hijack touches).
 *
 * Deferred, each for a named reason (not oversight): no hover or
 * keyboard navigation (D8 — no touch equivalent; `roving` /
 * `collection` unadopted for traversal), no animation states (D9 —
 * content mounts/unmounts synchronously), and no `data-*`
 * attributes (D1 — state flows through function `style`/`render`
 * props instead).
 *
 * Test ids: the content box carries `testID`; the scrim carries
 * `<testID>-scrim` when `testID` is given. The scrim is labelled
 * "Dismiss menu".
 */

export type MenuTriggerState = {
  /** Whether the menu is currently open. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export type MenuTriggerProps = {
  testID?: string;
  /** Value or function of trigger state, caller-provided. */
  style?: StateStyle<MenuTriggerState, StyleProp<ViewStyle>>;
  /** Trigger content, rendered inside the `Pressable`. Optional when `render` supplies it (an empty trigger with neither is a bug). */
  children?: ReactNode;
  /** Terminal: it never toggles and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<MenuTriggerState, SlotProps>;
};

export type MenuItemState = {
  /** Whether the item is currently disabled. */
  disabled: boolean;
  /**
   * Whether the item is pressed. Touch has no hover or keyboard
   * focus to highlight with — the press is the highlight (native
   * adaptation, documented in the parity record).
   */
  highlighted: boolean;
};

export type MenuItemProps = {
  /**
   * Item value. Optional (Base UI parity — Base items carry no
   * value): required only for `onSelect`, and for cascade identity
   * in `DropdownMenu`.
   */
  value?: string;
  /** Terminal: it never selects and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of item state, caller-provided. */
  style?: StateStyle<MenuItemState, StyleProp<ViewStyle>>;
  /** Item content, rendered inside the `Pressable`. */
  children?: ReactNode;
  /**
   * Fires with `value` on activation, before `onClick` and close.
   * Requires `value` — without one there is nothing to report.
   */
  onSelect?: (value: string) => void;
  /**
   * Fires on activation (Base UI parity), after `onSelect`. Always
   * fires, with or without `value`.
   */
  onClick?: (event: unknown) => void;
  /**
   * Matchable text for menu filtering (`MenuInput`): the item hides
   * while a non-empty query matches nothing in this text. Defaults
   * to bare string children; items without text always show.
   */
  filterText?: string;
  /**
   * Whether activation closes the menu. Default `true` (set
   * `false` for checkbox-style items that stay open).
   */
  closeOnClick?: boolean;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<MenuItemState, SlotProps>;
};

type MenuDisclosure = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  /** Scrim/outside dismissal (`onDismiss` first). */
  dismiss: () => void;
  /** Backdrop press dismisses. */
  disablePointerDismissal: boolean;
  /** Portal presents modally with a scrim. */
  modal: boolean;
  /** Anchor host for `MenuPositioner` measurement (compound only). */
  anchorHostRef: { current: ElementRef<typeof View> | null };
  /** Register the trigger host for positioner measurement. */
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
  /**
   * Filter state for `MenuInput`/`MenuClear`/`MenuEmpty` plus item
   * registration (the root owns the query — filter parts render
   * nothing without one).
   */
  filter: MenuFilter | null;
  highlightedKey: string | null;
  onTypeaheadKey: (char: string) => void;
};

/**
 * The menu filter: the query text plus the item registry items
 * publish their matchable text to. Internal shape (not exported as
 * a type — `MenuInput`/`MenuClear`/`MenuEmpty` are the API).
 */
type MenuFilter = {
  query: string;
  setQuery: (query: string) => void;
  items: readonly CollectionItem[];
  register: (item: CollectionItem) => void;
  unregister: (key: string) => void;
};

/**
 * Whether an item with `text` shows under `query`: items with no
 * matchable text always show (nothing to judge them by — hiding
 * them would delete structure like dividers on any keystroke).
 */
function isFilterVisible(query: string, text: string): boolean {
  return text === "" || defaultCollectionMatch(query, text);
}

/**
 * Shared item filtering: register `text` (empty when the item
 * carries none) and report visibility under the current query.
 * Internal — `MenuItem`, `MenuLinkItem`, `MenuCheckboxItem`, and
 * `MenuRadioItem` differ only in role, never in filtering.
 */
function useMenuFilterItem(
  filter: MenuFilter | null,
  text: string | undefined,
  itemKey?: string,
): { visible: boolean; key: string } {
  const generatedId = useId();
  const key = itemKey || generatedId;
  const resolved = text ?? "";
  // Deps are the stable registry callbacks — never the `filter`
  // object, whose identity changes on every keystroke and would
  // re-run every registration effect (unregister + re-register
  // allocate) per keystroke, looping through passive effects.
  const register = filter?.register;
  const unregister = filter?.unregister;
  useEffect(() => {
    if (!register || !unregister) return;
    register({ key, text: resolved });
    return () => unregister(key);
  }, [register, unregister, key, resolved]);
  if (!filter) return { visible: true, key };
  return { visible: isFilterVisible(filter.query, resolved), key };
}

/**
 * Resolve an item's matchable text: the explicit `filterText`
 * first, then bare string children, else none (always visible).
 */
function menuItemFilterText(
  filterText: string | undefined,
  children: ReactNode,
): string | undefined {
  if (filterText !== undefined) return filterText;
  if (typeof children === "string") return children;
  return undefined;
}

/**
 * Shared open state for the menu's parts. Internal to this module
 * (not exported): parts must render inside a `MenuRoot` to participate;
 * outside one the trigger renders collapsed and inert and an item
 * renders inert, like `AccordionItem` outside its group.
 */
const MenuDisclosureContext = createContext<MenuDisclosure | null>(null);
type MenuSubIdentity = {
  value: string;
  depth: number;
};

type MenuSubContextValue = {
  openPath: string[];
  openSub: (value: string, depth: number) => void;
  closeSub: (depth: number) => void;
  subDepth: number;
  sub: MenuSubIdentity | null;
};

const MenuSubContext = createContext<MenuSubContextValue | null>(null);

/**
 * Fills the menu container behind the content box. Structural only —
 * absolute fill positions the layer, no colors or spacing — so the
 * whole container (trigger zone plus content area) dismisses on press.
 */
const SCRIM_FILL: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function MenuTrigger({
  testID,
  style,
  children,
  disabled = false,
  accessibilityLabel,
  render,
}: MenuTriggerProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  const open = disclosure?.open ?? false;
  const state: MenuTriggerState = { open, disabled };

  const toggleTrigger = useCallback(() => {
    if (disabled) return;
    disclosure?.toggle();
  }, [disabled, disclosure]);

  // Register the host for `MenuPositioner` measurement when inside
  // a menu root; outside a root there is
  // nothing to anchor to and registration is a no-op write.
  const setTriggerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      // A trigger renders a Pressable whose ref resolves to its host
      // view; the positioner only needs the measurable node.
      disclosure?.setAnchorRef(node);
    },
    [disclosure],
  );

  // Outside a Menu there is no disclosure to toggle: render inert
  // (announced disabled, press is a no-op) rather than dropping the
  // node silently.
  const inert = disclosure === null;
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { expanded: open, disabled: disabled || inert },
      accessibilityLabel,
      testID,
      disabled: disabled || inert,
      onPress: toggleTrigger,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setTriggerRef}
      accessibilityRole="button"
      accessibilityState={{ expanded: open, disabled: disabled || inert }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled || inert}
      onPress={toggleTrigger}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

/**
 * Shared item activation: disclosure + highlight tracking + the
 * select/click/close sequence. Internal — `MenuItem` and
 * `MenuLinkItem` differ only in role, never in behavior, and a
 * second copy of this sequence would be exactly the silent-drift
 * shape the `slot` model exists to prevent.
 */
function useMenuItemActivation({
  disabled,
  value,
  onSelect,
  onClick,
  closeOnClick,
}: {
  disabled: boolean;
  value: string | undefined;
  onSelect: ((value: string) => void) | undefined;
  onClick: ((event: unknown) => void) | undefined;
  closeOnClick: boolean;
}): {
  disclosure: MenuDisclosure | null;
  highlighted: boolean;
  setHighlighted: (highlighted: boolean) => void;
  selectItem: (event: unknown) => void;
} {
  const disclosure = useContext(MenuDisclosureContext);
  const [highlighted, setHighlighted] = useState(false);

  const selectItem = useCallback(
    (event: unknown) => {
      if (disabled) return;
      if (value !== undefined) onSelect?.(value);
      onClick?.(event);
      if (closeOnClick) disclosure?.close();
    },
    [disabled, onSelect, onClick, value, closeOnClick, disclosure],
  );

  return { disclosure, highlighted, setHighlighted, selectItem };
}

export function MenuItem({
  value,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  filterText,
  onSelect,
  onClick,
  closeOnClick = true,
  render,
}: MenuItemProps): React.ReactNode {
  const { disclosure, highlighted, setHighlighted, selectItem } =
    useMenuItemActivation({ disabled, value, onSelect, onClick, closeOnClick });
  const { visible: filterVisible, key: itemKey } = useMenuFilterItem(
    disclosure?.filter ?? null,
    menuItemFilterText(filterText, children),
    value,
  );
  const isTypeahead = Boolean(
    disclosure?.highlightedKey &&
      (disclosure.highlightedKey === itemKey ||
        (value !== undefined && disclosure.highlightedKey === value)),
  );
  const state: MenuItemState = {
    disabled,
    highlighted: highlighted || isTypeahead,
  };

  // Outside a Menu there is no disclosure to close: render inert
  // (announced disabled, press is a no-op) rather than dropping the
  // node silently.
  if (!disclosure) {
    const substituted = resolveRender(
      render,
      {
        role: "menuitem",
        accessibilityState: { disabled: true },
        accessibilityLabel,
        testID,
        disabled: true,
        style: resolveStyle(style, { disabled: true, highlighted: false }),
        children,
      } satisfies SlotProps,
      { disabled: true, highlighted: false },
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        role="menuitem"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled
        style={resolveStyle(style, { disabled: true, highlighted: false })}
      >
        {children}
      </Pressable>
    );
  }

  // Presence is mount/unmount: a closed menu shows the trigger only.
  if (!disclosure.open) return null;

  // Filtered out: hidden while the query matches nothing in this
  // item's text (stays mounted, so registration persists and the
  // item returns when the query clears).
  if (!filterVisible) return null;

  const substituted = resolveRender(
    render,
    {
      role: "menuitem",
      accessibilityState: { disabled },
      accessibilityLabel,
      testID,
      disabled,
      onPress: selectItem,
      onPressIn: () => setHighlighted(true),
      onPressOut: () => setHighlighted(false),
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      role="menuitem"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={selectItem}
      onPressIn={() => setHighlighted(true)}
      onPressOut={() => setHighlighted(false)}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* The parts below mirror Base UI's Menu anatomy — Root (state owner,  */
/* renders no element), Trigger (toggle + anchor registration), Portal */
/* (the overlay host: the native portal host),                         */
/* native portal host), Backdrop (the scrim), Positioner (measured     */
/* placement against the trigger anchor), Popup (the content box),      */
/* Item (shared, extended with `onClick`/`closeOnClick`,               */
/* `highlighted` press state, and `filterText`), LinkItem, Separator,  */
/* Group/GroupLabel, Arrow (caller-positioned marker),                 */
/* CheckboxItem (+Indicator), RadioGroup/RadioItem (+Indicator), and   */
/* the filter parts Input/Clear/Empty over the `collection` registry   */
/* (items publish `filterText`; empty matches show `Empty`) — with     */
/* `render` element/function composition and value-or-function         */
/* `style` on every part. Omitted Base UI pieces are documented        */
/* deviations, not oversights: no `FilterProvider` (the Root owns the  */
/* query directly — a provider with no other state is chrome), no      */
/* hover or keyboard traversal (D8), no animation states (D9), and     */
/* no `data-*` attributes (D1 — state flows through function          */
/* `style`/`render` props instead). Non-modal menus (`modal={false}`   */
/* on the Root) render the portal through the plain `Portal` at the    */
/* app host with no Backdrop; outside-press without a scrim is a       */
/* documented limitation (press-capture would hijack app touches).     */
/* ------------------------------------------------------------------ */

export type MenuRootState = {
  open: boolean;
};

export type MenuRootProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed toggle or dismissal. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * When `true`, backdrop press does not dismiss (Base UI parity
   * name for staying open). Default `false`.
   */
  disablePointerDismissal?: boolean;
  /**
   * Whether the open menu presents modally (an overlay host with a
   * scrim). Default `true`. When `false` the portal presents through
   * the plain `Portal` at the app host with no scrim, and the trigger stays pressable so it toggles closed — but
   * presses outside the menu reach the underlying app instead of
   * dismissing (documented limitation: outside-press detection
   * without a scrim needs press-capture that would hijack app
   * touches).
   */
  modal?: boolean;
  /**
   * Controlled filter query for `MenuInput`/`MenuClear`/`MenuEmpty`.
   * Wins over `defaultFilterValue` when defined.
   */
  filterValue?: string;
  /** Uncontrolled initial filter query. Default `""` (unfiltered). */
  defaultFilterValue?: string;
  /** Fires with the next query on every committed filter change. */
  onFilterChange?: (query: string) => void;
  /** Trigger, Portal, and shared content. Renders no element itself. */
  children?: ReactNode;
  /** Forwarded nowhere (the root renders no element); accepted so ref-spreading callers typecheck. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type MenuBackdropState = {
  /** Whether the menu is currently open. */
  open: boolean;
};

export type MenuBackdropProps = {
  testID?: string;
  /** Value or function of backdrop state, caller-provided. */
  style?: StateStyle<MenuBackdropState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * scrim host; dismissal wiring stays on the part.
   */
  render?: RenderProp<MenuBackdropState, SlotProps>;
};

export type MenuPositionerState = {
  /** Whether the menu is currently open. */
  open: boolean;
  /** Effective placement side (after viewport flip/clamping). */
  side: Placement;
};

export type MenuPositionerProps = {
  /** Preferred side for the content box. Default `"bottom"`. */
  side?: Placement;
  /** Cross-axis alignment. Default `"center"`. */
  align?: Align;
  /** Gap between anchor and content edges. Default `0`. */
  sideOffset?: number;
  /** Shift along the cross axis after alignment. Default `0`. */
  alignOffset?: number;
  testID?: string;
  /** Value or function of positioner state, caller-provided. */
  style?: StateStyle<MenuPositionerState, StyleProp<ViewStyle>>;
  /** Popup (and optional Arrow content) composed by the caller. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * positioned wrapper; measurement stays on the part.
   */
  render?: RenderProp<MenuPositionerState, SlotProps>;
};

export type MenuPopupState = {
  /** Whether the menu is currently open. */
  open: boolean;
};

export type MenuPopupProps = {
  testID?: string;
  /** Value or function of popup state, caller-provided. */
  style?: StateStyle<MenuPopupState, StyleProp<ViewStyle>>;
  /** Item content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * content host; role stays on the part.
   */
  render?: RenderProp<MenuPopupState, SlotProps>;
  /** Forwarded to the content `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type MenuSeparatorProps = {
  testID?: string;
  /** Separator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type MenuPortalProps = {
  /** Portal content (Backdrop + Positioner composed by the caller). */
  children?: ReactNode;
  testID?: string;
};

/**
 * Assign one value to every ref in the list, for the popup host.
 * Inline here (not imported) deliberately — the contract rule, see
 * every other part in this package.
 */
function assignPopupRef(
  ref: MenuPopupProps["ref"],
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

export function MenuRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  disablePointerDismissal = false,
  modal = true,
  filterValue,
  defaultFilterValue = "",
  onFilterChange,
  children,
  ref,
}: MenuRootProps): React.JSX.Element {
  // Accepted for ref-spreading callers; the root renders no element
  // to attach it to (Base UI parity — documented, not dropped
  // silently: an unused ref would be the silent version of this).
  void ref;
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const toggle = useCallback(() => {
    setOpen((previous) => !(previous ?? false));
  }, [setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Backdrop path: `onDismiss` first, then report `false` (the
  // `Dialog` dismissal precedent). Guarded on
  // `disablePointerDismissal` so a non-dismissable menu cannot
  // close through the scrim.
  const dismiss = useCallback(() => {
    if (disablePointerDismissal) return;
    onDismiss?.();
    setOpen(false);
  }, [disablePointerDismissal, onDismiss, setOpen]);

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  const [filterQuery, setFilterQuery] = useControllableState<string>(
    filterValue,
    defaultFilterValue,
    onFilterChange,
  );
  const collection = useCollectionRegistry();
  const {
    items: filterItems,
    register: registerFilterItem,
    unregister: unregisterFilterItem,
  } = collection;
  // Separate memo: the query changes on every keystroke while the
  // disclosure below must stay stable for everything else, so items
  // re-render on filter changes without rebuilding toggle/close.
  const filter = useMemo<MenuFilter>(
    () => ({
      query: filterQuery ?? "",
      setQuery: setFilterQuery,
      items: filterItems,
      register: registerFilterItem,
      unregister: unregisterFilterItem,
    }),
    [
      filterQuery,
      setFilterQuery,
      filterItems,
      registerFilterItem,
      unregisterFilterItem,
    ],
  );

  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const typeaheadBufferRef = useRef<TypeaheadBuffer | null>(null);

  const onTypeaheadKey = useCallback(
    (keyChar: string) => {
      if (!isOpen) return;
      if (keyChar.length !== 1) return;
      const now = Date.now();
      const nextBuffer = appendTypeaheadQuery(
        typeaheadBufferRef.current,
        keyChar,
        now,
      );
      typeaheadBufferRef.current = nextBuffer;
      const matched = matchTypeaheadKey(
        filterItems,
        nextBuffer.text,
        highlightedKey,
      );
      if (matched !== undefined) {
        setHighlightedKey(matched);
      }
    },
    [isOpen, filterItems, highlightedKey],
  );

  const [openPath, setOpenPath] = useState<string[]>([]);
  const openSub = useCallback((val: string, depth: number) => {
    if (depth < 0) return;
    setOpenPath((previous) => [...previous.slice(0, depth), val]);
  }, []);
  const closeSub = useCallback((depth: number) => {
    setOpenPath((previous) => previous.slice(0, depth));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedKey(null);
      typeaheadBufferRef.current = null;
      setOpenPath([]);
    }
  }, [isOpen]);

  const menuSubValue = useMemo<MenuSubContextValue>(
    () => ({
      openPath,
      openSub,
      closeSub,
      subDepth: 0,
      sub: null,
    }),
    [openPath, openSub, closeSub],
  );

  const disclosure = useMemo<MenuDisclosure>(
    () => ({
      open: isOpen ?? false,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
      anchorHostRef,
      setAnchorRef,
      filter,
      highlightedKey,
      onTypeaheadKey,
    }),
    [
      isOpen,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
      setAnchorRef,
      filter,
      highlightedKey,
      onTypeaheadKey,
    ],
  );

  // The root owns state, never layout: no host element (Base UI
  // parity). The overlay root wraps it so stacking, dismissal and
  // focus belong to one owner (the `DialogRoot` precedent).
  return (
    <OverlayRoot
      open={isOpen}
      onOpenChange={setOpen}
      onDismiss={onDismiss}
      modal={modal}
      dismissable={!disablePointerDismissal}
      dismiss={{
        outsidePointer: !disablePointerDismissal,
        systemBack: !disablePointerDismissal,
        escape: !disablePointerDismissal,
      }}
    >
      <MenuDisclosureContext.Provider value={disclosure}>
        <MenuSubContext.Provider value={menuSubValue}>
          {children}
        </MenuSubContext.Provider>
      </MenuDisclosureContext.Provider>
    </OverlayRoot>
  );
}

export function MenuPortal({
  children,
  testID,
}: MenuPortalProps): React.JSX.Element | null {
  const disclosure = useContext(MenuDisclosureContext);
  const menuSub = useContext(MenuSubContext);
  // Outside a root there is no open state to present: render nothing.
  if (!disclosure) return null;
  if (!disclosure.open) return null;

  // The portal host: `OverlayPortal` paints at the app's
  // `PortalHost`, so the compound menu escapes clipped parents —
  // that is the point of the part — without an RN `Modal` of its own
  // (one root presents every layer; see the `Overlay` module note).
  // `container` has no native meaning and is omitted by design.
  // Positioning (`MenuPositioner` + the `positioning` model) stays
  // separable from the host either way. Non-modal roots present
  // through the plain `Portal` with no scrim instead: presses outside
  // reach the app rather than dismissing
  // (documented on `modal`).
  //
  // The disclosure is re-provided inside the portal: portaled content
  // renders at the host, outside this root's subtree, so without an
  // explicit provider the parts below would read a null disclosure.
  // The submenu registry travels the same way (the value passes
  // through untouched when a custom tree provides no sub state).
  if (!disclosure.modal) {
    return (
      <Portal>
        <MenuDisclosureContext.Provider value={disclosure}>
          <MenuSubContext.Provider value={menuSub}>
            <View testID={testID}>{children}</View>
          </MenuSubContext.Provider>
        </MenuDisclosureContext.Provider>
      </Portal>
    );
  }
  return (
    <OverlayPortal testID={testID}>
      <MenuDisclosureContext.Provider value={disclosure}>
        <MenuSubContext.Provider value={menuSub}>
          {children}
        </MenuSubContext.Provider>
      </MenuDisclosureContext.Provider>
    </OverlayPortal>
  );
}

export function MenuBackdrop({
  testID,
  style,
  render,
}: MenuBackdropProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: MenuBackdropState = { open: disclosure.open };

  if (!disclosure.disablePointerDismissal) {
    const substituted = resolveRender(
      render,
      {
        accessibilityLabel: "Dismiss menu",
        testID,
        onPress: disclosure.dismiss,
        style: resolveStyle(style, state),
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        accessibilityLabel="Dismiss menu"
        testID={testID}
        onPress={disclosure.dismiss}
        style={[SCRIM_FILL, resolveStyle(style, state)]}
      />
    );
  }

  // Non-dismissable: a plain host with no label and no handler — no
  // fake affordance (no scrim at all would also be honest; the layer
  // stays for layout parity with the dismissable shape).
  const substituted = resolveRender(
    render,
    { testID, style: resolveStyle(style, state) } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return (
    <View testID={testID} style={[SCRIM_FILL, resolveStyle(style, state)]} />
  );
}

export function MenuPositioner({
  side = "bottom",
  align,
  sideOffset,
  alignOffset,
  testID,
  style,
  children,
  render,
}: MenuPositionerProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  // Hooks before guards: measurement runs (harmlessly) even while
  // closed so activation never reorders hook calls.
  const floating = useFloatingPlacement({
    anchorRef: disclosure?.anchorHostRef ?? { current: null },
    placement: side,
    offset: sideOffset,
    align,
    alignOffset,
    active: disclosure?.open ?? false,
  });
  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: MenuPositionerState = {
    open: disclosure.open,
    side: floating.side,
  };

  const substituted = resolveRender(
    render,
    {
      testID,
      onLayout: floating.onContentLayout,
      style: [floating.style, resolveStyle(style, state)],
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      testID={testID}
      onLayout={floating.onContentLayout}
      style={[floating.style, resolveStyle(style, state)]}
    >
      {children}
    </View>
  );
}

export function MenuPopup({
  testID,
  style,
  children,
  render,
  ref,
}: MenuPopupProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);

  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignPopupRef(ref, node);
    },
    [ref],
  );

  const handleKeyDown = useCallback(
    (e: unknown) => {
      const event = e as {
        key?: unknown;
        nativeEvent?: {
          key?: unknown;
          altKey?: unknown;
          ctrlKey?: unknown;
          metaKey?: unknown;
        };
        altKey?: unknown;
        ctrlKey?: unknown;
        metaKey?: unknown;
      };
      const char = event?.key ?? event?.nativeEvent?.key;
      if (!char || typeof char !== "string" || char.length !== 1) return;
      const altKey = event?.altKey ?? event?.nativeEvent?.altKey;
      const ctrlKey = event?.ctrlKey ?? event?.nativeEvent?.ctrlKey;
      const metaKey = event?.metaKey ?? event?.nativeEvent?.metaKey;
      if (altKey || ctrlKey || metaKey) return;
      disclosure?.onTypeaheadKey(char);
    },
    [disclosure],
  );

  if (!disclosure) return null;
  if (!disclosure.open) return null;
  const state: MenuPopupState = { open: disclosure.open };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      role: "menu",
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setPopupRef,
      onKeyDown: handleKeyDown,
      onKeyPress: handleKeyDown,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setPopupRef}
      accessible
      role="menu"
      testID={testID}
      style={resolveStyle(style, state)}
      {...({ onKeyDown: handleKeyDown, onKeyPress: handleKeyDown } as Record<
        string,
        unknown
      >)}
    >
      {children}
    </View>
  );
}

export function MenuSeparator({
  testID,
  style,
  render,
}: MenuSeparatorProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return <View accessible={false} testID={testID} style={style} />;
}

export type MenuGroupProps = {
  testID?: string;
  /** Group container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Group content (`MenuGroupLabel` + items). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type MenuGroupLabelProps = {
  testID?: string;
  /** Label text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Label content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type MenuLinkItemProps = {
  /**
   * Item value. Optional like `MenuItem` (required only for
   * `onSelect`).
   */
  value?: string;
  /** Terminal: it never activates and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of item state, caller-provided. */
  style?: StateStyle<MenuItemState, StyleProp<ViewStyle>>;
  /** Item content, rendered inside the `Pressable`. */
  children?: ReactNode;
  /**
   * Matchable text for menu filtering (`MenuInput`): the item hides
   * while a non-empty query matches nothing in this text. Defaults
   * to bare string children; items without text always show.
   */
  filterText?: string;
  /**
   * Fires with `value` on activation, before `onClick` and close.
   * Requires `value` — without one there is nothing to report.
   */
  onSelect?: (value: string) => void;
  /** Fires on activation (Base UI parity), after `onSelect`. */
  onClick?: (event: unknown) => void;
  /**
   * Whether activation closes the menu. Default `true`.
   */
  closeOnClick?: boolean;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<MenuItemState, SlotProps>;
};

export type MenuArrowProps = {
  testID?: string;
  /**
   * Marker style, caller-provided. Positioning is caller geometry:
   * the part carries no anchor/popup measurements (documented in
   * the module note) — it renders where the caller puts it.
   */
  style?: StyleProp<ViewStyle>;
  /** Marker content (usually none — the shape is caller style). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export function MenuGroup({
  testID,
  style,
  children,
  render,
}: MenuGroupProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "group",
      testID,
      style,
      children,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View accessibilityRole="group" testID={testID} style={style}>
      {children}
    </View>
  );
}

export function MenuGroupLabel({
  testID,
  style,
  children,
  render,
}: MenuGroupLabelProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function MenuLinkItem({
  value,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  filterText,
  onSelect,
  onClick,
  closeOnClick = true,
  render,
}: MenuLinkItemProps): React.ReactNode {
  const { disclosure, highlighted, setHighlighted, selectItem } =
    useMenuItemActivation({ disabled, value, onSelect, onClick, closeOnClick });
  const { visible: filterVisible, key: itemKey } = useMenuFilterItem(
    disclosure?.filter ?? null,
    menuItemFilterText(filterText, children),
    value,
  );
  const isTypeahead = Boolean(
    disclosure?.highlightedKey &&
      (disclosure.highlightedKey === itemKey ||
        (value !== undefined && disclosure.highlightedKey === value)),
  );
  const state: MenuItemState = {
    disabled,
    highlighted: highlighted || isTypeahead,
  };

  // Outside a Menu there is no disclosure to close: render inert
  // rather than dropping the node silently (the `MenuItem`
  // precedent). The link role is kept — namelessness would be the
  // bigger lie.
  if (!disclosure) {
    const substituted = resolveRender(
      render,
      {
        role: "link",
        accessibilityState: { disabled: true },
        accessibilityLabel,
        testID,
        disabled: true,
        style: resolveStyle(style, { disabled: true, highlighted: false }),
        children,
      } satisfies SlotProps,
      { disabled: true, highlighted: false },
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        role="link"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled
        style={resolveStyle(style, { disabled: true, highlighted: false })}
      >
        {children}
      </Pressable>
    );
  }

  // Presence is mount/unmount: a closed menu shows the trigger only.
  if (!disclosure.open) return null;

  // Filtered out: hidden while the query matches nothing in this
  // item's text (stays mounted, so registration persists).
  if (!filterVisible) return null;

  const substituted = resolveRender(
    render,
    {
      role: "link",
      accessibilityState: { disabled },
      accessibilityLabel,
      testID,
      disabled,
      onPress: selectItem,
      onPressIn: () => setHighlighted(true),
      onPressOut: () => setHighlighted(false),
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      role="link"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={selectItem}
      onPressIn={() => setHighlighted(true)}
      onPressOut={() => setHighlighted(false)}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function MenuArrow({
  testID,
  style,
  children,
  render,
}: MenuArrowProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View accessible={false} testID={testID} style={style}>
      {children}
    </View>
  );
}

export type MenuCheckboxItemState = {
  /** Whether the item is currently checked. */
  checked: boolean;
  /** Whether the item is currently disabled. */
  disabled: boolean;
  /**
   * Whether the item is pressed. Touch has no hover or keyboard
   * focus to highlight with — the press is the highlight (same
   * touch adaptation as `MenuItemState.highlighted`).
   */
  highlighted: boolean;
};

export type MenuCheckboxItemProps = {
  /** Controlled checked state. Wins over `defaultChecked` when defined. */
  checked?: boolean;
  /** Uncontrolled initial checked state. Default `false`. */
  defaultChecked?: boolean;
  /** Fires with the next checked state on every committed toggle. */
  onCheckedChange?: (checked: boolean) => void;
  /** Terminal: it never toggles and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of item state, caller-provided. */
  style?: StateStyle<MenuCheckboxItemState, StyleProp<ViewStyle>>;
  /** Item content (indicator + label composed by the caller). */
  children?: ReactNode;
  /**
   * Matchable text for menu filtering (`MenuInput`): the item hides
   * while a non-empty query matches nothing in this text. Defaults
   * to bare string children; items without text always show.
   */
  filterText?: string;
  /**
   * Whether activation closes the menu. Default `false` (a
   * settings toggle stays open; pass `true` for one-shot
   * confirms).
   */
  closeOnClick?: boolean;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<MenuCheckboxItemState, SlotProps>;
};

export type MenuCheckboxItemIndicatorProps = {
  testID?: string;
  /** Indicator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Indicator content (check mark). Rendered only while checked. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type MenuRadioGroupProps = {
  /** Controlled selected value (`null` nothing selected). Wins over `defaultValue`. */
  value?: string | null;
  /** Uncontrolled initial selected value. Default `null`. */
  defaultValue?: string | null;
  /** Fires with the next value on every committed selection. */
  onValueChange?: (value: string) => void;
  /** Group content (`MenuGroupLabel` + `MenuRadioItem` elements). */
  children?: ReactNode;
};

export type MenuRadioItemState = {
  /** Whether this item is the selected one. */
  selected: boolean;
  /** Whether the item is currently disabled. */
  disabled: boolean;
  /**
   * Whether the item is pressed (touch adaptation — see
   * `MenuCheckboxItemState.highlighted`).
   */
  highlighted: boolean;
};

export type MenuRadioItemProps = {
  /** Item value identifying this option (required — group identity). */
  value: string;
  /** Terminal: it never selects and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of item state, caller-provided. */
  style?: StateStyle<MenuRadioItemState, StyleProp<ViewStyle>>;
  /** Item content (indicator + label composed by the caller). */
  children?: ReactNode;
  /**
   * Matchable text for menu filtering (`MenuInput`): the item hides
   * while a non-empty query matches nothing in this text. Defaults
   * to bare string children; items without text always show.
   */
  filterText?: string;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<MenuRadioItemState, SlotProps>;
};

export type MenuRadioItemIndicatorProps = {
  testID?: string;
  /** Indicator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Indicator content. Rendered only while selected. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

type MenuCheckDisclosure = {
  /** Currently checked (checkbox item) or selected (radio item). */
  active: boolean;
};

/**
 * Active state for indicator parts. Internal (not exported): an
 * indicator renders its children only while its item is active,
 * mirroring Base UI's indicator behavior without a second state
 * owner.
 */
const MenuCheckDisclosureContext = createContext<MenuCheckDisclosure | null>(
  null,
);

export function MenuCheckboxItem({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  filterText,
  closeOnClick = false,
  render,
}: MenuCheckboxItemProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  const { visible: filterVisible } = useMenuFilterItem(
    disclosure?.filter ?? null,
    menuItemFilterText(filterText, children),
  );
  const [isChecked, setChecked] = useControllableState<boolean>(
    checked,
    defaultChecked,
    onCheckedChange,
  );
  const [highlighted, setHighlighted] = useState(false);
  const active = isChecked ?? false;
  const state: MenuCheckboxItemState = {
    checked: active,
    disabled,
    highlighted,
  };

  const toggleChecked = useCallback(
    (_event: unknown) => {
      if (disabled) return;
      setChecked((previous) => {
        const next = !(previous ?? false);
        if (closeOnClick) disclosure?.close();
        return next;
      });
    },
    [disabled, setChecked, closeOnClick, disclosure],
  );

  // Outside a Menu there is no disclosure to close: render inert
  // rather than dropping the node silently (the `MenuItem`
  // precedent).
  if (!disclosure) {
    const substituted = resolveRender(
      render,
      {
        accessibilityRole: "checkbox",
        accessibilityState: { checked: false, disabled: true },
        accessibilityLabel,
        testID,
        disabled: true,
        style: resolveStyle(style, {
          checked: false,
          disabled: true,
          highlighted: false,
        }),
        children,
      } satisfies SlotProps,
      { checked: false, disabled: true, highlighted: false },
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false, disabled: true }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled
        style={resolveStyle(style, {
          checked: false,
          disabled: true,
          highlighted: false,
        })}
      >
        {children}
      </Pressable>
    );
  }

  // Presence is mount/unmount: a closed menu shows the trigger only.
  if (!disclosure.open) return null;

  // Filtered out: hidden while the query matches nothing in this
  // item's text (stays mounted, so registration persists).
  if (!filterVisible) return null;

  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "checkbox",
      accessibilityState: { checked: active, disabled },
      accessibilityLabel,
      testID,
      disabled,
      onPress: toggleChecked,
      onPressIn: () => setHighlighted(true),
      onPressOut: () => setHighlighted(false),
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <MenuCheckDisclosureContext.Provider value={{ active }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: active, disabled }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled={disabled}
        onPress={toggleChecked}
        onPressIn={() => setHighlighted(true)}
        onPressOut={() => setHighlighted(false)}
        style={resolveStyle(style, state)}
      >
        {children}
      </Pressable>
    </MenuCheckDisclosureContext.Provider>
  );
}

export function MenuCheckboxItemIndicator({
  testID,
  style,
  children,
  render,
}: MenuCheckboxItemIndicatorProps): React.ReactNode {
  const check = useContext(MenuCheckDisclosureContext);
  // Rendered only while the enclosing item is checked (Base UI
  // indicator behavior). Outside an item there is no checked state
  // to read: render nothing rather than a permanently dark or
  // permanently lit mark.
  if (!check?.active) return null;
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}

export function MenuRadioGroup({
  value,
  defaultValue = null,
  onValueChange,
  children,
}: MenuRadioGroupProps): React.JSX.Element {
  const [current, setCurrent] = useControllableState<string | null>(
    value,
    defaultValue,
    (next) => {
      // Selections are always values; `null` is the empty initial,
      // never a reported transition (no deselect in single-select).
      if (next !== null) onValueChange?.(next);
    },
  );

  return (
    <MenuRadioGroupContext.Provider
      value={{ value: current ?? null, setValue: setCurrent }}
    >
      {children}
    </MenuRadioGroupContext.Provider>
  );
}

type MenuRadioGroupDisclosure = {
  /** Currently selected value (`null` nothing selected). */
  value: string | null;
  /** Select `value`. */
  setValue: (value: string) => void;
};

/**
 * Group selection state. Internal (not exported).
 */
const MenuRadioGroupContext = createContext<MenuRadioGroupDisclosure | null>(
  null,
);

export function MenuRadioItem({
  value,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  filterText,
  render,
}: MenuRadioItemProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  const group = useContext(MenuRadioGroupContext);
  const { visible: filterVisible } = useMenuFilterItem(
    disclosure?.filter ?? null,
    menuItemFilterText(filterText, children),
  );
  const [highlighted, setHighlighted] = useState(false);
  const selected = group !== null && group.value === value;
  const state: MenuRadioItemState = { selected, disabled, highlighted };

  const selectOption = useCallback(() => {
    if (disabled) return;
    group?.setValue(value);
    disclosure?.close();
  }, [disabled, group, value, disclosure]);

  // Outside a menu there is no disclosure to close: render inert
  // rather than dropping the node silently. Outside a group there
  // is no selection to join: likewise inert.
  if (!disclosure || !group) {
    const substituted = resolveRender(
      render,
      {
        accessibilityRole: "radio",
        accessibilityState: { selected: false, disabled: true },
        accessibilityLabel,
        testID,
        disabled: true,
        style: resolveStyle(style, {
          selected: false,
          disabled: true,
          highlighted: false,
        }),
        children,
      } satisfies SlotProps,
      { selected: false, disabled: true, highlighted: false },
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: false, disabled: true }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled
        style={resolveStyle(style, {
          selected: false,
          disabled: true,
          highlighted: false,
        })}
      >
        {children}
      </Pressable>
    );
  }

  // Presence is mount/unmount: a closed menu shows the trigger only.
  if (!disclosure.open) return null;

  // Filtered out: hidden while the query matches nothing in this
  // item's text (stays mounted, so registration persists).
  if (!filterVisible) return null;

  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "radio",
      accessibilityState: { selected, disabled },
      accessibilityLabel,
      testID,
      disabled,
      onPress: selectOption,
      onPressIn: () => setHighlighted(true),
      onPressOut: () => setHighlighted(false),
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <MenuCheckDisclosureContext.Provider value={{ active: selected }}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled={disabled}
        onPress={selectOption}
        onPressIn={() => setHighlighted(true)}
        onPressOut={() => setHighlighted(false)}
        style={resolveStyle(style, state)}
      >
        {children}
      </Pressable>
    </MenuCheckDisclosureContext.Provider>
  );
}

export function MenuRadioItemIndicator({
  testID,
  style,
  children,
  render,
}: MenuRadioItemIndicatorProps): React.ReactNode {
  const check = useContext(MenuCheckDisclosureContext);
  // Rendered only while the enclosing item is selected. Outside an
  // item there is no selection to read: render nothing.
  if (!check?.active) return null;
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Filter parts (compound `MenuRoot` only)                              */
/*                                                                      */
/* `MenuInput` binds a text entry to the root's filter query, items     */
/* hide while the query matches nothing in their `filterText`,         */
/* `MenuClear` resets the query, and `MenuEmpty` renders when the      */
/* query matches nothing at all. Items publish through the             */
/* `collection` registry; `MenuEmpty` counts the same                  */
/* visibility rule items hide by, so the two can never disagree.       */
/* Axis additions (Base UI's Menu has no filter parts): the names      */
/* follow the documented `Input`/`Clear`/`Empty` plan.                 */
/* ------------------------------------------------------------------ */

export type MenuInputProps = {
  /** Placeholder text for the filter entry. */
  placeholder?: string;
  /** Accessible name source for the filter entry. */
  accessibilityLabel?: string;
  testID?: string;
  /** Filter entry style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Terminal: the query never changes. Default `false`. */
  disabled?: boolean;
  /** Forwarded to the entry `TextInput`. */
  ref?: Ref<ElementRef<typeof TextInput>>;
};

export type MenuClearState = {
  /** The current filter query. */
  query: string;
  /** Whether clearing is currently disabled (no query, or terminal). */
  disabled: boolean;
};

export type MenuClearProps = {
  testID?: string;
  /** Value or function of clear state, caller-provided. */
  style?: StateStyle<MenuClearState, StyleProp<ViewStyle>>;
  /** Clear content (label composed by the caller). */
  children?: ReactNode;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /** Terminal: the query never clears. Default `false`. */
  disabled?: boolean;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<MenuClearState, SlotProps>;
};

export type MenuEmptyProps = {
  testID?: string;
  /** Empty-state style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Empty-state content ("No matches" composed by the caller). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

/**
 * Assign one value to every ref in the list, for the entry host.
 * Inline here (not imported) deliberately — the contract rule, see
 * every other part in this package.
 */
function assignFilterInputRef(
  ref: MenuInputProps["ref"],
  value: ElementRef<typeof TextInput> | null,
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

export function MenuInput({
  placeholder,
  accessibilityLabel,
  testID,
  style,
  disabled = false,
  ref,
}: MenuInputProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  const filter = disclosure?.filter ?? null;

  const setEntryRef = useCallback(
    (node: ElementRef<typeof TextInput> | null) => {
      assignFilterInputRef(ref, node);
    },
    [ref],
  );

  // The root owns the filter query: an entry bound to nothing would
  // lie about filtering.
  if (!disclosure || !filter) return null;
  // Presence is mount/unmount: a closed menu shows the trigger only.
  if (!disclosure.open) return null;

  return (
    <TextInput
      ref={setEntryRef}
      value={filter.query}
      onChangeText={filter.setQuery}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      editable={!disabled}
      style={style}
    />
  );
}

export function MenuClear({
  testID,
  style,
  children,
  accessibilityLabel,
  disabled = false,
  render,
}: MenuClearProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  const filter = disclosure?.filter ?? null;
  const query = filter?.query ?? "";
  // Nothing to clear is the disabled state: an enabled Clear with
  // an empty query would promise an action it cannot take.
  const effectiveDisabled = disabled || query === "";
  const state: MenuClearState = { query, disabled: effectiveDisabled };

  const clearQuery = useCallback(() => {
    if (effectiveDisabled) return;
    filter?.setQuery("");
  }, [effectiveDisabled, filter]);

  if (!disclosure || !filter) return null;
  if (!disclosure.open) return null;

  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled,
      onPress: clearQuery,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={clearQuery}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function MenuEmpty({
  testID,
  style,
  children,
  render,
}: MenuEmptyProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  const filter = disclosure?.filter ?? null;
  if (!disclosure || !filter) return null;
  if (!disclosure.open) return null;
  // Shows only under a real query with zero visible items, counted
  // by the same rule items hide by (`isFilterVisible`) — the two
  // can never disagree about what "no matches" means.
  if (filter.query.trim() === "") return null;
  const visible = filter.items.filter((item) =>
    isFilterVisible(filter.query, item.text),
  );
  if (visible.length > 0) return null;

  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Submenu parts (Base UI Menu.SubmenuRoot / SubmenuTrigger parity)   */
/* ------------------------------------------------------------------ */

export type MenuSubmenuRootProps = {
  /** Value identifying this submenu branch in the cascade. */
  value: string;
  /** Submenu content (`MenuSubmenuTrigger` and popup/panel parts). */
  children: ReactNode;
};

/**
 * MenuSubmenuRoot — a nested menu branch (Base UI Menu.SubmenuRoot parity).
 *
 * Mapped to the unified cascade model (`DropdownMenuSub` precedent):
 * manages nested disclosure and auto-registers its depth in the active
 * path. Re-exports/wraps `DropdownMenuSub` to provide the compound
 * naming callers expect without duplicating state machines.
 */
export function MenuSubmenuRoot({
  value,
  children,
}: MenuSubmenuRootProps): React.JSX.Element | null {
  const dropdownDisclosure = useContext(DropdownDisclosureContext);
  const menuSub = useContext(MenuSubContext);

  if (dropdownDisclosure) {
    return <DropdownMenuSub value={value}>{children}</DropdownMenuSub>;
  }
  if (!menuSub) return null;
  const depth = menuSub.subDepth;
  const sub: MenuSubIdentity = { value, depth };
  return (
    <MenuSubContext.Provider value={{ ...menuSub, sub, subDepth: depth + 1 }}>
      {children}
    </MenuSubContext.Provider>
  );
}

export type MenuSubmenuTriggerProps = {
  testID?: string;
  style?: StateStyle<
    { open: boolean; disabled: boolean },
    StyleProp<ViewStyle>
  >;
  children?: ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  render?: RenderProp<{ open: boolean; disabled: boolean }, SlotProps>;
};

/**
 * MenuSubmenuTrigger — opens an enclosing `MenuSubmenuRoot` on press
 * (Base UI Menu.SubmenuTrigger parity).
 */
export function MenuSubmenuTrigger({
  testID,
  style,
  children,
  disabled = false,
  accessibilityLabel,
  render,
}: MenuSubmenuTriggerProps): React.ReactNode {
  const dropdownDisclosure = useContext(DropdownDisclosureContext);
  const menuSub = useContext(MenuSubContext);
  const identity = menuSub?.sub ?? null;
  const expanded =
    identity !== null && menuSub?.openPath[identity.depth] === identity.value;

  const toggleSub = useCallback(() => {
    if (disabled || identity === null) return;
    if (expanded) {
      menuSub?.closeSub(identity.depth);
    } else {
      menuSub?.openSub(identity.value, identity.depth);
    }
  }, [disabled, identity, expanded, menuSub]);

  if (dropdownDisclosure) {
    return (
      <DropdownMenuSubTrigger
        testID={testID}
        style={
          style as
            | StyleProp<ViewStyle>
            | ((state: { open: boolean }) => StyleProp<ViewStyle>)
        }
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        render={render as RenderProp<{ open: boolean }, SlotProps>}
      >
        {children}
      </DropdownMenuSubTrigger>
    );
  }

  const inert = identity === null;
  const state = { open: expanded, disabled: disabled || inert };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { expanded, disabled: disabled || inert },
      accessibilityLabel,
      testID,
      disabled: disabled || inert,
      onPress: toggleSub,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded, disabled: disabled || inert }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled || inert}
      onPress={toggleSub}
      style={resolveStyle(style, state)}
    >
      {wrapText(children)}
    </Pressable>
  );
}

export type MenuSubmenuContentProps = {
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  render?: RenderProp<Record<string, never>, SlotProps>;
};

/**
 * MenuSubmenuContent — content panel rendered only while its enclosing
 * `MenuSubmenuRoot` is active.
 */
export function MenuSubmenuContent({
  testID,
  style,
  children,
  render,
}: MenuSubmenuContentProps): React.ReactNode {
  const dropdownDisclosure = useContext(DropdownDisclosureContext);
  const menuSub = useContext(MenuSubContext);

  if (dropdownDisclosure) {
    return (
      <DropdownMenuSubContent testID={testID} style={style} render={render}>
        {children}
      </DropdownMenuSubContent>
    );
  }
  const identity = menuSub?.sub ?? null;
  if (!menuSub || identity === null) return null;
  if (menuSub.openPath[identity.depth] !== identity.value) return null;

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      role: "menu",
      testID,
      style,
      children,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <View accessible role="menu" testID={testID} style={style}>
      {children}
    </View>
  );
}
