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
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * NavigationMenu — an unstyled top-level navigation bar with flyout panels.
 *
 * Structure only: a bar row of triggers, each opening one panel below
 * the bar; exactly one panel is open at a time. No default visuals —
 * every visual value is caller-provided (the bar lays its triggers in
 * a row by default; direction is structure here the way bottom
 * anchoring is structure for `Sheet`). The open item follows the
 * `useControllableState` pattern (`openValue`/`defaultOpenValue`/
 * `onOpenValueChange`, `null` closed): the open panel is application
 * state (it drives navigation), unlike a dropdown cascade path.
 *
 * Compound shape (the `Menu` precedent): the caller composes
 * `NavigationMenuItem` elements inside `NavigationMenu`; each item
 * partitions its children by type into trigger content and one
 * `NavigationMenuPanel`. A context-wired `NavigationMenuTrigger`
 * opens its item; any other trigger-zone element gets its `onPress`
 * composed with the open (internal open first, then the caller's
 * handler, the `slot` composition precedent). While open the scrim
 * covers the bar, so pressing the open trigger dismisses through the
 * scrim path rather than toggling (the `Menu` precedent). Panels
 * render in flow below the bar; fly-out geometry beyond that is
 * caller `style`.
 *
 * Closed presence is mount/unmount: closed renders the bar only — no
 * panels, no scrim.
 *
 * Deferred, each for a named reason (not oversight): no animation
 * (the `Menu` rationale), no hover or keyboard traversal (no touch
 * equivalent; `roving`/`collection` unadopted for menus), no
 * portal/`Modal` host (paints inside the parent's box).
 *
 * Test ids: the open panel carries its own `testID` when the caller
 * provides one; the scrim carries `<testID>-scrim` from the root
 * `testID` (the `Menu` precedent). The scrim is labelled
 * "Dismiss menu".
 */

export type NavigationMenuProps = {
  /** Controlled open item value (`null` closed). Wins over `defaultOpenValue`. */
  openValue?: string | null;
  /** Uncontrolled initial open item value. Default `null` (closed). */
  defaultOpenValue?: string | null;
  /** Fires with the next open value on every committed open or dismissal. */
  onOpenValueChange?: (value: string | null) => void;
  /** Fires on scrim dismissal, before `onOpenValueChange(null)`. */
  onDismiss?: () => void;
  testID?: string;
  /** Bar container style, caller-provided (row layout is default). */
  style?: StyleProp<ViewStyle>;
  /** `NavigationMenuItem` elements. */
  children: ReactNode;
  /** Forwarded to the bar container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type NavigationMenuItemProps = {
  /** Item value identifying this trigger/panel pair (required). */
  value: string;
  /** Trigger content plus one `NavigationMenuPanel`. */
  children: ReactNode;
};

export type NavigationMenuTriggerProps = {
  testID?: string;
  /** Trigger pressable style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Trigger content (required — an empty trigger is a bug). */
  children: ReactNode;
  /** Terminal: it never opens and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
};

export type NavigationMenuPanelProps = {
  testID?: string;
  /** Panel style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Panel content. */
  children?: ReactNode;
};

type NavigationDisclosure = {
  /** Currently open item value (`null` closed). */
  openValue: string | null;
  /** Open `value`, closing any other panel. */
  openItem: (value: string) => void;
  /** Dismiss through `onDismiss`, then report closed. */
  dismiss: () => void;
  /** Set inside a `NavigationMenuItem` for its trigger. */
  item: string | null;
};

/**
 * Shared open state. Internal (not exported): parts must render
 * inside a `NavigationMenu` to participate; outside one triggers
 * render collapsed and inert and panels render nothing, like
 * `MenuItem` outside `Menu`.
 */
const NavigationDisclosureContext = createContext<NavigationDisclosure | null>(
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
  ref: NavigationMenuProps["ref"],
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
 * Fills the menu container behind the panel. Structural only —
 * absolute fill positions the layer, no colors or spacing — so the
 * whole container dismisses on press (the `Menu` precedent).
 */
const SCRIM_FILL: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function NavigationMenuTrigger({
  testID,
  style,
  children,
  disabled = false,
  accessibilityLabel,
}: NavigationMenuTriggerProps): React.JSX.Element {
  const disclosure = useContext(NavigationDisclosureContext);
  const value = disclosure?.item ?? null;
  const expanded = value !== null && disclosure?.openValue === value;

  const openTrigger = useCallback(() => {
    if (disabled) return;
    if (value === null) return;
    disclosure?.openItem(value);
  }, [disabled, value, disclosure]);

  // Outside an item there is no value to open: render inert
  // (announced disabled, press is a no-op) rather than dropping the
  // node silently.
  const inert = value === null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded, disabled: disabled || inert }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled || inert}
      onPress={openTrigger}
      style={style}
    >
      {children}
    </Pressable>
  );
}

