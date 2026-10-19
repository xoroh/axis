import { act } from "react";
// @ts-expect-error — react-test-renderer ships no types, and a
// dev-only @types package for one hook test outweighs the test
// itself. The import stays untyped (any) rather than faked: the
// runtime copy is the same one the RNTL preset depends on.
import { create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  type MeasurableRef,
  useFloatingPlacement,
} from "./components/useFloatingPlacement";
import { PortalHost, Tooltip } from "./index";
import type { Placement } from "./positioning";

// The mocked `react-native` below does not install the `__DEV__`
// global the real runtime guarantees (Metro and the jest preset both
// define it); the Portal contract reads it, so the suite provides it.
(globalThis as { __DEV__?: boolean }).__DEV__ = true;

/**
 * Placement resolving through the hook with an injectable anchor node.
 *
 * The hook reads its anchor through a host ref, so the test supplies
 * the node directly: a web element shape (a rect with no `measure`,
 * the way React Native Web host refs behave where `measure` never
 * delivers) and the native shape (a synchronous `measure` callback).
 * `react-native` is mocked to just the viewport hook plus string host
 * stubs because the modules under test must never load the real
 * native runtime here — and because native proof files
 * (`*.rntest.tsx`) may only import the public entry, this unit lives
 * in vitest instead.
 */

vi.mock("react-native", () => ({
  useWindowDimensions: () => ({
    width: 750,
    height: 1334,
    scale: 2,
    fontScale: 1,
  }),
  StyleSheet: { create: (styles: unknown) => styles },
  // String hosts: props and refs pass straight through to the test
  // renderer, which attaches `createNodeMock` results as ref nodes.
  View: "div",
  Pressable: "div",
  Text: "span",
}));

const CONTENT_SIZE = { width: 100, height: 40 };

type Resolved = ReturnType<typeof useFloatingPlacement>;

function resolve(options: {
  node: MeasurableRef["current"];
  active?: boolean;
  target?: unknown;
  reportSize?: boolean;
  matchAnchorWidth?: boolean;
  viewportPadding?: number;
}): Resolved {
  const {
    node,
    active = true,
    target,
    reportSize = true,
    matchAnchorWidth,
    viewportPadding,
  } = options;
  const anchorRef: MeasurableRef = { current: node };
  let latest: Resolved | undefined;
  function Probe(): null {
    latest = useFloatingPlacement({
      anchorRef,
      active,
      matchAnchorWidth,
      viewportPadding,
    });
    return null;
  }
  let root: ReturnType<typeof create> | undefined;
  act(() => {
    root = create(<Probe />);
  });
  if (reportSize) {
    act(() => {
      latest?.onContentLayout({
        nativeEvent: { layout: { ...CONTENT_SIZE }, target },
      });
    });
  }
  const out = latest;
  root?.unmount();
  if (!out) throw new Error("floatingplacement test: hook never resolved");
  return out;
}

function webNode(): MeasurableRef["current"] {
  return {
    getBoundingClientRect: () => ({
      left: 10,
      top: 20,
      width: 100,
      height: 40,
    }),
  };
}

