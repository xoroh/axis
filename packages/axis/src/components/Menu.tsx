import {
  Children,
  cloneElement,
  createContext,
  type ElementRef,
  isValidElement,
  type ReactElement,
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
  Modal,
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
import { useControllableState } from "../useControllableState";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Menu — an unstyled popup menu with scrim dismissal.
 *
 * Structure only: a `View` container holding a trigger zone (measured
 * as the floating anchor) and, only while open, a full-area scrim
 * `Pressable` plus a content `View` carrying the `menu` role with the
 * `MenuItem` children inside it. No default visuals — every visual
 * value (`style` on the menu box, `style` on each part) is
 * caller-provided. State follows the `useControllableState` pattern:
 * `open` (+ `onOpenChange`) for controlled use, `defaultOpen` for
 * uncontrolled (default `false`).
 *
 * Compound shape: the caller composes trigger content with `MenuItem`
 * children inside `Menu`. `Menu` partitions direct children by element
 * type — `MenuItem` elements render only while open inside the content
 * box; every other child renders always in the trigger zone. A
 * `MenuTrigger` child is already context-wired and renders as-is; any
 * other trigger-zone element gets its `onPress` composed with the
 * context toggle (internal toggle first, then the caller's handler, the
 * `slot` composition precedent), so a plain caller `Pressable` works
 * as the trigger without importing `MenuTrigger`. A trigger-zone child
 * with `disabled` never toggles — `disabled` is terminal (the
 * `usePress` precedent) — and its own `onPress` does not fire either.
 *
 * Positioning reuses `useFloatingPlacement` (the `Tooltip` precedent):
 * the trigger wrapper is measured through its host ref and the content
 * stays transparent at origin until both measurements exist. The scrim
 * is a sibling rendered before the content (so the content paints
 * above it): scrim press dismisses through `onDismiss` +
 * `onOpenChange(false)` (the `Dialog` scrim precedent, minus the
 * `Modal` — this menu paints inside its parent's box). While open the
 * scrim covers the trigger zone, so pressing the trigger dismisses
 * through the scrim path rather than toggling.
 *
 * Closed presence is mount/unmount: closed renders the trigger zone
 * only — no content, no items, no scrim.
 *
 * Deferred, each for a named reason (not oversight):
 * - No animation: content mounts/unmounts synchronously with state.
 *   Exit transitions would need the `presence` model to keep the
 *   content mounted until the animation finishes; until a consumer
 *   needs animated dismissal, that machinery buys zero observed
 *   behavior (the Accordion panel precedent).
 * - No submenus: nested levels need a dismissal-stack owner
 *   (`overlayModality`/`dismissWiring`) so an outer press does not
 *   fight an inner one; a lone menu owning that stack is premature.
 * - No hover or keyboard navigation: pointer hover has no touch
 *   equivalent and arrow-key traversal belongs to the
 *   `roving`/`collection` models, which no section has adopted for
 *   menus yet (the contract's conditional-keyboard rule).
 * - No portal/`Modal` host: the scrim fills the menu container, not the
 *   whole screen. Painting outside the parent's box is the `portal`
 *   model's job, deferred until a consumer needs it.
 *
 * Test ids: the content box carries `testID`; the scrim carries
 * `<testID>-scrim` when `testID` is given (the Accordion `-panel` /
 * Dialog `-scrim` precedent). The scrim is labelled "Dismiss menu".
 */

export type MenuProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed toggle or dismissal. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /** Preferred side for the content box. Default handled by the positioning model. Clamped into the viewport. */
  placement?: Placement;
  testID?: string;
  /** Menu content box style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Trigger content plus `MenuItem` elements, composed by the caller. */
  children: ReactNode;
  /** Forwarded to the menu container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

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
  /** Scrim/outside dismissal (monolith: same as close; compound: `onDismiss` first). */
  dismiss: () => void;
  /** Backdrop press dismisses (compound Root prop; monolith always dismisses). */
  disablePointerDismissal: boolean;
  /** Portal presents modally with a scrim (compound Root prop; monolith always modal). */
  modal: boolean;
  /** Anchor host for `MenuPositioner` measurement (compound only). */
  anchorHostRef: { current: ElementRef<typeof View> | null };
  /** Register the trigger host for positioner measurement. */
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
  /**
   * Filter state for `MenuInput`/`MenuClear`/`MenuEmpty` plus item
   * registration (compound `MenuRoot` only; the monolith carries
   * `null` — filter parts render nothing there, documented on
   * `MenuRoot`).
   */
  filter: MenuFilter | null;
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
): boolean {
  const key = useId();
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
  if (!filter) return true;
  return isFilterVisible(filter.query, resolved);
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
 * (not exported): parts must render inside a `Menu` to participate;
 * outside one the trigger renders collapsed and inert and an item
 * renders inert, like `AccordionItem` outside its group.
 */
const MenuDisclosureContext = createContext<MenuDisclosure | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: MenuProps["ref"],
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
  // any menu root (monolith or compound); outside a root there is
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
  const filterVisible = useMenuFilterItem(
    disclosure?.filter ?? null,
    menuItemFilterText(filterText, children),
  );
  const state: MenuItemState = { disabled, highlighted };

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

function MenuInlineRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  placement,
  testID,
  style,
  children,
  ref,
}: MenuProps): React.JSX.Element {
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

  // Scrim (and request-close equivalent) path: `onDismiss` first, then
  // report `false` — the `Dialog` dismissal precedent.
  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false);
  }, [onDismiss, setOpen]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setContainerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  // Measured anchor for `useFloatingPlacement` (the `Tooltip`
  // `anchorHostRef` pattern): the trigger wrapper's `measure()` gives
  // window coordinates that `onLayout` alone cannot.
  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  // The monolith measures its trigger WRAPPER (above), not the
  // trigger part: trigger registration is ignored here so the
  // compound `MenuTrigger`'s anchor write cannot move the monolith's
  // measured anchor. Zero behavior change by construction.
  const ignoreAnchorRef = useCallback(() => {}, []);

  const floating = useFloatingPlacement({
    anchorRef: anchorHostRef,
    placement,
    active: isOpen ?? false,
  });

  const disclosure = useMemo<MenuDisclosure>(
    () => ({
      open: isOpen ?? false,
      toggle,
      close,
      dismiss,
      disablePointerDismissal: false,
      modal: true,
      anchorHostRef,
      setAnchorRef: ignoreAnchorRef,
      // The monolith partitions children by type with no filter
      // composition point: filter parts render nothing here
      // (compound `MenuRoot` owns filtering).
      filter: null,
    }),
    [isOpen, toggle, close, dismiss, ignoreAnchorRef],
  );

  // Partition direct children by element type: `MenuItem` elements
  // belong to the content box (mounted only while open); everything
  // else is trigger-zone content, always rendered.
  const triggerNodes: ReactNode[] = [];
  const itemNodes: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === MenuItem) {
      itemNodes.push(child);
    } else {
      triggerNodes.push(child);
    }
  });

  // Wire caller-provided trigger elements that are not already a
  // context-wired `MenuTrigger`: compose their `onPress` with the
  // context toggle (internal first, the `slot` composition precedent).
  // `disabled` on the child is terminal — neither toggle nor the
  // child's own handler fires.
  const wiredTriggers = triggerNodes.map((node, index) => {
    if (isValidElement(node) && node.type !== MenuTrigger) {
      const childProps = node.props as {
        disabled?: unknown;
        onPress?: unknown;
      };
      const childDisabled = childProps.disabled === true;
      const childOnPress =
        typeof childProps.onPress === "function"
          ? (childProps.onPress as (event: unknown) => void)
          : undefined;
      return cloneElement(
        node as ReactElement<{ onPress?: (event: unknown) => void }>,
        {
          key: node.key ?? `menu-trigger-${index}`,
          onPress: (event: unknown) => {
            if (childDisabled) return;
            toggle();
            childOnPress?.(event);
          },
        },
      );
    }
    return node;
  });

  return (
    <View ref={setContainerRef}>
      <MenuDisclosureContext.Provider value={disclosure}>
        <View ref={setAnchorRef}>{wiredTriggers}</View>
        {isOpen ? (
          <>
            <Pressable
              accessibilityLabel="Dismiss menu"
              testID={testID ? `${testID}-scrim` : undefined}
              onPress={dismiss}
              style={SCRIM_FILL}
            />
            <View
              accessible
              role="menu"
              testID={testID}
              onLayout={floating.onContentLayout}
              style={[floating.style, style]}
            >
              {itemNodes}
            </View>
          </>
        ) : null}
      </MenuDisclosureContext.Provider>
    </View>
  );
}

