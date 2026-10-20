import {
  Children,
  createContext,
  type ElementRef,
  isValidElement,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import {
  type CollectionItem,
  findCollectionText,
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
import { OverlayPortal, OverlayRoot } from "./Overlay";
import { Portal } from "./Portal";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Select — a compound single-select dropdown (Base UI parity).
 *
 * `SelectRoot` owns value + open state, the anchor registration, and
 * the item-label registry (renders no element); `SelectTrigger`
 * toggles; `SelectValue` resolves the selected label;
 * `SelectPortal` presents at the app's portal host;
 * `SelectBackdrop` is the scrim; `SelectPositioner` measures
 * placement against the trigger anchor; `SelectPopup` is the listbox;
 * `SelectArrow` is a caller-positioned marker; `SelectItem` (+
 * `SelectItemText`, `SelectItemIndicator`) are options;
 * `SelectGroup` + `SelectGroupLabel` group them; `SelectSeparator`
 * divides. No default visuals — every visual value is
 * caller-provided. Value state follows the `useControllableState`
 * pattern: `value` (+ `onValueChange`) for controlled use,
 * `defaultValue` for uncontrolled (`null` means empty). Open state is
 * a separate pair: `open` (+ `onOpenChange`) controlled,
 * `defaultOpen` uncontrolled (default `false`). Choosing an item
 * always closes the list; scrim press closes without selecting (the
 * Dialog scrim precedent). Selection is single-select and replacing:
 * activating the selected item keeps it (never deselects to `null`).
 *
 * ADR-112 aria-only: the trigger carries `role="combobox"` with
 * `aria-expanded` and `aria-disabled`; the list carries `role="listbox"`;
 * each item carries `role="option"` with `aria-selected` and `aria-disabled`.
 * Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 *
 * Deferred, each for a named reason (not oversight):
 * - No filtering/search text entry — that is Combobox, not Select.
 * - No animation: the list mounts/unmounts synchronously with open
 *   state (the Accordion panel precedent).
 * - No keyboard traversal: the `roving`/`collection` models are not
 *   adopted by Select's section.
 *
 * Test ids: the trigger carries `testID`; the scrim carries
 * `<testID>-scrim` when `testID` is given (the Accordion `-panel`
 * precedent).
 */

export type SelectItemState = {
  /** Whether this item is currently selected. */
  selected: boolean;
  /** Whether this item is currently disabled. */
  disabled: boolean;
  /**
   * Whether the item is pressed. Touch has no hover highlight —
   * the press is the highlight (the `MenuItem` touch adaptation).
   */
  highlighted: boolean;
};

export type SelectItemProps = {
  /** Selection value contributed to the group when this item is activated. */
  value: string;
  /**
   * Display label for this item (Base UI `Item` `label` parity):
   * the trigger value lookup and future typeahead read this, not
   * the rendered children. Defaults to string children (direct or
   * inside one `SelectItemText`), else the raw `value`.
   */
  label?: string;
  /** Terminal for this item only: it never selects and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Value or function of item state, caller-provided. */
  style?: StateStyle<SelectItemState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<SelectItemState, SlotProps>;
};

type SelectSelection = {
  selectedValue: string | string[] | null | undefined;
  groupDisabled: boolean;
  choose: (value: string) => void;
  reportItemLayout: (value: string, layout: ItemLayout) => void;
};

/**
 * Shared root state for the compound parts. Internal (not exported):
 * `SelectRoot` owns value + open state, the anchor registration, and
 * the item-label registry; `SelectItem` reads it to participate.
 */
const SelectRootContext = createContext<SelectRootDisclosure | null>(null);

/**
 * The matchable text an item publishes to the label registry: the
 * explicit `label` first, then direct string children, then the
 * string content of a top-level `SelectItemText` (fragments and
 * custom wrappers are skipped), else the raw value.
 */
function selectItemText(
  label: string | undefined,
  children: ReactNode,
  value: string,
): string {
  if (label !== undefined) return label;
  if (typeof children === "string") return children;
  let text: string | undefined;
  Children.forEach(children, (child) => {
    if (text !== undefined) return;
    if (
      isValidElement<{ children?: unknown }>(child) &&
      child.type === SelectItemText &&
      typeof child.props.children === "string"
    ) {
      text = child.props.children;
    }
  });
  return text ?? value;
}

/**
 * Selected-item geometry for `alignItemWithTrigger`: items report
 * their list-local origin on layout; the positioner shifts the popup
 * so the selected item opens over the trigger (Base UI parity).
 * Mount-time reports only — a version bump re-renders the positioner
 * once the offsets land (same commit as content measurement when the
 * schedulers agree, one extra paint when they do not).
 */
export type ItemLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function useItemLayoutRegistry(): {
  layouts: Map<string, ItemLayout>;
  reportItemLayout: (value: string, layout: ItemLayout) => void;
  layoutVersion: number;
} {
  const layouts = useRef(new Map<string, ItemLayout>());
  const [layoutVersion, setLayoutVersion] = useState(0);
  const reportItemLayout = useCallback((value: string, layout: ItemLayout) => {
    const previous = layouts.current.get(value);
    if (
      previous &&
      previous.x === layout.x &&
      previous.y === layout.y &&
      previous.width === layout.width &&
      previous.height === layout.height
    ) {
      return;
    }
    layouts.current.set(value, layout);
    setLayoutVersion((version) => version + 1);
  }, []);
  return useMemo(
    () => ({
      layouts: layouts.current,
      reportItemLayout,
      layoutVersion,
    }),
    [reportItemLayout, layoutVersion],
  );
}

/**
 * Wrap raw strings or numbers in `<Text>` so React Native / React Native Web
 * never emit an "Unexpected text node" warning when rendering into a `Pressable` host.
 */
function wrapText(node: ReactNode): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return <Text>{node}</Text>;
  }
  return node;
}

