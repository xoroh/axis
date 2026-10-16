import { type ElementRef, type Ref, useCallback } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Pagination — an unstyled page navigator.
 *
 * Structure only: previous/next `Pressable` controls around a caller-
 * rendered page indicator (`children`, typically "3 of 12" text).
 * Page arithmetic (clamp, ellipsis) belongs to the caller — this
 * component owns bounded previous/next transitions and nothing else.
 */

export type PaginationProps = {
  /** Controlled page (1-based). Wins over `defaultPage` when defined. */
  page?: number;
  /** Uncontrolled initial page. Default `1`. */
  defaultPage?: number;
  /** Total pages. Below 1 collapses to a single page. */
  pageCount?: number;
  /** Fires with the next page on every committed navigation. */
  onPageChange?: (page: number) => void;
  /** Terminal: no navigation. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Page indicator content (e.g. "3 of 12"). */
  children?: React.ReactNode;
  /** Labels for the controls (assistive tech + visible text). */
  previousLabel?: string;
  nextLabel?: string;
  /** Forwarded to the container host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

function assignRef(
  ref: PaginationProps["ref"],
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

export function Pagination({
  page,
  defaultPage = 1,
  pageCount = 1,
  onPageChange,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  previousLabel = "Previous page",
  nextLabel = "Next page",
  ref,
}: PaginationProps): React.JSX.Element {
  const total = pageCount >= 1 ? Math.floor(pageCount) : 1;
  const clamp = useCallback(
    (p: number) => Math.min(Math.max(Math.floor(p), 1), total),
    [total],
  );
  const [current, setCurrent] = useControllableState<number>(
    page !== undefined ? clamp(page) : undefined,
    clamp(defaultPage),
    onPageChange,
  );
  const at = clamp(current ?? 1);

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const go = useCallback(
    (delta: 1 | -1) => {
      if (disabled) return;
      const next = clamp(at + delta);
      if (next !== at) setCurrent(next);
    },
    [at, clamp, disabled, setCurrent],
  );

  return (
    <View
      ref={setHostRef}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style}
    >
      <Pressable
        accessibilityLabel={previousLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || at <= 1 }}
        disabled={disabled || at <= 1}
        onPress={() => go(-1)}
      >
        <Text>{previousLabel}</Text>
      </Pressable>
      {children}
      <Pressable
        accessibilityLabel={nextLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || at >= total }}
        disabled={disabled || at >= total}
        onPress={() => go(1)}
      >
        <Text>{nextLabel}</Text>
      </Pressable>
    </View>
  );
}
