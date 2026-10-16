import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * Accordion — an unstyled single-expand disclosure group.
 *
 * Structure only: a `View` root carrying the group's items, each an
 * `AccordionItem` trigger `Pressable` (button role, `expanded` state)
 * with a panel `View` that renders ONLY when its item is open —
 * presence is mount/unmount, never hiding styles. No default visuals —
 * every visual value (`style`, `headerStyle`, `panelStyle`) is
 * caller-provided. State follows the `useControllableState` pattern:
 * `value` (+ `onValueChange`) for controlled use, `defaultValue` for
 * uncontrolled (default `null`, everything collapsed).
 *
 * Single-expand and always collapsible: activating the open item
 * collapses the group to `null`. A multi-expand mode is explicitly
 * deferred — it needs a set-valued selection domain (`string[]`) and
 * its own contract section first, not a boolean flag on this type.
 *
 * No animation: the panel mounts/unmounts synchronously with state.
 * Integration with the `presence` model (exit transitions that keep
 * the panel mounted until the animation finishes) is deferred until
 * a consumer needs animated disclosure; until then a synchronous
 * presence would add mount-delay machinery for zero observed
 * behavior.
 *
 * Empty-header fallback: an item without `header` still renders its
 * trigger as an empty but accessible `Pressable` (button role,
 * `expanded` state, `accessibilityLabel` when given) so the panel
 * stays reachable and its open state stays announced. A trigger with
 * neither `header` nor `accessibilityLabel` is a caller error — it
 * renders, but has no accessible name.
 *
 * No role is declared on the root: React Native defines no accordion
 * role, and inventing one would be a lie a screen reader cannot cash
 * (the `Label` precedent). Triggers carry the button role.
 */

export type AccordionState = {
  /** Currently open item value (`null` for all collapsed). */
  value: string | null;
  /** Whether the whole group is disabled. */
  disabled: boolean;
};

export type AccordionItemState = {
  /** Whether this item is currently expanded. */
  expanded: boolean;
  /** Whether this item is currently disabled. */
  disabled: boolean;
};

export type AccordionProps = {
  /** Controlled open item (an item value, or `null` for all collapsed). Wins over `defaultValue` when defined. */
  value?: string | null;
  /** Uncontrolled initial open item. Default `null` (all collapsed). */
  defaultValue?: string | null;
  /** Fires with the open item value on every committed toggle, `null` when the open item collapses. */
  onValueChange?: (value: string | null) => void;
  /** Terminal: disables every item — no toggles, no callbacks. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root group view style: value or function of group state. */
  style?: StateStyle<AccordionState, StyleProp<ViewStyle>>;
  /** The group's items (`AccordionItem`). */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<AccordionState, SlotProps>;
  /** Forwarded to the root group host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type AccordionItemProps = {
  /** Disclosure value contributed to the group when this item is activated. */
  value: string;
  /** Terminal for this item only: it never toggles and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Item trigger pressable style: value or function of item state. */
  headerStyle?: StateStyle<AccordionItemState, StyleProp<ViewStyle>>;
  /** Item panel view style (the panel mounts only while open). */
  panelStyle?: StyleProp<ViewStyle>;
  /** Panel content, rendered inside a `View` only while this item is open. */
  children?: ReactNode;
  /** Trigger content, rendered inside the item's `Pressable`. When absent the trigger still renders, empty but accessible (see header note). */
  header?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the whole item (trigger and
   * panel); the panel still mounts only while expanded.
   */
  render?: RenderProp<AccordionItemState, SlotProps>;
};

type AccordionDisclosure = {
  openValue: string | null | undefined;
  groupDisabled: boolean;
  toggle: (value: string) => void;
};

/**
 * Shared disclosure state for the group's items. Internal to this module
 * (not exported): items must render inside an `Accordion` to participate
 * in disclosure; outside one they render collapsed and inert.
 */
const AccordionDisclosureContext = createContext<AccordionDisclosure | null>(
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
  ref: AccordionProps["ref"],
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

function AccordionRoot({
  value,
  defaultValue = null,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: AccordionProps): React.ReactNode {
  const [openValue, setOpenValue] = useControllableState<string | null>(
    value,
    defaultValue,
    onValueChange,
  );

  const toggle = useCallback(
    (next: string) => {
      if (disabled) return;
      setOpenValue((previous) => (previous === next ? null : next));
    },
    [disabled, setOpenValue],
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
    () => ({ openValue, groupDisabled: disabled, toggle }),
    [openValue, disabled, toggle],
  );

  const state: AccordionState = {
    value: openValue ?? null,
    disabled,
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
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
      style={resolveStyle(style, state)}
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
  accessibilityLabel,
  testID,
  headerStyle,
  panelStyle,
  children,
  header,
  render,
}: AccordionItemProps): React.ReactNode {
  const group = useContext(AccordionDisclosureContext);
  const effectiveDisabled = disabled || (group?.groupDisabled ?? false);
  const expanded = group?.openValue === value;

  const toggleItem = useCallback(() => {
    if (effectiveDisabled) return;
    group?.toggle(value);
  }, [effectiveDisabled, group, value]);

  const state: AccordionItemState = {
    expanded,
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
      onPress: toggleItem,
      style: resolveStyle(headerStyle, state),
      header,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          expanded,
          disabled: effectiveDisabled,
        }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled={effectiveDisabled}
        onPress={toggleItem}
        style={resolveStyle(headerStyle, state)}
      >
        {header}
      </Pressable>
      {expanded ? (
        <View
          testID={testID ? `${testID}-panel` : undefined}
          style={panelStyle}
        >
          {children}
        </View>
      ) : null}
    </>
  );
}

export { AccordionRoot as Accordion };
