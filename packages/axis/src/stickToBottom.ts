/**
 * The stick-to-bottom model — auto-scroll that pauses when the reader
 * scrolls up and resumes at the bottom.
 *
 * ## Why this is a primitive
 *
 * Message lists on both renderers answer the same two questions on
 * every scroll event and every content growth: is the viewport pinned
 * to the newest edge, and should new content pull it there. Two
 * independent implementations drift on exactly the edge that matters —
 * the threshold that decides "at the bottom" — so streaming text
 * yanks one renderer away from history the reader is re-reading.
 *
 * ## What is genuinely shared, and what is not
 *
 * The MATH and the STUCK BIT are shared: given plain rect numbers,
 * whether the viewport counts as pinned, and the `stuck` state with
 * its pause-on-scroll-up / resume-at-bottom transitions. The
 * MEASUREMENT and the SCROLLING are not — reading content/viewport
 * sizes and calling `scrollToEnd` are platform code. So the renderer
 * measures and reports, this decides; the renderer performs the
 * scroll this returns true for.
 *
 * All values are plain numbers in the same unit space the caller
 * measured in (CSS px on web, dp on native), following the
 * `positioning` precedent. `scrollOffset` is the distance scrolled
 * from the start edge (top); inverted RN lists report the same
 * quantity from their own metrics before calling in.
 */

import { useCallback } from "react";
import { useControllableState } from "./useControllableState";

/** Plain-rect snapshot of the scroll container. All values `>= 0`. */
export type StickToBottomMetrics = {
  /** Total scrollable content extent. */
  contentHeight: number;
  /** Visible viewport extent. */
  viewportHeight: number;
  /** Distance scrolled from the start (top) edge. */
  scrollOffset: number;
};

function distanceToBottom(metrics: StickToBottomMetrics): number {
  return metrics.contentHeight - metrics.viewportHeight - metrics.scrollOffset;
}

/**
 * Whether the viewport counts as pinned to the newest edge: the
 * remaining distance is within `threshold` (default `24`, about one
 * text line — sub-line drift from fractional layout must not unpin).
 * Content shorter than the viewport is trivially at the bottom.
 */
export function isAtBottom(
  metrics: StickToBottomMetrics,
  threshold = 24,
): boolean {
  return distanceToBottom(metrics) <= threshold;
}

/**
 * Whether the scroll-to-bottom affordance shows: the reader has left
 * the bottom AND there is somewhere to go (content overflows the
 * viewport). A short list never shows the button, stuck or not.
 */
export function resolveScrollButtonVisible(options: {
  stuck: boolean;
  contentHeight: number;
  viewportHeight: number;
}): boolean {
  return !options.stuck && options.contentHeight > options.viewportHeight;
}

/**
 * The stuck bit, controlled or uncontrolled, with the two transitions
 * every renderer wires:
 *
 * - `handleScroll`: the reader moved — stuck follows `isAtBottom`,
 *   so scrolling up pauses and reaching the bottom resumes.
 * - `handleContentChange`: new content arrived (a streamed token, a
 *   new message) — returns whether the caller scrolls to the newest
 *   edge now (true only while stuck; a paused reader is never yanked).
 * - `scrollToBottom`: the scroll-button press — re-pins (the caller
 *   performs the scroll, then feeds the resulting metrics back
 *   through `handleScroll`).
 */
export function useStickToBottom(options?: {
  stuck?: boolean;
  defaultStuck?: boolean;
  onStuckChange?: (stuck: boolean) => void;
  /** "At the bottom" tolerance. Default `24`. */
  threshold?: number;
}): {
  stuck: boolean;
  showScrollButton: (metrics: StickToBottomMetrics) => boolean;
  handleScroll: (metrics: StickToBottomMetrics) => void;
  handleContentChange: (metrics: StickToBottomMetrics) => boolean;
  scrollToBottom: () => void;
} {
  const threshold = options?.threshold ?? 24;
  const [stuck, setStuck] = useControllableState<boolean>(
    options?.stuck,
    options?.defaultStuck ?? true,
    options?.onStuckChange,
  );
  const pinned = stuck ?? true;

  const handleScroll = useCallback(
    (metrics: StickToBottomMetrics) => {
      setStuck(isAtBottom(metrics, threshold));
    },
    [setStuck, threshold],
  );

  const handleContentChange = useCallback(
    (metrics: StickToBottomMetrics) => {
      // Re-derive from the fresh metrics rather than trusting the
      // stored bit: content that shrank the overflow (a message
      // deleted above) unpins without any scroll event.
      const atBottom = isAtBottom(metrics, threshold);
      if (!pinned) return false;
      if (!atBottom) setStuck(false);
      return atBottom;
    },
    [pinned, setStuck, threshold],
  );

  const scrollToBottom = useCallback(() => {
    setStuck(true);
  }, [setStuck]);

  const showScrollButton = useCallback(
    (metrics: StickToBottomMetrics) =>
      resolveScrollButtonVisible({
        stuck: pinned,
        contentHeight: metrics.contentHeight,
        viewportHeight: metrics.viewportHeight,
      }),
    [pinned],
  );

  return {
    stuck: pinned,
    showScrollButton,
    handleScroll,
    handleContentChange,
    scrollToBottom,
  };
}
