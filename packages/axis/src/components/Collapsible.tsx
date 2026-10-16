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
 * Collapsible — an unstyled single disclosure unit.
 *
 * Structure only: a `View` root carrying one `CollapsibleTrigger`
 * `Pressable` (button role, `expanded` state) with a
 * `CollapsiblePanel` `View` that renders ONLY while open — presence
 * is mount/unmount, never hiding styles. No default visuals — every
 * visual value (`style` on each part) is caller-provided. State
 * follows the `useControllableState` pattern: `open` (+
 * `onOpenChange`) for controlled use, `defaultOpen` for
 * uncontrolled (default `false`, starts collapsed).
 *
 * This is an `Accordion` with exactly one always-present item, but
 * shares NO code with it — no shared context, no shared toggle, no
 * shared ref helper. The group selection domain (`string | null`
 * over keyed items) and the single boolean domain here would meet
 * only in a wrapper that hides both contracts; duplicating these ~20
 * lines beats that premature abstraction.
 *
 * No animation: the panel mounts/unmounts synchronously with state.
 * Integration with the `presence` model (exit transitions that keep
 * the panel mounted until the animation finishes) is deferred until
 * a consumer needs animated disclosure; until then a synchronous
 * presence would add mount-delay machinery for zero observed
 * behavior.
 *
 * No role is declared on the root: React Native defines no
 * disclosure-group role for a single unit, and inventing one would
 * be a lie a screen reader cannot cash (the `Label` precedent). The
 * trigger carries the button role.
 */

export type CollapsibleProps = {
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false` (starts collapsed). */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed toggle. */
  onOpenChange?: (open: boolean) => void;
  /** Terminal: disables the trigger — no toggles, no callbacks. */
  disabled?: boolean;
  testID?: string;
  /** Root disclosure view style. */
  style?: StyleProp<ViewStyle>;
  /** The disclosure parts (`CollapsibleTrigger`, `CollapsiblePanel`). */
  children: ReactNode;
  /** Forwarded to the root disclosure host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type CollapsibleTriggerProps = {
  /** Terminal for the trigger: it never toggles and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Trigger pressable style. */
  style?: StyleProp<ViewStyle>;
  /** Trigger content, rendered inside the `Pressable`. */
  children?: ReactNode;
};

export type CollapsiblePanelProps = {
  testID?: string;
  /** Panel view style (the panel mounts only while open). */
  style?: StyleProp<ViewStyle>;
  /** Panel content, rendered inside a `View` only while open. */
  children?: ReactNode;
};

type CollapsibleDisclosure = {
  open: boolean;
  rootDisabled: boolean;
  toggle: () => void;
};

/**
 * Shared disclosure state for the unit's parts. Internal to this
 * module (not exported): parts must render inside a `Collapsible`
 * to participate in disclosure; outside one the trigger renders
 * collapsed and inert and the panel never mounts.
 */
const CollapsibleDisclosureContext =
  createContext<CollapsibleDisclosure | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: CollapsibleProps["ref"],
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

function CollapsibleRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  testID,
  style,
  children,
  ref,
}: CollapsibleProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((previous) => !(previous ?? false));
  }, [disabled, setIsOpen]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const disclosure = useMemo<CollapsibleDisclosure>(
    () => ({ open: isOpen ?? false, rootDisabled: disabled, toggle }),
    [isOpen, disabled, toggle],
  );

  return (
    <View ref={setHostRef} testID={testID} style={style}>
      <CollapsibleDisclosureContext.Provider value={disclosure}>
        {children}
      </CollapsibleDisclosureContext.Provider>
    </View>
  );
}

export function CollapsibleTrigger({
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
}: CollapsibleTriggerProps): React.JSX.Element {
  const disclosure = useContext(CollapsibleDisclosureContext);
  const effectiveDisabled = disabled || (disclosure?.rootDisabled ?? false);
  const expanded = disclosure?.open ?? false;

  const toggleTrigger = useCallback(() => {
    if (effectiveDisabled) return;
    disclosure?.toggle();
  }, [effectiveDisabled, disclosure]);

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
      style={style}
    >
      {children}
    </Pressable>
  );
}

export function CollapsiblePanel({
  testID,
  style,
  children,
}: CollapsiblePanelProps): React.JSX.Element | null {
  const disclosure = useContext(CollapsibleDisclosureContext);
  if (!(disclosure?.open ?? false)) return null;
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}

export { CollapsibleRoot as Collapsible };
