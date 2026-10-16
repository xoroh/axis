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
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { Placement } from "../positioning";
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

export type MenuTriggerProps = {
  testID?: string;
  /** Trigger pressable style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Trigger content, rendered inside the `Pressable` (required — an empty trigger is a bug). */
  children: ReactNode;
  /** Terminal: it never toggles and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
};

export type MenuItemProps = {
  /** Item value passed to `onSelect` when this item is activated (required). */
  value: string;
  /** Terminal: it never selects and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Item pressable style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Item content, rendered inside the `Pressable`. */
  children?: ReactNode;
  /** Fires with `value` on activation, before the menu closes. */
  onSelect?: (value: string) => void;
};

type MenuDisclosure = {
  open: boolean;
  toggle: () => void;
  close: () => void;
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
}: MenuTriggerProps): React.JSX.Element {
  const disclosure = useContext(MenuDisclosureContext);
  const expanded = disclosure?.open ?? false;

  const toggleTrigger = useCallback(() => {
    if (disabled) return;
    disclosure?.toggle();
  }, [disabled, disclosure]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded, disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={toggleTrigger}
      style={style}
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
}: MenuItemProps): React.JSX.Element | null {
  const disclosure = useContext(MenuDisclosureContext);

  const selectItem = useCallback(() => {
    if (disabled) return;
    onSelect?.(value);
    disclosure?.close();
  }, [disabled, onSelect, value, disclosure]);

  // Outside a Menu there is no disclosure to close: render inert
  // (announced disabled, press is a no-op) rather than dropping the
  // node silently.
  if (!disclosure) {
    return (
      <Pressable
        role="menuitem"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled
        style={style}
      >
        {children}
      </Pressable>
    );
  }

  // Presence is mount/unmount: a closed menu shows the trigger only.
  if (!disclosure.open) return null;

  return (
    <Pressable
      role="menuitem"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={selectItem}
      style={style}
    >
      {children}
    </Pressable>
  );
}

function MenuRoot({
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

  const floating = useFloatingPlacement({
    anchorRef: anchorHostRef,
    placement,
    active: isOpen ?? false,
  });

  const disclosure = useMemo<MenuDisclosure>(
    () => ({ open: isOpen ?? false, toggle, close }),
    [isOpen, toggle, close],
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

export { MenuRoot as Menu };