export function NavigationMenuPanel({
  testID,
  style,
  children,
}: NavigationMenuPanelProps): React.JSX.Element | null {
  const disclosure = useContext(NavigationDisclosureContext);
  // Panel chrome without an item is meaningless: a bare panel
  // outside a `NavigationMenuItem` renders nothing.
  if (!disclosure || disclosure.item === null) return null;
  return (
    <View accessible role="menu" testID={testID} style={style}>
      {children}
    </View>
  );
}

export function NavigationMenuItem({
  value,
  children,
}: NavigationMenuItemProps): React.JSX.Element | null {
  const disclosure = useContext(NavigationDisclosureContext);
  // Outside a menu there is no open state to participate in: render
  // nothing rather than a panel that can never open or close.
  if (!disclosure) return null;

  const triggerNodes: ReactNode[] = [];
  const panelNodes: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === NavigationMenuPanel) {
      panelNodes.push(child);
    } else {
      triggerNodes.push(child);
    }
  });

  // Wire trigger-zone elements that are not already a context-wired
  // `NavigationMenuTrigger` (the `Menu` precedent): internal open
  // first, then the caller's handler; `disabled` on the child is
  // terminal — neither fires.
  const boundTriggers = triggerNodes.map((node, index) => {
    if (isValidElement(node) && node.type !== NavigationMenuTrigger) {
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
          key: node.key ?? `navigation-trigger-${value}-${index}`,
          onPress: (event: unknown) => {
            if (childDisabled) return;
            disclosure.openItem(value);
            childOnPress?.(event);
          },
        },
      );
    }
    return node;
  });

  return (
    <NavigationDisclosureContext.Provider
      value={{ ...disclosure, item: value }}
    >
      <View>
        {boundTriggers}
        {disclosure.openValue === value ? panelNodes : null}
      </View>
    </NavigationDisclosureContext.Provider>
  );
}

function NavigationMenuRoot({
  openValue,
  defaultOpenValue = null,
  onOpenValueChange,
  onDismiss,
  testID,
  style,
  children,
  ref,
}: NavigationMenuProps): React.JSX.Element {
  const [current, setCurrent] = useControllableState<string | null>(
    openValue,
    defaultOpenValue,
    onOpenValueChange,
  );

  const openItem = useCallback(
    (value: string) => {
      setCurrent(value);
    },
    [setCurrent],
  );

  // Scrim path: `onDismiss` first, then report closed (the `Dialog`
  // dismissal precedent).
  const dismiss = useCallback(() => {
    onDismiss?.();
    setCurrent(null);
  }, [onDismiss, setCurrent]);

  const disclosure = useMemo<NavigationDisclosure>(
    () => ({ openValue: current ?? null, openItem, dismiss, item: null }),
    [current, openItem, dismiss],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render.
  const setBarRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <View ref={setBarRef}>
      <NavigationDisclosureContext.Provider value={disclosure}>
        <View style={[{ flexDirection: "row" }, style]}>{children}</View>
        {current !== null && current !== undefined ? (
          <Pressable
            accessibilityLabel="Dismiss menu"
            testID={testID ? `${testID}-scrim` : undefined}
            onPress={dismiss}
            style={SCRIM_FILL}
          />
        ) : null}
      </NavigationDisclosureContext.Provider>
    </View>
  );
}

export { NavigationMenuRoot as NavigationMenu };