export function SelectItem({
  value,
  label,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
}: SelectItemProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  const selection = root;
  const effectiveDisabled = disabled || (selection?.groupDisabled ?? false);
  // Multi-select membership: the value is one of the selected set.
  const selectedValue = selection?.selectedValue;
  const selected = Array.isArray(selectedValue)
    ? selectedValue.includes(value)
    : selectedValue === value;
  const [highlighted, setHighlighted] = useState(false);
  const isTypeahead = Boolean(
    root?.highlightedValue && root.highlightedValue === value,
  );
  const state: SelectItemState = {
    selected,
    disabled: effectiveDisabled,
    highlighted: highlighted || isTypeahead,
  };

  // Publish the label to the compound root's registry so
  // `SelectValue` resolves labels without reading children itself.
  // Items without a root above skip registration. Deps are the stable
  // registry callbacks — never the disclosure object, whose identity
  // changes with unrelated state and would re-run this effect
  // (unregister + re-register allocate) on every such change.
  const itemText = selectItemText(label, children, value);
  const registerItem = root?.register;
  const unregisterItem = root?.unregister;
  useEffect(() => {
    if (!registerItem || !unregisterItem) return;
    registerItem({ key: value, text: itemText });
    return () => unregisterItem(value);
  }, [registerItem, unregisterItem, value, itemText]);

  const chooseItem = useCallback(() => {
    if (effectiveDisabled) return;
    selection?.choose(value);
  }, [effectiveDisabled, selection, value]);

  // Report the list-local origin for `alignItemWithTrigger` (Base UI:
  // the popup opens with the selected item over the trigger). Reports
  // on every item — selection changes which offset the positioner
  // reads, and unreported items would leave stale origins. Custom
  // `render` substitutions receive the same `onLayout` and should
  // forward it for aligned placement to track them.
  const handleItemLayout = useCallback(
    (event: { nativeEvent: { layout: ItemLayout } }) => {
      selection?.reportItemLayout(value, event.nativeEvent.layout);
    },
    [selection, value],
  );

  const pressableProps = {
    role: "option",
    "aria-selected": selected,
    "aria-disabled": effectiveDisabled || undefined,
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined
      ? { "aria-labelledby": ariaLabelledBy }
      : {}),
    testID,
    disabled: effectiveDisabled,
    onPress: chooseItem,
    onPressIn: () => setHighlighted(true),
    onPressOut: () => setHighlighted(false),
    onLayout: handleItemLayout,
    style: resolveStyle(style, state),
    children,
  } satisfies SlotProps;

  // Outside any select there is no selection to join: render inert
  // (announced disabled, press is a no-op) rather than dropping the
  // node silently.
  if (!selection) {
    const inertState: SelectItemState = {
      selected: false,
      disabled: true,
      highlighted: false,
    };
    const substituted = resolveRender(
      render,
      {
        ...pressableProps,
        disabled: true,
        "aria-selected": false,
        "aria-disabled": true,
      },
      inertState,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        role="option"
        aria-selected={false}
        aria-disabled={true}
        {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
        {...(ariaLabelledBy !== undefined
          ? { "aria-labelledby": ariaLabelledBy }
          : {})}
        testID={testID}
        disabled
        style={resolveStyle(style, inertState)}
      >
        {wrapText(children)}
      </Pressable>
    );
  }

  const substituted = resolveRender(render, pressableProps, state);
  const node = substituted ?? (
    <Pressable
      role="option"
      aria-selected={selected}
      aria-disabled={effectiveDisabled || undefined}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={chooseItem}
      onPressIn={() => setHighlighted(true)}
      onPressOut={() => setHighlighted(false)}
      onLayout={handleItemLayout}
      style={resolveStyle(style, state)}
    >
      {wrapText(children)}
    </Pressable>
  );

  // The indicator reads its item's selected state from here (the
  // `Menu` indicator precedent) — including inside `render`
  // substitutions, whose children still render under this provider.
  return (
    <SelectIndicatorContext.Provider value={{ selected }}>
      {node}
    </SelectIndicatorContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* The parts below mirror Base UI's Select anatomy — Root (state       */
/* owner, renders no element), Trigger, Value (label lookup over the   */
/* no element), Trigger, Value (label lookup over the item registry),  */
/* Portal (the overlay host), Backdrop (the        */
/* scrim), Positioner (measured placement against the trigger          */
/* anchor), Popup (the listbox), Arrow (caller-positioned marker),      */
/* Item (with `label`, `render`,    */
/* and function styles), ItemText, ItemIndicator, Group, GroupLabel,   */
/* Separator, ScrollUpArrow, ScrollDownArrow — with `render`          */
/* element/function composition and value-or-function `style` on       */
/* every part. Omitted Base UI pieces are documented deviations,       */
/* not oversights: no `Label` (the trigger's `aria-label`,     */
/* or the Axis `Label` component, names the control), no `Icon`        */
/* (caller content inside `Trigger`), no `List` (the popup IS the      */
/* list container, the `Menu` compound precedent), no form             */
/* integration (`name`/`required`/`readOnly` — native forms are        */
/* caller-owned), no `actionsRef`/imperative handle (D7), no           */
/* highlight-on-hover (D8 — the press is the highlight), no animation  */
/* states (D9), no hardware-keyboard typeahead (the registry exists    */
/* for a section that adopts it; none has), and no `data-*`            */
/* attributes (D1). Non-modal roots (`modal={false}`) present the      */
/* the plain `Portal` at the app host with no Backdrop; outside-press */
/* without a scrim is the documented `Menu` limitation.              */
/* ------------------------------------------------------------------ */

export type SelectRootState = {
  /** Whether the list is currently open. */
  open: boolean;
  /** The selected value (`null` nothing selected). */
  value: string | null;
};

export type SelectRootProps = {
  /** Controlled selection (an item value, or `null` for none). Wins over `defaultValue` when defined. With `multiple`, an array of values (empty selects nothing). */
  value?: string | string[] | null;
  /** Uncontrolled initial selection. Default `null` (nothing selected, placeholder shown). With `multiple`, an array of values. */
  defaultValue?: string | string[] | null;
  /** Fires with the chosen item value on every committed selection. With `multiple`, the full array after each toggle (choosing never closes the list). */
  onValueChange?: (value: string | string[]) => void;
  /** Multi-select. Default `false` (single value, choosing closes). When `true`, choosing toggles membership, the list stays open, and `SelectValue` shows the joined labels. */
  multiple?: boolean;
  /**
   * Value-label lookup table (Base UI `items` parity): the trigger
   * value display reads the selected item's registered label while
   * the list is open, but items unmount with a closed list — pass
   * `items` so the label (not the raw value) shows while closed.
   * Live registrations win over this table while mounted.
   */
  items?: ReadonlyArray<{ value: string; label: string }>;
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed open/close. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * Whether the open list presents modally (an overlay host with a
   * scrim). Default `true`. When `false` the portal presents through
   * the plain `Portal` at the app host with no scrim and the trigger
   * stays pressable (the `Menu` compound precedent).
   */
  modal?: boolean;
  /**
   * When `true`, backdrop press does not dismiss. Default `false`.
   */
  disablePointerDismissal?: boolean;
  /** Terminal: the trigger never opens, items never select, no callbacks — and the list reads closed even under a controlled `open`. Default `false`. */
  disabled?: boolean;
  /** Trigger, Portal, and shared content. Renders no element itself. */
  children?: ReactNode;
  /** Forwarded nowhere (the root renders no element); accepted so ref-spreading callers typecheck. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SelectTriggerState = {
  /** Whether the list is currently open. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export type SelectTriggerProps = {
  testID?: string;
  /** Value or function of trigger state, caller-provided. */
  style?: StateStyle<SelectTriggerState, StyleProp<ViewStyle>>;
  /** Trigger content (`SelectValue` + caller icon composed by the caller). */
  children?: ReactNode;
  /** Terminal: it never opens and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<SelectTriggerState, SlotProps>;
};

export type SelectValueState = {
  /** The selected value (`null` nothing selected; an array with `multiple`). */
  value: string | string[] | null;
  /** Whether the placeholder is showing. */
  placeholder: boolean;
};

export type SelectValueProps = {
  /** Shown when nothing is selected. */
  placeholder?: ReactNode;
  /**
   * Value content: a node, or a function of the selected value
   * (Base UI parity — formatting without a lookup table).
   * Defaults to the selected item's registered label (joined with
   * `", "` under `multiple`), else the raw value, else the
   * placeholder.
   */
  children?: ReactNode | ((value: string | string[] | null) => ReactNode);
  testID?: string;
  /** Value or function of value state, caller-provided. */
  style?: StateStyle<SelectValueState, StyleProp<TextStyle>>;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<SelectValueState, SlotProps>;
};

export type SelectPortalProps = {
  /** Portal content (Backdrop + Positioner composed by the caller). */
  children?: ReactNode;
  testID?: string;
};

export type SelectBackdropState = {
  /** Whether the list is currently open. */
  open: boolean;
};

export type SelectBackdropProps = {
  testID?: string;
  /** Value or function of backdrop state, caller-provided. */
  style?: StateStyle<SelectBackdropState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * scrim host; dismissal wiring stays on the part.
   */
  render?: RenderProp<SelectBackdropState, SlotProps>;
};

export type SelectPositionerState = {
  /** Whether the list is currently open. */
  open: boolean;
  /** Effective placement side (after viewport flip/clamping). */
  side: Placement;
};

export type SelectPositionerProps = {
  /** Preferred side for the list. Default `"bottom"`. */
  side?: Placement;
  /** Cross-axis alignment. Default `"center"`. */
  align?: Align;
  /** Gap between anchor and list edges. Default `0`. */
  sideOffset?: number;
  /** Shift along the cross axis after alignment. Default `0`. */
  alignOffset?: number;
  /**
   * Align the selected item over the trigger (Base UI parity).
   * Default `true`; falls back to trigger anchoring with no
   * selection (or before the selected item's layout arrives).
   */
  alignItemWithTrigger?: boolean;
  testID?: string;
  /** Value or function of positioner state, caller-provided. */
  style?: StateStyle<SelectPositionerState, StyleProp<ViewStyle>>;
  /** Popup (and optional Arrow content) composed by the caller. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * positioned wrapper; measurement stays on the part.
   */
  render?: RenderProp<SelectPositionerState, SlotProps>;
};

export type SelectPopupState = {
  /** Whether the list is currently open. */
  open: boolean;
};

export type SelectPopupProps = {
  testID?: string;
  /** Value or function of popup state, caller-provided. */
  style?: StateStyle<SelectPopupState, StyleProp<ViewStyle>>;
  /** Item content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * content host; the listbox role stays on the part.
   */
  render?: RenderProp<SelectPopupState, SlotProps>;
  /** Forwarded to the content `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SelectArrowProps = {
  testID?: string;
  /** Arrow marker style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Arrow marker content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectGroupProps = {
  testID?: string;
  /** Group container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Group content (`SelectGroupLabel` + `SelectItem` elements). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectGroupLabelProps = {
  testID?: string;
  /** Group label style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Group label content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectSeparatorProps = {
  testID?: string;
  /** Separator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectItemTextProps = {
  testID?: string;
  /** Item text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Item label content (registers as the item's text when the item has no `label`). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectItemIndicatorProps = {
  testID?: string;
  /** Indicator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Indicator content. Rendered only while the enclosing item is selected. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

type SelectRootDisclosure = SelectSelection & {
  open: boolean;
  toggle: () => void;
  close: () => void;
  /** Scrim dismissal (`onDismiss` first unless pointer dismissal is disabled). */
  dismiss: () => void;
  disablePointerDismissal: boolean;
  modal: boolean;
  anchorHostRef: { current: ElementRef<typeof View> | null };
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
  items: readonly CollectionItem[];
  register: (item: CollectionItem) => void;
  unregister: (key: string) => void;
  /** Measured per-item origins for `alignItemWithTrigger`. */
  itemLayouts: Map<string, ItemLayout>;
  /** Bumps the disclosure when a layout lands so the positioner re-resolves. */
  layoutVersion: number;
  /** Static value-label table for closed-list display (Base `items`). */
  labelItems: ReadonlyArray<{ value: string; label: string }>;
  highlightedValue: string | null;
  onTypeaheadKey: (char: string) => void;
};

type SelectIndicatorDisclosure = {
  /** Whether the enclosing item is selected. */
  selected: boolean;
};

/**
 * Selected state for indicator parts. Internal (not exported): an
 * indicator renders its children only while its item is selected,
 * mirroring Base UI's indicator behavior without a second state
 * owner (the `Menu` indicator precedent).
 */
const SelectIndicatorContext = createContext<SelectIndicatorDisclosure | null>(
  null,
);

export function SelectRoot({
  value,
  defaultValue = null,
  onValueChange,
  multiple = false,
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  modal = true,
  disablePointerDismissal = false,
  disabled = false,
  children,
  ref,
}: SelectRootProps): React.JSX.Element {
  // Accepted for ref-spreading callers; the root renders no element
  // to attach it to (the `MenuRoot` precedent).
  void ref;
  // `onValueChange` takes the committed selection while the state
  // domain includes `null` (nothing selected), so forward everything
  // except `null`: single strings and (with `multiple`) arrays after
  // every toggle.
  const handleValueChange = useCallback(
    (next: string | string[] | null) => {
      if (next !== null) {
        onValueChange?.(next);
      }
    },
    [onValueChange],
  );
  const [selectedValue, setSelectedValue] = useControllableState<
    string | string[] | null
  >(value, defaultValue, handleValueChange);

  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const registry = useCollectionRegistry();
  const { items: registryItems, register, unregister } = registry;

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((previous) => !(previous ?? false));
  }, [disabled, setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const dismiss = useCallback(() => {
    if (disablePointerDismissal) return;
    onDismiss?.();
    setOpen(false);
  }, [disablePointerDismissal, onDismiss, setOpen]);

  const choose = useCallback(
    (next: string) => {
      if (disabled) return;
      if (multiple) {
        // Multi-select toggles membership and stays open (Base UI:
        // choosing in `multiple` mode never dismisses).
        const current = Array.isArray(selectedValue)
          ? selectedValue
          : selectedValue == null
            ? []
            : [selectedValue];
        setSelectedValue(
          current.includes(next)
            ? current.filter((entry) => entry !== next)
            : [...current, next],
        );
        return;
      }
      // Re-selecting the selected value keeps it: the hook's identity
      // guard suppresses the repeat callback, but the close still
      // commits (the selection-model rule).
      setSelectedValue(next);
      setOpen(false);
    },
    [disabled, multiple, selectedValue, setOpen, setSelectedValue],
  );

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  // Selected-item geometry for `alignItemWithTrigger` (Base UI: the
  // popup opens with the selected item over the trigger).
  const {
    layouts: itemLayouts,
    reportItemLayout,
    layoutVersion,
  } = useItemLayoutRegistry();

  // Terminal: a disabled root reads closed under any open state — no
  // list, no scrim, no portal (the `disabled` contract rule).
  const effectiveOpen = disabled ? false : (isOpen ?? false);

  const [highlightedValue, setHighlightedValue] = useState<string | null>(null);
  const typeaheadBufferRef = useRef<TypeaheadBuffer | null>(null);

  const onTypeaheadKey = useCallback(
    (keyChar: string) => {
      if (disabled || !effectiveOpen) return;
      if (keyChar.length !== 1) return;
      const now = Date.now();
      const nextBuffer = appendTypeaheadQuery(
        typeaheadBufferRef.current,
        keyChar,
        now,
      );
      typeaheadBufferRef.current = nextBuffer;
      const fromKey = Array.isArray(selectedValue)
        ? (selectedValue[0] ?? highlightedValue ?? null)
        : (highlightedValue ?? selectedValue);
      const matched = matchTypeaheadKey(
        registryItems,
        nextBuffer.text,
        fromKey,
      );
      if (matched === undefined) return;
      // Multi-select highlights without committing: there is no
      // single value to converge on, and committing would clobber
      // the set (single-select keeps the commit-on-match behavior).
      setHighlightedValue(matched);
      if (!multiple) {
        setSelectedValue(matched);
      }
    },
    [
      disabled,
      effectiveOpen,
      registryItems,
      highlightedValue,
      multiple,
      selectedValue,
      setSelectedValue,
    ],
  );

  useEffect(() => {
    if (!effectiveOpen) {
      setHighlightedValue(null);
      typeaheadBufferRef.current = null;
    }
  }, [effectiveOpen]);

  const disclosure = useMemo<SelectRootDisclosure>(
    () => ({
      selectedValue,
      groupDisabled: disabled,
      choose,
      open: effectiveOpen,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
      anchorHostRef,
      setAnchorRef,
      items: registryItems,
      register,
      unregister,
      reportItemLayout,
      itemLayouts,
      layoutVersion,
      labelItems: items ?? [],
      highlightedValue,
      onTypeaheadKey,
    }),
    [
      selectedValue,
      disabled,
      choose,
      effectiveOpen,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
      setAnchorRef,
      registryItems,
      register,
      unregister,
      reportItemLayout,
      itemLayouts,
      layoutVersion,
      items,
      highlightedValue,
      onTypeaheadKey,
    ],
  );

  // The root owns state, never layout: no host element (Base UI parity).
  // The overlay root wraps it so Android back, stacking, dismissal
  // and focus belong to one owner (the `MenuRoot` precedent). The
  // overlay tracks the effective (disabled-terminal) open state — the
  // same value the parts read — while open-state writes flow back
  // through `setOpen`.
  return (
    <OverlayRoot
      open={effectiveOpen}
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
      <SelectRootContext.Provider value={disclosure}>
        {children}
      </SelectRootContext.Provider>
    </OverlayRoot>
  );
}

export function SelectTrigger({
  testID,
  style,
  children,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  render,
}: SelectTriggerProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  const open = root?.open ?? false;
  const effectiveDisabled = disabled || (root?.groupDisabled ?? false);
  const state: SelectTriggerState = { open, disabled: effectiveDisabled };

  const toggleTrigger = useCallback(() => {
    if (effectiveDisabled) return;
    root?.toggle();
  }, [effectiveDisabled, root]);

  // Register the host for `SelectPositioner` measurement; outside a
  // root there is nothing to anchor to and registration is a no-op.
  const setTriggerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      root?.setAnchorRef(node);
    },
    [root],
  );

  // Outside a root there is no disclosure to toggle: render inert
  // rather than dropping the node silently.
  const inert = root === null;
  const substituted = resolveRender(
    render,
    {
      role: "combobox",
      "aria-expanded": open,
      "aria-disabled": effectiveDisabled || inert || undefined,
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {}),
      testID,
      disabled: effectiveDisabled || inert,
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
      role="combobox"
      aria-expanded={open}
      aria-disabled={effectiveDisabled || inert || undefined}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      disabled={effectiveDisabled || inert}
      onPress={toggleTrigger}
      style={resolveStyle(style, state)}
    >
      {wrapText(children)}
    </Pressable>
  );
}

