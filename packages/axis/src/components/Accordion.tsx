import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * Accordion — an unstyled disclosure group with compound parts.
 *
 * Structure only: an `AccordionRoot` `View` carrying the group's
 * items, each an `AccordionItem` (value identity + open state)
 * composing one `AccordionHeader` (heading host) with an
 * `AccordionTrigger` `Pressable` (button role, `expanded` state)
 * and one `AccordionPanel` `View` that renders ONLY while its item
 * is open — presence is mount/unmount, never hiding styles. No
 * default visuals — every visual value (`style` on each part) is
 * caller-provided. State follows the `useControllableState`
 * pattern: `value` (+ `onValueChange`) for controlled use,
 * `defaultValue` for uncontrolled (default `[]`, all collapsed).
 *
 * `multiple` (default `false`, the Base UI default) selects the
 * cardinality: single-expand replaces (activating the open item
 * collapses the group to `[]`), multi-expand toggles membership.
 * `orientation` (default `"vertical"`) is structural
 * documentation: it selects the container's `flexDirection`
 * (`column` / `row`) as a base the caller style overrides.
 *
 * No animation: the panel mounts/unmounts synchronously with state.
 * Integration with the `presence` model (exit transitions that keep
 * the panel mounted until the animation finishes) is deferred until
 * a consumer needs animated disclosure; until then a synchronous
 * presence would add mount-delay machinery for zero observed
 * behavior.
 *
 * No `hiddenUntilFound`: it is N/A on React Native — the prop
 * hides closed panels with `hidden="until-found"` so the desktop
 * browser can find-in-page into them and search engines can index
 * them. Native has no find-in-page and no DOM indexer; closed
 * panels unmount (the `keepMounted` omission, D3) and there is
 * nothing to reveal. No `loopFocus`: focus management belongs to
 * the `roving` model, whose transfer gate has no approved consumer
 * yet. No role is declared on the root: React Native defines no
 * accordion role, and inventing one would be a lie a screen reader
 * cannot cash (the `Label` precedent). Triggers carry the button
 * role; headers carry the header role.
 */

export type AccordionRootState = {
  /** Currently open item values (`[]` for all collapsed). */
  value: string[];
  /** Whether the whole group is disabled. */
  disabled: boolean;
  /**
   * When `false` only one panel can be open (activating an open
   * item collapses the group). Default `false`.
   */
  multiple: boolean;
  /** Reading order of the grouped items. Default `"vertical"`. */
  orientation: "horizontal" | "vertical";
};

export type AccordionItemState = {
  /** Whether this item is currently expanded. */
  open: boolean;
  /** Whether this item is currently disabled. */
  disabled: boolean;
};

export type AccordionHeaderState = {
  /** Whether the enclosing item is currently expanded. */
  open: boolean;
  /** Whether the enclosing item is currently disabled. */
  disabled: boolean;
};

export type AccordionTriggerState = {
  /** Whether the enclosing item is currently expanded. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export type AccordionPanelState = {
  /** Whether the enclosing item is currently expanded (always true while mounted). */
  open: boolean;
  /** Whether the enclosing item is currently disabled. */
  disabled: boolean;
};

