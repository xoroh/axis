import { act } from "react";
import { create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  type MeasurableRef,
  useFloatingPlacement,
} from "./components/useFloatingPlacement";

/**
 * Placement resolving through the hook with an injectable anchor node.
 *
 * The hook reads its anchor through a host ref, so the test supplies
 * the node directly: a web element shape (a rect with no `measure`,
 * the way React Native Web host refs behave where `measure` never
 * delivers) and the native shape (a synchronous `measure` callback).
 * `react-native` is mocked to just the viewport hook because the
 * module under test must never load the real native runtime here —
 * and because native proof files (`*.rntest.tsx`) may only import
 * the public entry, this unit lives in vitest instead.
 */

vi.mock("react-native", () => ({
  useWindowDimensions: () => ({
    width: 750,
    height: 1334,
    scale: 2,
    fontScale: 1,
  }),
}));

const CONTENT_SIZE = { width: 100, height: 40 };

type Resolved = ReturnType<typeof useFloatingPlacement>;

function resolve(options: {
  node: MeasurableRef["current"];
  active?: boolean;
  target?: unknown;
  reportSize?: boolean;
}): Resolved {
  const { node, active = true, target, reportSize = true } = options;
  const anchorRef: MeasurableRef = { current: node };
  let latest: Resolved | undefined;
  function Probe(): null {
    latest = useFloatingPlacement({ anchorRef, active });
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
});