describe("useFloatingPlacement anchor shapes", () => {
  it("resolves placement for a web element anchor without measure", () => {
    // The React Native Web shape: the host ref is the element itself,
    // carrying its viewport rect but no working `measure`. Placement
    // must resolve from the rect — real size, anchored to the trigger.
    const floating = resolve({ node: webNode() });
    expect(floating.style).toMatchObject({
      position: "absolute",
      left: 10,
      top: 60,
    });
    expect(floating.style.opacity).toBeUndefined();
    expect(floating.measured).toBe(true);
  });

  it("translates the anchor into the popup's containing block", () => {
    // Viewport coordinates alone double-offset an `absolute` popup
    // inside nested relative boxes: the layout event's node locates
    // the offset parent, whose origin is subtracted after
    // viewport-space flip/clamp.
    const floating = resolve({
      node: webNode(),
      target: {
        offsetParent: {
          getBoundingClientRect: () => ({ left: 4, top: 8 }),
        },
      },
    });
    expect(floating.style).toMatchObject({ left: 6, top: 52 });
  });

  it("keeps the native measure path untranslated", () => {
    // The native shape: `measure` reports window coordinates and the
    // popup stays `absolute` against the viewport origin. The web fix
    // must not move this path.
    const floating = resolve({
      node: {
        measure: (callback) => callback(0, 0, 100, 40, 10, 20),
      },
    });
    expect(floating.style).toMatchObject({
      position: "absolute",
      left: 10,
      top: 60,
    });
    expect(floating.style.opacity).toBeUndefined();
    expect(floating.measured).toBe(true);
  });

  it("stays transparent at origin until content size arrives", () => {
    const floating = resolve({ node: webNode(), reportSize: false });
    expect(floating.style).toMatchObject({
      opacity: 0,
      left: 0,
      top: 0,
    });
    expect(floating.measured).toBe(false);
  });

  it("stays transparent while inactive", () => {
    const floating = resolve({ node: webNode(), active: false });
    expect(floating.measured).toBe(false);
    expect(floating.style.opacity).toBe(0);
  });

  it("matches the popup width to the anchor when asked", () => {
    // Base UI anchor-width parity: the box takes the anchor's span
    // instead of its content size, so a centered popup sits exactly
    // over its trigger.
    const floating = resolve({
      node: {
        getBoundingClientRect: () => ({
          left: 10,
          top: 600,
          width: 100,
          height: 40,
        }),
      },
      matchAnchorWidth: true,
      viewportPadding: 8,
    });
    expect(floating.style).toMatchObject({
      left: 10,
      top: 640,
      width: 100,
    });
    expect(floating.measured).toBe(true);
  });

  it("clamps the matched width and origin into the padded viewport", () => {
    // A wide anchor near the right edge: the box shrinks to the
    // padded viewport and its origin clamps inside it.
    const floating = resolve({
      node: {
        getBoundingClientRect: () => ({
          left: 700,
          top: 20,
          width: 100,
          height: 40,
        }),
      },
      matchAnchorWidth: true,
      viewportPadding: 8,
    });
    // Viewport is 750 wide: width stays 100, origin clamps to
    // 750 - 100 - 8.
    expect(floating.style).toMatchObject({ left: 642, top: 60, width: 100 });
  });

  it("leaves content-sized popups alone by default", () => {
    // Without the opt-in the content size rules: no width override.
    const floating = resolve({ node: webNode() });
    expect(floating.style).toMatchObject({ left: 10, top: 60 });
    expect("width" in (floating.style as Record<string, unknown>)).toBe(false);
  });

  it("finds a transformed containing block the offset parent misses", () => {
    // A transformed but non-positioned ancestor creates the containing
    // block; `offsetParent` (null here — nothing positioned) would
    // miss it and leave viewport coordinates in place.
    const view = {
      getComputedStyle: (el: unknown) =>
        (el as { __style?: unknown }).__style ?? null,
    };
    const plain = {
      position: "static",
      transform: "none",
      perspective: "none",
      filter: "none",
      backdropFilter: "none",
      contain: "none",
      willChange: "auto",
    };
    const scrolledHost = {
      getBoundingClientRect: () => ({ left: 50, top: 60 }),
      parentNode: null,
      __style: { ...plain, transform: "matrix(1, 0, 0, 1, 0, 0)" },
    };
    const wrapper = { parentNode: scrolledHost, __style: plain };
    const target = {
      parentNode: wrapper,
      offsetParent: null,
      ownerDocument: { defaultView: view },
    };
    const floating = resolve({
      node: {
        getBoundingClientRect: () => ({
          left: 100,
          top: 200,
          width: 100,
          height: 40,
        }),
      },
      target,
      matchAnchorWidth: true,
      viewportPadding: 8,
    });
    // Anchor (100, 200) minus the host origin (50, 60), bottom side.
    expect(floating.style).toMatchObject({ left: 50, top: 180, width: 100 });
  });

  it("treats an explicit null offset parent as the viewport", () => {
    // `offsetParent` is null for `fixed`-positioned nodes (and with no
    // positioned ancestor at all): the containing block is the
    // viewport, so the anchor stands untranslated. Kept explicit.
    const floating = resolve({
      node: webNode(),
      target: { offsetParent: null },
    });
    expect(floating.style).toMatchObject({ left: 10, top: 60 });
    expect(floating.measured).toBe(true);
  });
});

describe("Tooltip monolith placement default", () => {
  // Mid-screen anchor: neither side overflows, so the preferred side
  // stands and the two candidates land 80 apart.
  const anchorNode = {
    getBoundingClientRect: () => ({
      left: 10,
      top: 600,
      width: 100,
      height: 40,
    }),
  };

  function openTip(placement?: Placement): Record<string, unknown> {
    let root: ReturnType<typeof create> | undefined;
    act(() => {
      root = create(
        <PortalHost>
          <Tooltip open placement={placement} content="Hint">
            Anchor
          </Tooltip>
        </PortalHost>,
        {
          createNodeMock: () => anchorNode,
        },
      );
    });
    // React 19 moved the query API onto the test instance.
    const tree = root?.root;
    act(() => {
      const tip = tree?.findByProps({ accessibilityRole: "tooltip" });
      tip?.props.onLayout({
        nativeEvent: { layout: { width: 100, height: 40 } },
      });
    });
    const style = tree?.findByProps({ accessibilityRole: "tooltip" }).props
      .style;
    root?.unmount();
    const flat = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style;
    return flat as Record<string, unknown>;
  }

  it("prefers the documented top side by default", () => {
    // `placement` omitted: the tip hangs above the anchor (600 − 40).
    // Before the `?? "top"` fix the hook fell back to `"bottom"`.
    expect(openTip()).toMatchObject({ left: 10, top: 560 });
  });

  it("still honors an explicit placement", () => {
    expect(openTip("bottom")).toMatchObject({ left: 10, top: 640 });
  });
});
