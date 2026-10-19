import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { type RenderProp, resolveRender } from "../render";
import type { SlotProps } from "../slot";

/**
 * TableRoot — an unstyled tabular structure.
 *
 * Structure only: a root `View` (`TableRoot`) carrying an optional header
 * group (`TableHeader`, the column-label row container) followed by body
 * rows (`TableRow` of `TableCell`). No default visuals — every visual
 * value (`style` per part) is caller-provided. Column widths, alignment,
 * and zebra striping belong to the caller.
 *
 * No role is declared on `Table`, `TableHeader`, or `TableCell`:
 * React Native's screen-reader-mapped `accessibilityRole` defines no
 * table, rowgroup, row, cell, or columnheader value (verified against
 * `ViewAccessibility.d.ts` in the pinned `react-native` — the
 * `AccessibilityRole` union has `header`, `list`, `grid`, `pager`, but
 * nothing tabular). The newer ARIA `role` prop does list table-family
 * values, but it has no consistent native screen-reader mapping and no
 * package precedent, so v1 declares no role anywhere and documents the
 * gap instead of asserting an unmapped value (the contract §5 rule: a
 * component that cannot express its relationship documents the gap).
 * A header row (`TableRow header`) is announced with the generic
 * `header` role — the closest mapped value — and nothing else.
 *
 * Plain `View` throughout, no virtualization: `ScrollView` is NOT in
 * the boundary allowlist (`boundary-policy.mjs` `RN_HOST_BINDINGS` —
 * verified absent), so large data sets stay a caller concern (windowing
 * belongs to the caller, e.g. a virtualized list rendering `TableRow`s).
 * Sorting, pagination, row selection, and column resizing are explicitly
 * deferred — each needs its own state domain and contract section
 * first, not flags on this type.
 */

export type TableRowState = {
  /** Whether this row is a header row. */
  header: boolean;
};

export type TableRootProps = {
  /** Table content: a `TableHeader` followed by body `TableRow`s, in order. */
  children: ReactNode;
  /** Accessible name source (e.g. "Order history"). */
  accessibilityLabel?: string;
  testID?: string;
  /** Root container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The table carries no state, so the
   * function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
  /** Forwarded to the root host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type TableHeaderProps = {
  /** Header content: the column-label row (`TableRow header` or bare `TableCell`s). */
  children: ReactNode;
  testID?: string;
  /** Header group container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity). The header
   * carries no state, so the function form receives an empty state
   * object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type TableRowProps = {
  /** Row content (`TableCell`s). */
  children: ReactNode;
  /**
   * Structural marker only: when true the row is announced with the
   * generic `header` role (React Native maps no rowheader role). Carries
   * NO styling — header is a structural grouping, not a visual variant.
   */
  header?: boolean;
  testID?: string;
  /** Row container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)` with `{ header }`.
   */
  render?: RenderProp<TableRowState, SlotProps>;
};

export type TableCellProps = {
  /** Cell content. Optional so empty (spacer) cells render. */
  children?: ReactNode;
  testID?: string;
  /** Cell container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity). The cell
   * carries no state, so the function form receives an empty state
   * object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: TableRootProps["ref"],
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

export function TableRoot({
  children,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: TableRootProps): React.ReactNode {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      style,
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      {children}
    </View>
  );
}

export function TableHeader({
  children,
  testID,
  style,
  render,
}: TableHeaderProps): React.ReactNode {
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

export function TableRow({
  children,
  header = false,
  testID,
  style,
  render,
}: TableRowProps): React.ReactNode {
  const state: TableRowState = { header };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: header ? "header" : undefined,
      testID,
      style,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      accessibilityRole={header ? "header" : undefined}
      testID={testID}
      style={style}
    >
      {children}
    </View>
  );
}

export function TableCell({
  children,
  testID,
  style,
  render,
}: TableCellProps): React.ReactNode {
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