export { MenuInlineRoot as Menu };

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* `<Menu>` above is the concise inline API (trigger zone + in-box     */
/* scrim + content, children partitioned by type). The parts below     */
/* mirror Base UI's Menu anatomy — Root (state owner, renders no       */
/* element), Trigger (shared with the monolith, extended with          */
/* `render` and anchor registration), Portal (an RN `Modal`: the       */
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
/* `style`/`render` props instead). Filter parts work in the compound  */
/* form only (the monolith partitions children by type with no filter  */
/* composition point). Non-modal menus (`modal={false}` on the Root)   */
/* render the portal in-box with no Backdrop; outside-press without  */
/* a scrim is a documented limitation (press-capture would hijack    */
/* app touches).                                                     */
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
   * Whether the open menu presents modally (a `Modal` host with a
   * scrim). Default `true`. When `false` the portal renders
   * in-box like the monolith: no scrim, and the trigger stays
   * pressable so it toggles closed — but presses outside the menu
   * reach the underlying app instead of dismissing (documented
   * limitation: outside-press detection without a scrim needs
   * press-capture that would hijack app touches).
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
    [filterQuery, setFilterQuery, filterItems, registerFilterItem, unregisterFilterItem],
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
    ],
  );

  // The root owns state, never layout: no host element (Base UI parity).
  return (
    <MenuDisclosureContext.Provider value={disclosure}>
      {children}
    </MenuDisclosureContext.Provider>
  );
}

