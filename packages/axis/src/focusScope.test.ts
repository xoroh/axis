/// <reference lib="dom" />
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  AccessibilityInfo: {
    setAccessibilityFocus: vi.fn(),
    isReduceMotionEnabled: () => Promise.resolve(false),
  },
  findNodeHandle: () => null,
  Text: "Text",
  View: "View",
}));

import {
  closestFocusableAncestor,
  createFocusScope,
  focusDomNode,
  getFocusableElements,
  isConnectedNode,
  resolveFocusNode,
  trapTabKey,
} from "./components/useAccessibilityFocus";

/**
 * Focus scope registry, focus-target resolution, and the web DOM
 * helpers — pure logic over duck-typed nodes, so plain jsdom elements
 * stand in for host nodes (no native runtime, no RNW).
 */

function button(id: string, parent: HTMLElement = document.body): HTMLButtonElement {
  const el = document.createElement("button");
  el.id = id;
  parent.appendChild(el);
  return el;
}

describe("createFocusScope", () => {
  it("starts empty", () => {
    const scope = createFocusScope();
    expect(scope.resolveDefault(true)).toBeNull();
    expect(scope.resolveDefault(false)).toBeNull();
  });

  it("prefers the marked initial target over stops and titles", () => {
    const scope = createFocusScope();
    const stop = { node: "stop" } as never;
    const title = { node: "title" } as never;
    const marked = { node: "marked" } as never;
    scope.register(stop, "stop");
    scope.register(title, "title");
    scope.register(marked, "initial");
    expect(scope.resolveDefault(true)).toBe(marked);
  });

  it("prefers the first stop over the title", () => {
    const scope = createFocusScope();
    const first = { node: "first" } as never;
    const second = { node: "second" } as never;
    const title = { node: "title" } as never;
    scope.register(first, "stop");
    scope.register(second, "stop");
    scope.register(title, "title");
    expect(scope.resolveDefault(true)).toBe(first);
  });

  it("falls back to the title when stops are skipped (drawer rule)", () => {
    const scope = createFocusScope();
    scope.register({ node: "stop" }, "stop");
    const title = { node: "title" };
    scope.register(title, "title");
    expect(scope.resolveDefault(false)).toBe(title);
  });

  it("unregister removes exactly that entry", () => {
    const scope = createFocusScope();
    const first = { node: "first" } as never;
    const second = { node: "second" } as never;
    const releaseFirst = scope.register(first, "stop");
    scope.register(second, "stop");
    releaseFirst();
    expect(scope.resolveDefault(true)).toBe(second);
  });

  it("a released initial mark falls back to stops", () => {
    const scope = createFocusScope();
    const stop = { node: "stop" } as never;
    scope.register(stop, "stop");
    const releaseMarked = scope.register({ node: "marked" }, "initial");
    expect(scope.resolveDefault(true)).toEqual({ node: "marked" });
    releaseMarked();
    expect(scope.resolveDefault(true)).toBe(stop);
  });
});

describe("resolveFocusNode", () => {
  it("resolves refs and bare elements, null for false and missing", () => {
    const node = { node: "popup" } as never;
    expect(resolveFocusNode({ current: node }, "programmatic")).toBe(node);
    expect(resolveFocusNode(node, "programmatic")).toBe(node);
    expect(resolveFocusNode(false, "programmatic")).toBeNull();
    expect(resolveFocusNode(null, "programmatic")).toBeNull();
    expect(resolveFocusNode(undefined, "programmatic")).toBeNull();
    expect(resolveFocusNode({ current: null }, "programmatic")).toBeNull();
  });

  it("calls function targets with the open interaction", () => {
    const seen: string[] = [];
    const node = { node: "target" } as never;
    const out = resolveFocusNode((interaction) => {
      seen.push(interaction);
      return { current: node };
    }, "trigger-press");
    expect(out).toBe(node);
    expect(seen).toEqual(["trigger-press"]);
  });

  it("treats function false/null as no opinion", () => {
    expect(resolveFocusNode(() => false, "programmatic")).toBeNull();
    expect(resolveFocusNode(() => null, "programmatic")).toBeNull();
    expect(
      resolveFocusNode(() => ({ current: null }), "programmatic"),
    ).toBeNull();
  });
});

describe("web DOM helpers", () => {
  it("finds tabbable descendants in DOM order", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    button("one", root);
    const input = document.createElement("input");
    root.appendChild(input);
    button("two", root);
    const skip = button("skip", root);
    skip.tabIndex = -1;
    const disabled = button("gone", root);
    disabled.disabled = true;
    const found = getFocusableElements(root);
    expect(found.map((el) => (el as HTMLElement).tagName)).toEqual([
      "BUTTON",
      "INPUT",
      "BUTTON",
    ]);
    root.remove();
  });

  it("returns no tabbables for non-DOM containers", () => {
    expect(getFocusableElements(null)).toEqual([]);
    expect(getFocusableElements({})).toEqual([]);
    expect(
      getFocusableElements({
        querySelectorAll: () => {
          throw new Error("boom");
        },
      }),
    ).toEqual([]);
  });

  it("focusDomNode focuses and reports, false without a focus function", () => {
    const el = button("focus-me");
    expect(focusDomNode(el)).toBe(true);
    expect(document.activeElement).toBe(el);
    expect(focusDomNode(null)).toBe(false);
    expect(focusDomNode({})).toBe(false);
    el.remove();
  });

  it("trapTabKey wraps from last to first on Tab", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const first = button("trap-first", root);
    button("trap-mid", root);
    const last = button("trap-last", root);
    last.focus();
    let prevented = false;
    trapTabKey(root, {
      key: "Tab",
      shiftKey: false,
      preventDefault: () => {
        prevented = true;
      },
    });
    expect(prevented).toBe(true);
    expect(document.activeElement).toBe(first);
    root.remove();
  });

  it("trapTabKey wraps from first to last on Shift+Tab", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const first = button("shift-first", root);
    const last = button("shift-last", root);
    first.focus();
    trapTabKey(root, { key: "Shift", shiftKey: true, preventDefault: () => {} } as never);
    // Non-Tab keys pass through: focus stays put.
    expect(document.activeElement).toBe(first);
    trapTabKey(root, { key: "Tab", shiftKey: true, preventDefault: () => {} });
    expect(document.activeElement).toBe(last);
    root.remove();
  });

  it("trapTabKey prevents default with no tabbables", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    let prevented = false;
    trapTabKey(root, {
      key: "Tab",
      preventDefault: () => {
        prevented = true;
      },
    });
    expect(prevented).toBe(true);
    root.remove();
  });

  it("closestFocusableAncestor skips the node itself", () => {
    const container = document.createElement("div");
    container.tabIndex = 0;
    const trigger = button("d11-trigger", container);
    document.body.appendChild(container);
    expect(closestFocusableAncestor(trigger)).toBe(container);
    container.remove();
  });

  it("stashed ancestors focus only while connected (D11)", () => {
    const container = document.createElement("div");
    container.tabIndex = 0;
    const trigger = button("d11-gone", container);
    document.body.appendChild(container);
    // Stashed while mounted: the live chain resolves.
    const stashed = closestFocusableAncestor(trigger);
    expect(isConnectedNode(stashed)).toBe(true);
    // Whole subtree unmounts: the stash is stale — never focus it.
    container.remove();
    expect(isConnectedNode(stashed)).toBe(false);
    expect(isConnectedNode(null)).toBe(false);
  });
});