export type AccordionRootProps = {
  /** Controlled open item values. Wins over `defaultValue` when defined. */
  value?: string[];
  /** Uncontrolled initial open item values. Default `[]` (all collapsed). */
  defaultValue?: string[];
  /** Fires with the open item values on every committed toggle. */
  onValueChange?: (value: string[]) => void;
  /**
   * When `false` only one panel can be open: activating an open
   * item collapses the group to `[]`, activating another replaces
   * it. When `true` panels toggle independently. Default `false`.
   */
  multiple?: boolean;
  /**
   * Reading order of the grouped items. Default `"vertical"`.
   * Applied structurally as the container `flexDirection`
   * (`column` / `row`); the caller `style` merges over it and wins
   * on conflict. Carries no focus behavior (no roving layer).
   */
  orientation?: "horizontal" | "vertical";
  /** Terminal: disables every item — no toggles, no callbacks. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root group view style: value or function of group state. */
  style?: StateStyle<AccordionRootState, StyleProp<ViewStyle>>;
  /** The group's items (`AccordionItem`). */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<AccordionRootState, SlotProps>;
  /** Forwarded to the root group host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type AccordionItemProps = {
  /** Disclosure value identifying this item (required). */
  value: string;
  /** Terminal for this item only: it never toggles and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /**
   * Fires with this item's next open state whenever its membership
   * changes (including when another item's activation closes it in
   * single-expand mode).
   */
  onOpenChange?: (open: boolean) => void;
  testID?: string;
  /** The item's header and panel (`AccordionHeader`, `AccordionPanel`). */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the whole item (header and
   * panel); the panel still mounts only while expanded.
   */
  render?: RenderProp<AccordionItemState, SlotProps>;
};

export type AccordionHeaderProps = {
  testID?: string;
  /** Header container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Header content (the `AccordionTrigger`). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). The header
   * carries the heading role; the function form receives the item's
   * open state.
   */
  render?: RenderProp<AccordionHeaderState, SlotProps>;
};

export type AccordionTriggerProps = {
  /** Terminal for the trigger: it never toggles and is announced as disabled. Combines with item `disabled` (either disables). */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Trigger pressable style: value or function of trigger state. */
  style?: StateStyle<AccordionTriggerState, StyleProp<ViewStyle>>;
  /** Trigger content. Optional — without it the trigger still renders, empty but accessible when labelled. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<AccordionTriggerState, SlotProps>;
};

export type AccordionPanelProps = {
  testID?: string;
  /** Panel view style (the panel mounts only while open). */
  style?: StyleProp<ViewStyle>;
  /** Panel content, rendered inside a `View` only while the item is open. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). The panel
   * still mounts only while the item is open.
   */
  render?: RenderProp<AccordionPanelState, SlotProps>;
};

type AccordionDisclosure = {
  openValues: readonly string[] | undefined;
  multiple: boolean;
  groupDisabled: boolean;
  toggle: (value: string) => void;
  registerItem: (value: string, onOpenChange: (open: boolean) => void) => void;
  unregisterItem: (value: string) => void;
};

type AccordionItemDisclosure = {
  value: string;
  open: boolean;
  disabled: boolean;
};

/**
 * Shared disclosure state for the group's items. Internal to this
 * module (not exported): parts must render inside an
 * `AccordionRoot` to participate in disclosure; outside one the
 * trigger renders collapsed and inert and the panel never mounts.
 */
const AccordionDisclosureContext = createContext<AccordionDisclosure | null>(
  null,
);

const AccordionItemDisclosureContext =
  createContext<AccordionItemDisclosure | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: AccordionRootProps["ref"],
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