export function MenuPortal({
  children,
  testID,
}: MenuPortalProps): React.JSX.Element | null {
  const disclosure = useContext(MenuDisclosureContext);
  // Outside a root there is no open state to present: render nothing.
  if (!disclosure) return null;
  if (!disclosure.open) return null;

  // The RN portal host: a transparent `Modal` presents above the app
  // (the native equivalent of appending to `body`). `container` has
  // no native meaning and is omitted by design. Unlike the monolith
  // (in-box scrim), the compound menu escapes clipped parents —
  // that is the point of the part. Non-modal roots render in-box
  // with no scrim instead (the monolith shape): presses outside
  // reach the app rather than dismissing (documented on `modal`).
  if (!disclosure.modal) {
    return <View testID={testID}>{children}</View>;
  }
  return (
    <Modal
      transparent
      visible={disclosure.open}
      onRequestClose={disclosure.dismiss}
      testID={testID}
    >
      {children}
    </Modal>
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
  // fake affordance (the monolith's non-dismissable precedent has no
  // scrim at all; the compound keeps the layer for layout parity
  // with the dismissable shape).
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
  side,
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
  const state: MenuPositionerState = { open: disclosure.open };

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
  const filterVisible = useMenuFilterItem(
    disclosure?.filter ?? null,
    menuItemFilterText(filterText, children),
  );
  const state: MenuItemState = { disabled, highlighted };

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
  const filterVisible = useMenuFilterItem(
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
  const filterVisible = useMenuFilterItem(
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

  // Compound roots only: the monolith has no filter composition
  // point, and an entry bound to nothing would lie about filtering.
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