export function SelectValue({
  placeholder,
  children,
  testID,
  style,
  render,
}: SelectValueProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  const value = root?.selectedValue ?? null;
  // The registered label first (items publish on mount while the
  // list is open), then the root `items` table (closed-list display
  // — registrations unmount with the list), then the raw value (an
  // item that never registered still shows something honest), then
  // the placeholder. Under `multiple` each selected value resolves
  // the same way and the labels join with ", ".
  const lookup = (one: string): string => {
    const registered = findCollectionText(root?.items ?? [], one);
    const tabled = root?.labelItems.find((entry) => entry.value === one)?.label;
    return registered ?? tabled ?? one;
  };
  const label =
    value === null || value === undefined
      ? undefined
      : Array.isArray(value)
        ? value.length === 0
          ? undefined
          : value.map(lookup).join(", ")
        : lookup(value);
  const showingPlaceholder = label === undefined;
  const state: SelectValueState = { value, placeholder: showingPlaceholder };
  const content =
    typeof children === "function"
      ? children(value)
      : (children ?? label ?? placeholder);

  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      children: content,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Text testID={testID} style={resolveStyle(style, state)}>
      {content}
    </Text>
  );
}

export function SelectPortal({
  children,
  testID,
}: SelectPortalProps): React.JSX.Element | null {
  const root = useContext(SelectRootContext);
  // Outside a root there is no open state to present: render nothing.
  if (!root) return null;
  if (!root.open) return null;

  // The portal host: `OverlayPortal` paints at the app's
  // `PortalHost`, so the compound list escapes clipped parents —
  // that is the point of the part — without an RN `Modal` of its own
  // (one root presents every layer: Android back, stacking, focus
  // and scroll lock belong to the `OverlayRoot` above — the `Menu`
  // compound precedent). `container` has no native meaning and is
  // omitted by design. Non-modal roots present through the plain
  // `Portal` with no scrim instead (the `Menu` compound precedent).
  //
  // The root disclosure is re-provided inside the portal: portaled
  // content renders at the host, outside this root's subtree, so
  // without an explicit provider the parts below would read a null
  // root.
  if (!root.modal) {
    return (
      <Portal>
        <SelectRootContext.Provider value={root}>
          <View testID={testID}>{children}</View>
        </SelectRootContext.Provider>
      </Portal>
    );
  }
  return (
    <OverlayPortal testID={testID}>
      <SelectRootContext.Provider value={root}>
        {children}
      </SelectRootContext.Provider>
    </OverlayPortal>
  );
}