export function AccordionRoot({
  value,
  defaultValue = [],
  onValueChange,
  multiple = false,
  orientation = "vertical",
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: AccordionRootProps): React.ReactNode {
  const [openValues, setOpenValues] = useControllableState<string[]>(
    value,
    defaultValue,
    onValueChange,
  );

  // Per-item open-change listeners, keyed by item value. Lets an
  // item's `onOpenChange` fire even when ANOTHER item's activation
  // changes its membership (single-expand replacement).
  const listeners = useRef(new Map<string, (open: boolean) => void>());

  const registerItem = useCallback(
    (itemValue: string, onOpenChange: (open: boolean) => void) => {
      listeners.current.set(itemValue, onOpenChange);
    },
    [],
  );

  const unregisterItem = useCallback((itemValue: string) => {
    listeners.current.delete(itemValue);
  }, []);

  const toggle = useCallback(
    (next: string) => {
      if (disabled) return;
      setOpenValues((previous) => {
        const current = previous ?? [];
        const isOpen = current.includes(next);
        const updated = isOpen
          ? current.filter((item) => item !== next)
          : multiple
            ? [...current, next]
            : [next];
        const before = new Set(current);
        const after = new Set(updated);
        for (const [itemValue, notify] of listeners.current) {
          if (before.has(itemValue) !== after.has(itemValue)) {
            notify(after.has(itemValue));
          }
        }
        return updated;
      });
    },
    [disabled, multiple, setOpenValues],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const disclosure = useMemo<AccordionDisclosure>(
    () => ({
      openValues,
      multiple,
      groupDisabled: disabled,
      toggle,
      registerItem,
      unregisterItem,
    }),
    [openValues, multiple, disabled, toggle, registerItem, unregisterItem],
  );

  const state: AccordionRootState = {
    value: openValues ?? [],
    disabled,
    multiple,
    orientation,
  };
  const baseDirection = {
    flexDirection: orientation === "horizontal" ? "row" : "column",
  } as const;
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      style: [baseDirection, resolveStyle(style, state)],
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[baseDirection, resolveStyle(style, state)]}
    >
      <AccordionDisclosureContext.Provider value={disclosure}>
        {children}
      </AccordionDisclosureContext.Provider>
    </View>
  );
}

export function AccordionItem({
  value,
  disabled = false,
  onOpenChange,
  testID,
  children,
  render,
}: AccordionItemProps): React.ReactNode {
  const group = useContext(AccordionDisclosureContext);
  const effectiveDisabled = disabled || (group?.groupDisabled ?? false);
  const open = group?.openValues?.includes(value) ?? false;

  useEffect(() => {
    if (!group || !onOpenChange) return;
    group.registerItem(value, onOpenChange);
    return () => {
      group.unregisterItem(value);
    };
  }, [group, value, onOpenChange]);

  const state: AccordionItemState = { open, disabled: effectiveDisabled };
  const item: AccordionItemDisclosure = {
    value,
    open,
    disabled: effectiveDisabled,
  };
  const substituted = resolveRender(
    render,
    {
      testID,
      disabled: effectiveDisabled,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) {
    return (
      <AccordionItemDisclosureContext.Provider value={item}>
        {substituted}
      </AccordionItemDisclosureContext.Provider>
    );
  }

  return (
    <AccordionItemDisclosureContext.Provider value={item}>
      <View testID={testID}>{children}</View>
    </AccordionItemDisclosureContext.Provider>
  );
}

export function AccordionHeader({
  testID,
  style,
  children,
  render,
}: AccordionHeaderProps): React.ReactNode {
  const item = useContext(AccordionItemDisclosureContext);
  const open = item?.open ?? false;
  const disabled = item?.disabled ?? false;

  const state: AccordionHeaderState = { open, disabled };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "header",
      testID,
      style,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View accessibilityRole="header" testID={testID} style={style}>
      {children}
    </View>
  );
}

export function AccordionTrigger({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: AccordionTriggerProps): React.ReactNode {
  const item = useContext(AccordionItemDisclosureContext);
  const group = useContext(AccordionDisclosureContext);
  const effectiveDisabled = disabled || (item?.disabled ?? false);
  const expanded = item?.open ?? false;

  const toggleTrigger = useCallback(() => {
    if (effectiveDisabled) return;
    if (item) group?.toggle(item.value);
  }, [effectiveDisabled, group, item]);

  const state: AccordionTriggerState = {
    open: expanded,
    disabled: effectiveDisabled,
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: {
        expanded,
        disabled: effectiveDisabled,
      },
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled,
      onPress: toggleTrigger,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        expanded,
        disabled: effectiveDisabled,
      }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={toggleTrigger}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function AccordionPanel({
  testID,
  style,
  children,
  render,
}: AccordionPanelProps): React.ReactNode {
  const item = useContext(AccordionItemDisclosureContext);
  if (!(item?.open ?? false)) return null;
  const state: AccordionPanelState = {
    open: true,
    disabled: item?.disabled ?? false,
  };
  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}
