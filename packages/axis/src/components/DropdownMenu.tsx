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
  useState,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * DropdownMenu — an unstyled popup menu with submenu cascade.
 *
 * Structure only: like `Menu` (trigger zone + scrim + content box
 * while open), plus `DropdownMenuSub` levels that open nested panels
 * beside their trigger. No default visuals — every visual value is
 * caller-provided. Root open state follows the `useControllableState`
 * pattern (`open`/`defaultOpen`/`onOpenChange`); the open sub-path is
 * deliberately INTERNAL state (a string array of submenu values from
 * the outermost sub inward): a cascade path is transient interaction
 * state, the pointer equivalent of hover, not application state —
 * the owned states are root open and leaf selection.
 *
 * Dismissal stack (the design `Menu` deferred submenus for): the
 * root owns one stack. Opening a submenu replaces the path from its
 * depth down (siblings close, ancestors stay); selecting any leaf
 * closes everything; scrim press closes everything through
 * `onDismiss` + `onOpenChange(false)` (the `Dialog` dismissal
 * precedent, minus the `Modal` — this menu paints inside its
 * parent's box, the `Menu` precedent). While open the scrim covers
 * the trigger zone, so pressing the trigger dismisses through the
 * scrim path rather than toggling.
 *
 * Sub panels render in flow directly after their trigger; fly-out
 * geometry (side, offset, overlap) is caller `style` — shared code
 * takes no measurements (the `positioning` precedent: math shared,
 * measurement per-consumer), and a touch cascade needs no anchor
 * tracking to be operable. Closed presence is mount/unmount at every
 * level: closed renders triggers only.
 *
 * Deferred, each for a named reason (not oversight): no animation
 * (the `Menu` rationale), no hover or keyboard traversal (no touch
 * equivalent; `roving`/`collection` unadopted for menus), no
 * portal/`Modal` host (paints inside the parent's box).
 *
 * Test ids: the content box carries `testID`; the scrim carries
 * `<testID>-scrim` (the `Menu` precedent). Sub panels carry their
 * own `testID` when the caller provides one. The scrim is labelled
 * "Dismiss menu".
 */

export type DropdownMenuProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed toggle or dismissal. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  testID?: string;
  /** Menu content box style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Trigger content plus `DropdownMenuItem`/`DropdownMenuSub` elements. */
  children: ReactNode;
  /** Forwarded to the menu container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type DropdownMenuTriggerProps = {
  testID?: string;
  /** Trigger pressable style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Trigger content (required — an empty trigger is a bug). */
  children: ReactNode;
  /** Terminal: it never toggles and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
};

export type DropdownMenuItemProps = {
  /** Item value passed to `onSelect` when activated (required). */
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

export type DropdownMenuSubProps = {
  /** Submenu value: the path segment identifying this level (required). */
  value: string;
  /** `DropdownMenuSubTrigger` plus panel content. */
  children: ReactNode;
};

export type DropdownMenuSubTriggerProps = {
  testID?: string;
  /** Trigger pressable style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Trigger content (required). */
  children: ReactNode;
  /** Terminal: it never opens and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
};

export type DropdownMenuSubContentProps = {
  testID?: string;
  /** Panel style, caller-provided (fly-out geometry lives here). */
  style?: StyleProp<ViewStyle>;
  /** `DropdownMenuItem`/`DropdownMenuSub` elements. */
  children?: ReactNode;
};

type SubIdentity = {
  /** This submenu's path segment. */
  value: string;
  /** Depth into the open path (outermost sub is 0). */
  depth: number;
};

type DropdownDisclosure = {
  open: boolean;
  toggleRoot: () => void;
  closeAll: () => void;
  /** Open submenu values from the outermost sub inward. */
  openPath: string[];
  /** Open `value` at `depth`, replacing the path from there down. */
  openSub: (value: string, depth: number) => void;
  /** Depth a direct submenu child lives at (root panel is 0). */
  subDepth: number;
  /** Set inside a `DropdownMenuSub` for its trigger and panel. */
  sub: SubIdentity | null;
};

/**
 * Shared cascade state. Internal (not exported): parts must render
 * inside a `DropdownMenu` to participate; outside one triggers render
 * collapsed and inert and items render inert, like `MenuItem` outside
 * `Menu`.
 */
const DropdownDisclosureContext = createContext<DropdownDisclosure | null>(
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
  ref: DropdownMenuProps["ref"],
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
 * whole container (trigger zone plus content area) dismisses on press
 * (the `Menu` precedent).
 */
const SCRIM_FILL: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function DropdownMenuTrigger({
  testID,
  style,
  children,
  disabled = false,
  accessibilityLabel,
}: DropdownMenuTriggerProps): React.JSX.Element {
  const disclosure = useContext(DropdownDisclosureContext);
  const expanded = disclosure?.open ?? false;

  const toggleTrigger = useCallback(() => {
    if (disabled) return;
    disclosure?.toggleRoot();
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

export function DropdownMenuItem({
  value,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  onSelect,
}: DropdownMenuItemProps): React.JSX.Element | null {
  const disclosure = useContext(DropdownDisclosureContext);

  const selectItem = useCallback(() => {
    if (disabled) return;
    onSelect?.(value);
    disclosure?.closeAll();
  }, [disabled, onSelect, value, disclosure]);

  // Outside a menu there is no disclosure to close: render inert
  // rather than dropping the node silently (the `MenuItem` precedent).
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

  // Presence is mount/unmount: a closed root shows the trigger only.
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

export function DropdownMenuSubTrigger({
  testID,
  style,
  children,
  disabled = false,
  accessibilityLabel,
}: DropdownMenuSubTriggerProps): React.JSX.Element {
  const disclosure = useContext(DropdownDisclosureContext);
  const identity = disclosure?.sub ?? null;
  const expanded =
    identity !== null &&
    disclosure?.openPath[identity.depth] === identity.value;

  const openTrigger = useCallback(() => {
    if (disabled) return;
    if (identity === null) return;
    disclosure?.openSub(identity.value, identity.depth);
  }, [disabled, identity, disclosure]);

  // Outside a submenu there is no panel to open: render inert
  // (announced disabled, press is a no-op) rather than dropping the
  // node silently.
  const inert = identity === null;
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

export function DropdownMenuSubContent({
  testID,
  style,
  children,
}: DropdownMenuSubContentProps): React.JSX.Element | null {
  const disclosure = useContext(DropdownDisclosureContext);
  const identity = disclosure?.sub ?? null;
  // Panel chrome without a submenu is meaningless: render nothing
  // outside a `DropdownMenuSub`, and only while its panel is open.
  if (!disclosure || identity === null) return null;
  if (!disclosure.open) return null;
  if (disclosure.openPath[identity.depth] !== identity.value) return null;
  return (
    <View accessible role="menu" testID={testID} style={style}>
      {children}
    </View>
  );
}

export function DropdownMenuSub({
  value,
  children,
}: DropdownMenuSubProps): React.JSX.Element | null {
  const disclosure = useContext(DropdownDisclosureContext);
  // Outside a menu, or while the root is closed, a submenu renders
  // nothing: its trigger and panel only exist inside an open menu.
  if (!disclosure) return null;
  if (!disclosure.open) return null;

  const depth = disclosure.subDepth;
  const sub: SubIdentity = { value, depth };

  return (
    <DropdownDisclosureContext.Provider
      value={{ ...disclosure, sub, subDepth: depth + 1 }}
    >
      {children}
    </DropdownDisclosureContext.Provider>
  );
}

function DropdownMenuRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  testID,
  style,
  children,
  ref,
}: DropdownMenuProps): React.JSX.Element {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );
  const [openPath, setOpenPath] = useState<string[]>([]);

  const toggleRoot = useCallback(() => {
    setOpenPath([]);
    setOpen((previous) => !(previous ?? false));
  }, [setOpen]);

  const closeAll = useCallback(() => {
    setOpenPath([]);
    setOpen(false);
  }, [setOpen]);

  // Scrim path: `onDismiss` first, then report `false` (the `Dialog`
  // dismissal precedent). Clears the cascade path with the root.
  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpenPath([]);
    setOpen(false);
  }, [onDismiss, setOpen]);

  const disclosure = useMemo<DropdownDisclosure>(
    () => ({
      open: isOpen ?? false,
      toggleRoot,
      closeAll,
      openPath,
      openSub: (value, depth) => {
        if (depth < 0) return;
        setOpenPath((previous) => [...previous.slice(0, depth), value]);
      },
      subDepth: 0,
      sub: null,
    }),
    [isOpen, toggleRoot, closeAll, openPath],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render.
  const setContainerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  // Partition direct children by element type: items and subs belong
  // to the content box (mounted only while open); everything else is
  // trigger-zone content, always rendered (the `Menu` precedent).
  const triggerNodes: ReactNode[] = [];
  const panelNodes: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type === DropdownMenuItem || child.type === DropdownMenuSub)
    ) {
      panelNodes.push(child);
    } else {
      triggerNodes.push(child);
    }
  });

  // Wire caller-provided trigger elements that are not already a
  // context-wired `DropdownMenuTrigger` (the `Menu` precedent):
  // internal toggle first, then the caller's handler; `disabled` on
  // the child is terminal.
  const wiredTriggers = triggerNodes.map((node, index) => {
    if (isValidElement(node) && node.type !== DropdownMenuTrigger) {
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
          key: node.key ?? `dropdown-trigger-${index}`,
          onPress: (event: unknown) => {
            if (childDisabled) return;
            toggleRoot();
            childOnPress?.(event);
          },
        },
      );
    }
    return node;
  });

  return (
    <View ref={setContainerRef}>
      <DropdownDisclosureContext.Provider value={disclosure}>
        <View>{wiredTriggers}</View>
        {isOpen ? (
          <>
            <Pressable
              accessibilityLabel="Dismiss menu"
              testID={testID ? `${testID}-scrim` : undefined}
              onPress={dismiss}
              style={SCRIM_FILL}
            />
            <View accessible role="menu" testID={testID} style={style}>
              {panelNodes}
            </View>
          </>
        ) : null}
      </DropdownDisclosureContext.Provider>
    </View>
  );
}

export { DropdownMenuRoot as DropdownMenu };