/** Anchor-relative scrim fill: structural layout, not a visual value. */
const scrimFillStyle: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function SelectBackdrop({
  testID,
  style,
  render,
}: SelectBackdropProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  if (!root) return null;
  if (!root.open) return null;
  const state: SelectBackdropState = { open: root.open };

  if (!root.disablePointerDismissal) {
    const substituted = resolveRender(
      render,
      {
        "aria-label": "Dismiss select",
        testID,
        onPress: root.dismiss,
        style: resolveStyle(style, state),
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        aria-label="Dismiss select"
        testID={testID}
        onPress={root.dismiss}
        style={[scrimFillStyle, resolveStyle(style, state)]}
      />
    );
  }

  // Non-dismissable: a plain host with no label and no handler — no
  // fake affordance (the `MenuBackdrop` precedent).
  const substituted = resolveRender(
    render,
    { testID, style: resolveStyle(style, state) } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return (
    <View
      testID={testID}
      style={[scrimFillStyle, resolveStyle(style, state)]}
    />
  );
}

export function SelectPositioner({
  side = "bottom",
  align,
  sideOffset,
  alignOffset,
  alignItemWithTrigger = true,
  testID,
  style,
  children,
  render,
}: SelectPositionerProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  // Align the selected item over the trigger (Base UI default): the
  // offset is the selected item's list-local origin, read from the
  // item-layout registry the items report into on layout. Falls back
  // to trigger anchoring with no selection.
  const selected = root?.selectedValue;
  const alignedKey: string | null = Array.isArray(selected)
    ? (selected[0] ?? null)
    : (selected ?? null);
  const alignedOffset =
    root && alignItemWithTrigger && alignedKey !== null
      ? (root.itemLayouts.get(alignedKey) ?? null)
      : null;
  // Hooks before guards: measurement runs (harmlessly) even while
  // closed so activation never reorders hook calls.
  const floating = useFloatingPlacement({
    anchorRef: root?.anchorHostRef ?? { current: null },
    placement: side,
    offset: sideOffset,
    align,
    alignOffset,
    contentOffset:
      alignedOffset === null
        ? undefined
        : { x: alignedOffset.x, y: alignedOffset.y },
    active: root?.open ?? false,
  });
  if (!root) return null;
  if (!root.open) return null;
  const state: SelectPositionerState = { open: root.open, side: floating.side };

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

/**
 * Assign one value to every ref in the list, for the popup host.
 * Inline here (not imported) deliberately — the contract rule, see
 * every other part in this package.
 */
function assignPopupRef(
  ref: SelectPopupProps["ref"],
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

export function SelectPopup({
  testID,
  style,
  children,
  render,
  ref,
}: SelectPopupProps): React.ReactNode {
  const root = useContext(SelectRootContext);

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
      root?.onTypeaheadKey(char);
    },
    [root],
  );

  if (!root) return null;
  if (!root.open) return null;
  const state: SelectPopupState = { open: root.open };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      role: "listbox" as never,
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
      role={"listbox" as never}
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

export function SelectArrow({
  testID,
  style,
  children,
  render,
}: SelectArrowProps): React.ReactNode {
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

export function SelectGroup({
  testID,
  style,
  children,
  render,
}: SelectGroupProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      role: "group",
      testID,
      style,
      children,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View role="group" testID={testID} style={style}>
      {children}
    </View>
  );
}

export function SelectGroupLabel({
  testID,
  style,
  children,
  render,
}: SelectGroupLabelProps): React.ReactNode {
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

export function SelectSeparator({
  testID,
  style,
  render,
}: SelectSeparatorProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return <View accessible={false} testID={testID} style={style} />;
}

export function SelectItemText({
  testID,
  style,
  children,
  render,
}: SelectItemTextProps): React.ReactNode {
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

export function SelectItemIndicator({
  testID,
  style,
  children,
  render,
}: SelectItemIndicatorProps): React.ReactNode {
  const indicator = useContext(SelectIndicatorContext);
  // Rendered only while the enclosing item is selected (Base UI
  // indicator behavior). Outside an item there is no selection to
  // read: render nothing.
  if (!indicator?.selected) return null;
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

export type SelectScrollArrowState = {
  /** Whether the list is currently open. */
  open: boolean;
  /** Whether the arrow is currently disabled. */
  disabled: boolean;
};

export type SelectScrollUpArrowProps = {
  testID?: string;
  /** Value or function of arrow state, caller-provided. */
  style?: StateStyle<SelectScrollArrowState, StyleProp<ViewStyle>>;
  /** Arrow marker content (usually a chevron glyph). */
  children?: ReactNode;
  /** Terminal: it never scrolls and is announced as disabled. Default `false`. */
  disabled?: boolean;
  /** Accessible name source (ADR-112). Default `"Scroll up"`. */
  "aria-label"?: string;
  /**
   * Ref to the scrolling `ScrollView` the caller composes around the
   * items (usually inside the same `SelectPopup`). The default press
   * jumps that scroller to the top. Caller content stays unstyled —
   * the ref only needs the host's scroll methods at press time.
   */
  scrollRef?: RefObject<unknown>;
  /**
   * Runs after the default scroll-to-top. Composes like the trigger
   * `onPress` (internal first, then the caller's handler).
   */
  onPress?: () => void;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<SelectScrollArrowState, SlotProps>;
};

export type SelectScrollDownArrowProps = {
  testID?: string;
  /** Value or function of arrow state, caller-provided. */
  style?: StateStyle<SelectScrollArrowState, StyleProp<ViewStyle>>;
  /** Arrow marker content (usually a chevron glyph). */
  children?: ReactNode;
  /** Terminal: it never scrolls and is announced as disabled. Default `false`. */
  disabled?: boolean;
  /** Accessible name source (ADR-112). Default `"Scroll down"`. */
  "aria-label"?: string;
  /**
   * Ref to the scrolling `ScrollView` the caller composes around the
   * items (usually inside the same `SelectPopup`). The default press
   * jumps that scroller to the end. Caller content stays unstyled —
   * the ref only needs the host's scroll methods at press time.
   */
  scrollRef?: RefObject<unknown>;
  /**
   * Runs after the default scroll-to-end. Composes like the trigger
   * `onPress` (internal first, then the caller's handler).
   */
  onPress?: () => void;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<SelectScrollArrowState, SlotProps>;
};

/**
 * Read the host scroll methods off a caller-provided ref without
 * importing a host component the boundary gate does not allow.
 * Anything without the method is a no-op — a caller typo must not
 * crash the list.
 */
type ScrollerHost = {
  scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToEnd?: (options?: { animated?: boolean }) => void;
} | null;

type UnknownScroller = {
  scrollTo?: unknown;
  scrollToEnd?: unknown;
};

function scrollerHost(ref: RefObject<unknown> | undefined): ScrollerHost {
  const current = ref?.current;
  if (typeof current !== "object" || current === null) return null;
  // `typeof x === "function"` narrows `unknown` only to `Function`,
  // which never satisfies a concrete signature — so read each prop
  // as the target function type directly (a real `ScrollView` host
  // satisfies it structurally) and gate the call on being callable.
  const host = current as UnknownScroller;
  return {
    scrollTo:
      typeof host.scrollTo === "function"
        ? (host.scrollTo as NonNullable<ScrollerHost>["scrollTo"])
        : undefined,
    scrollToEnd:
      typeof host.scrollToEnd === "function"
        ? (host.scrollToEnd as NonNullable<ScrollerHost>["scrollToEnd"])
        : undefined,
  };
}

function SelectScrollArrow({
  direction,
  defaultLabel,
  testID,
  style,
  children,
  disabled = false,
  "aria-label": ariaLabel,
  scrollRef,
  onPress,
  render,
}: {
  direction: "up" | "down";
  defaultLabel: string;
  testID?: string;
  style?: StateStyle<SelectScrollArrowState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  disabled?: boolean;
  "aria-label"?: string;
  scrollRef?: RefObject<unknown>;
  onPress?: () => void;
  render?: RenderProp<SelectScrollArrowState, SlotProps>;
}): React.ReactNode {
  const root = useContext(SelectRootContext);
  const open = root?.open ?? false;
  const state: SelectScrollArrowState = { open, disabled };

  const commitScroll = useCallback(() => {
    if (disabled) return;
    const host = scrollerHost(scrollRef);
    if (direction === "up") {
      host?.scrollTo?.({ y: 0, animated: false });
    } else {
      host?.scrollToEnd?.({ animated: false });
    }
    onPress?.();
  }, [disabled, direction, onPress, scrollRef]);

  const substituted = resolveRender(
    render,
    {
      role: "button",
      "aria-label": ariaLabel ?? defaultLabel,
      "aria-disabled": disabled || undefined,
      testID,
      disabled,
      onPress: commitScroll,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      role="button"
      aria-label={ariaLabel ?? defaultLabel}
      aria-disabled={disabled || undefined}
      testID={testID}
      disabled={disabled}
      onPress={commitScroll}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function SelectScrollUpArrow(
  props: SelectScrollUpArrowProps,
): React.ReactNode {
  return (
    <SelectScrollArrow direction="up" defaultLabel="Scroll up" {...props} />
  );
}

export function SelectScrollDownArrow(
  props: SelectScrollDownArrowProps,
): React.ReactNode {
  return (
    <SelectScrollArrow direction="down" defaultLabel="Scroll down" {...props} />
  );
}
