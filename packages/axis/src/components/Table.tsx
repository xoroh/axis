import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Table — an unstyled tabular structure.
 *
 * Structure only: a root `View` (`Table`) carrying an optional header
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

export type TableProps = {
  /** Table content: a `TableHeader` followed by body `TableRow`s, in order. */
  children: ReactNode;
  /** Accessible name source (e.g. "Order history"). */
  accessibilityLabel?: string;
  testID?: string;
  /** Root container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Forwarded to the root host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type TableHeaderProps = {
  /** Header content: the column-label row (`TableRow header` or bare `TableCell`s). */
  children: ReactNode;
  testID?: string;
  /** Header group container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
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
};

export type TableCellProps = {
  /** Cell content. Optional so empty (spacer) cells render. */
  children?: ReactNode;
  testID?: string;
  /** Cell container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: TableProps["ref"],
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

export function Table({
  children,
  accessibilityLabel,
  testID,
  style,
  ref,
}: TableProps): React.JSX.Element {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

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
}: TableHeaderProps): React.JSX.Element {
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
}: TableRowProps): React.JSX.Element {
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
}: TableCellProps): React.JSX.Element {
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}
