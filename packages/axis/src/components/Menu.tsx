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
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
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
  /** Anchor host for `MenuPositioner` measurement (compound only). */
  anchorHostRef: { current: ElementRef<typeof View> | null };
  /** Register the trigger host for positioner measurement. */
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
};

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

export function MenuItem({
  value,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  onSelect,
  onClick,
  closeOnClick = true,
  render,
}: MenuItemProps): React.ReactNode {
  const disclosure = useContext(MenuDisclosureContext);
  const [highlighted, setHighlighted] = useState(false);
  const state: MenuItemState = { disabled, highlighted };

  const selectItem = useCallback(
    (event: unknown) => {
      if (disabled) return;
      if (value !== undefined) onSelect?.(value);
      onClick?.(event);
      if (closeOnClick) disclosure?.close();
    },
    [disabled, onSelect, onClick, value, closeOnClick, disclosure],
  );

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
      anchorHostRef,
      setAnchorRef: ignoreAnchorRef,
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
/* Item (shared, extended with `onClick`/`closeOnClick` and            */
/* `highlighted` press state), Separator — with `render`               */
/* element/function composition and value-or-function `style` on       */
/* every part. Omitted Base UI pieces are documented deviations, not   */
/* oversights: no `Arrow` (positioning-marker geometry is caller       */
/* style; a marker with no measurement coupling is chrome), no        */
/* checkbox/radio/group items yet (their own slice — settings menus   */
/* need them, and they deserve controlled-state APIs of their own),    */
/* no `LinkItem` (a menu item rendering a link is caller content in   */
/* an `Item`), no `Input`/`Clear`/`Empty`/`FilterProvider` filtering   */
/* (needs the `collection` transfer + typeahead design), no hover or   */
/* keyboard traversal (D8), no animation states (D9), and no `data-*`  */
/* attributes (D1 — state flows through function `style`/`render`      */
/* props instead). Non-modal menus (no Backdrop) defer with reason:    */
/* outside-press detection without a scrim needs press-capture on     */
/* the root view, which would hijack touches meant for the app.        */
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

  const disclosure = useMemo<MenuDisclosure>(
    () => ({
      open: isOpen ?? false,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      anchorHostRef,
      setAnchorRef,
    }),
    [isOpen, toggle, close, dismiss, disablePointerDismissal, setAnchorRef],
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
  // that is the point of the part.
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
