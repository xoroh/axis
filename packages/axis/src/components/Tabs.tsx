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
import { useControllableState } from "../useControllableState";

/**
 * Tabs — an unstyled single-select tab group.
 *
 * Structure only: a plain `View` root, a `TabsList` view carrying the
 * tablist role, `TabsTrigger` pressables carrying the tab role and
 * selected state, and `TabsPanel` views rendered only while selected
 * (conditional presence — an unselected panel returns `null`, so it
 * leaves the tree entirely). No default visuals — every visual value
 * (`style`) is caller-provided. State follows the
 * `useControllableState` pattern: `value` (+ `onValueChange`) for
 * controlled use, `defaultValue` for uncontrolled. Selection is
 * single-select and replacing: activating the selected trigger keeps
 * it (never deselects), per the selection-model rule.
 *
 * Deferred, not implemented: orientation props and arrow-key roving
 * traversal. On native, indexed press selection suffices for v1, so
 * this slice adopts no `roving`/`collection` model; keyboard-specific
 * behavior stays out per the contract's conditional rule.
 */

export type TabsProps = {
  /** Controlled selection (a trigger value). Wins over `defaultValue` when defined. */
  value?: string;
  /** Uncontrolled initial selection. No default — nothing selected. */
  defaultValue?: string;
  /** Fires with the selected trigger value on every committed selection. */
  onValueChange?: (value: string) => void;
  testID?: string;
  /** Root container view style. */
  style?: StyleProp<ViewStyle>;
  /** The tab group content (`TabsList` triggers plus `TabsPanel`s). */
  children: ReactNode;
  /** Forwarded to the root container host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type TabsListProps = {
  testID?: string;
  /** Tab-list container view style. */
  style?: StyleProp<ViewStyle>;
  /** The list's triggers (`TabsTrigger`). */
  children: ReactNode;
};

export type TabsTriggerProps = {
  /** Selection value contributed to the group when this trigger is activated. */
  value: string;
  /** Terminal for this trigger only: it never selects and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Trigger pressable style. */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export type TabsPanelProps = {
  /** Panel value: this panel renders only while the group selection equals it. */
  value: string;
  testID?: string;
  /** Panel view style. */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

type TabsSelection = {
  selectedValue: string | undefined;
  select: (value: string) => void;
};

/**
 * Shared selection state for the group's triggers and panels.
 * Internal to this module (not exported): triggers and panels must
 * render inside a `Tabs` to participate in selection; outside one,
 * triggers render unselected and inert and panels render nothing.
 */
const TabsSelectionContext = createContext<TabsSelection | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: TabsProps["ref"],
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

function TabsRoot({
  value,
  defaultValue,
  onValueChange,
  testID,
  style,
  children,
  ref,
}: TabsProps): React.JSX.Element {
  const [selectedValue, setSelectedValue] = useControllableState<string>(
    value,
    defaultValue,
    onValueChange,
  );

  const select = useCallback(
    (next: string) => {
      setSelectedValue(next);
    },
    [setSelectedValue],
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

  const selection = useMemo<TabsSelection>(
    () => ({ selectedValue, select }),
    [selectedValue, select],
  );

  // The root is a plain container: it carries no role or accessibility
  // element claim of its own. The tablist role lives on `TabsList`,
  // the tab role on each `TabsTrigger`; inventing a second group role
  // here would double-announce the control.
  return (
    <View ref={setHostRef} testID={testID} style={style}>
      <TabsSelectionContext.Provider value={selection}>
        {children}
      </TabsSelectionContext.Provider>
    </View>
  );
}

export function TabsList({
  testID,
  style,
  children,
}: TabsListProps): React.JSX.Element {
  return (
    <View
      // The list must be an accessibility element for its role to reach
      // assistive technology (and the `*ByRole` proofs): a plain `View`
      // is not one by default, unlike `Pressable`.
      accessible
      accessibilityRole="tablist"
      testID={testID}
      style={style}
    >
      {children}
    </View>
  );
}

export function TabsTrigger({
  value,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
}: TabsTriggerProps): React.JSX.Element {
  const group = useContext(TabsSelectionContext);
  const selected = group?.selectedValue === value;

  const selectTab = useCallback(() => {
    if (disabled) return;
    group?.select(value);
  }, [disabled, group, value]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={disabled}
      onPress={selectTab}
      style={style}
    >
      {children}
    </Pressable>
  );
}

export function TabsPanel({
  value,
  testID,
  style,
  children,
}: TabsPanelProps): React.JSX.Element | null {
  const group = useContext(TabsSelectionContext);
  // Conditional presence (structural): only the selected panel is in
  // the tree. Unselected panels — including every panel outside a
  // `Tabs` group — render nothing.
  if (group?.selectedValue !== value) {
    return null;
  }
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}

export { TabsRoot as Tabs };
