import {
  Children,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
} from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Carousel — an unstyled paged content stepper.
 *
 * Structure only: a root `View` carrying a "Previous" `Pressable`, the
 * active page, and a "Next" `Pressable`. Only the active page is mounted
 * — siblings unmount on navigation (presence is mount/unmount, never
 * hiding styles). No default visuals: every visual value (`style` on
 * the root) is caller-provided, and page indicators/dots are NOT
 * rendered — the consumer derives them from `onIndexChange`
 * (indicators are consumer state, not carousel state).
 *
 * State follows the `useControllableState` pattern: `index` (+
 * `onIndexChange`) for controlled use, `defaultIndex` for uncontrolled
 * (default `0`). Every navigation clamps into `[0, pageCount - 1]`;
 * out-of-range `index`/`defaultIndex` values clamp to the nearest bound
 * (never throw). With `loop`, navigation wraps at the ends; without it
 * the end controls are disabled and pressing them is a no-op that fires
 * no callback.
 *
 * No swipe: gesture paging is deferred — there is no PanResponder
 * carousel yet, and `ScrollView` (the paging host) is NOT in the
 * boundary allowlist (`boundary-policy.mjs` `RN_HOST_BINDINGS` —
 * verified absent), so it cannot be used here. `Slider` owns the
 * gesture precedent to follow when a swipeable carousel slice lands.
 * No auto-advance: timers are a caller concern.
 *
 * No role is declared on the root: React Native's screen-reader-mapped
 * `accessibilityRole` defines no carousel value (verified against
 * `ViewAccessibility.d.ts` in the pinned `react-native`), and inventing
 * one would be a lie a screen reader cannot cash (the `Label`
 * precedent). The prev/next controls carry the button role with their
 * visible labels as accessible names.
 */

export type CarouselProps = {
  /** Controlled page index (0-based). Wins over `defaultIndex` when defined; clamped into range. */
  index?: number;
  /** Uncontrolled initial page index. Default `0`; clamped into range. */
  defaultIndex?: number;
  /** Fires with the next index on every committed navigation. */
  onIndexChange?: (index: number) => void;
  /** Pages to step through. Only the active page is mounted. */
  children: ReactNode;
  /** When true, navigation wraps at the ends. Default `false`. */
  loop?: boolean;
  testID?: string;
  /** Root container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Forwarded to the root host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: CarouselProps["ref"],
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

export function Carousel({
  index,
  defaultIndex = 0,
  onIndexChange,
  children,
  loop = false,
  testID,
  style,
  ref,
}: CarouselProps): React.JSX.Element {
  const pages = Children.toArray(children);
  const count = pages.length;

  // An empty carousel has no valid index — every navigation is a
  // no-op and nothing mounts. `Math.floor` keeps fractional indices
  // integral; a zero-page clamp lands on `0`, which renders nothing.
  const clampIndex = useCallback(
    (next: number) =>
      count <= 0 ? 0 : Math.min(Math.max(Math.floor(next), 0), count - 1),
    [count],
  );

  const [rawIndex, setRawIndex] = useControllableState<number>(
    index !== undefined ? clampIndex(index) : undefined,
    clampIndex(defaultIndex),
    onIndexChange,
  );
  // Re-clamp every render so a shrinking page list cannot strand the
  // pointer past the end (the `Pagination` collapsing-range precedent).
  const at = clampIndex(rawIndex ?? 0);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const go = useCallback(
    (delta: 1 | -1) => {
      if (count <= 0) return;
      const next = loop ? (at + delta + count) % count : clampIndex(at + delta);
      // A clamped no-op (at a bound without `loop`, or a single page
      // with `loop`) settles on the current index, which the
      // controllable state treats as unchanged — no callback fires.
      setRawIndex(next);
    },
    [at, clampIndex, count, loop, setRawIndex],
  );

  const goPrevious = useCallback(() => go(-1), [go]);
  const goNext = useCallback(() => go(1), [go]);

  // Without `loop` the ends are terminal (the `Pagination` bound
  // precedent); with `loop` every step moves while more than one page
  // exists. A zero- or single-page carousel disables both controls.
  const previousDisabled = count <= 1 || (!loop && at <= 0);
  const nextDisabled = count <= 1 || (!loop && at >= count - 1);

  return (
    <View ref={setHostRef} testID={testID} style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: previousDisabled }}
        accessibilityLabel="Previous"
        disabled={previousDisabled}
        onPress={goPrevious}
      >
        <Text>Previous</Text>
      </Pressable>
      {pages[at] ?? null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: nextDisabled }}
        accessibilityLabel="Next"
        disabled={nextDisabled}
        onPress={goNext}
      >
        <Text>Next</Text>
      </Pressable>
    </View>
  );
}
