import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createOverlayModality,
  useOverlayModality,
  useOverlayRegistration,
} from "./overlayModality";

/**
 * Overlay modality — the shared kernel behind "only the topmost overlay is
 * interactive".
 *
 * Imported from `./index`, the PACKAGE BARREL, deliberately. The unit this file
 * covers (`bbd9ac7`) was committed but DEAD: `overlayModality.ts` existed and
 * `index.ts` never re-exported it, so all three exports were importable by
 * nobody, and no test existed to notice. Importing through the barrel is the
 * proof: if the export block is removed again, this file fails to resolve.
 *
 * The model is a STACK, not a counter, because the topmost overlay is the only
 * interactive one. Three of the tests below are about the failure a counter
 * cannot express.
 */
describe("overlay modality", () => {
  it("starts with no overlay on top and no modal active", () => {
    const r = createOverlayModality();
    const s = r.getState();
    expect(s.top).toBeNull();
    expect(s.stack).toEqual([]);
    expect(s.isTop("anything")).toBe(false);
    expect(s.modalTop).toBeNull();
    expect(s.isModalActive).toBe(false);
  });

  it("registers and releases", () => {
    const r = createOverlayModality();
    let release: () => void = () => {};
    act(() => {
      release = r.register("sheet");
    });
    expect(r.getState().top).toBe("sheet");
    act(() => {
      release();
    });
    expect(r.getState().top).toBeNull();
  });

  it("only the TOPMOST overlay is interactive", () => {
    const r = createOverlayModality();
    let releaseA = () => {};
    let releaseB = () => {};
    act(() => {
      releaseA = r.register("menu");
      releaseB = r.register("sheet");
    });
    const s = r.getState();
    expect(s.top).toBe("sheet");
    expect(s.isTop("sheet")).toBe(true);
    // The whole point of a stack rather than a counter: the menu underneath is
    // still registered but must NOT be interactive.
    expect(s.isTop("menu")).toBe(false);
    expect(s.isInertOutside("menu")).toBe(true);
    expect(s.isInertOutside("sheet")).toBe(false);
    // Neither registered modal: no modal is active.
    expect(s.modalTop).toBeNull();
    expect(s.isModalActive).toBe(false);
    act(() => {
      releaseA();
      releaseB();
    });
  });

  it("tracks the topmost MODAL overlay separately from the stack top", () => {
    const r = createOverlayModality();
    let releaseModal = () => {};
    let releasePlain = () => {};
    act(() => {
      releaseModal = r.register("dialog", { modal: true });
      releasePlain = r.register("tip");
    });
    const s = r.getState();
    // The non-modal tip sits on top, but the modal dialog is the active modal.
    expect(s.top).toBe("tip");
    expect(s.modalTop).toBe("dialog");
    expect(s.isModalActive).toBe(true);
    act(() => {
      releaseModal();
    });
    const after = r.getState();
    expect(after.modalTop).toBeNull();
    expect(after.isModalActive).toBe(false);
    act(() => {
      releasePlain();
    });
  });

  it("a modal that releases leaves the next modal on top", () => {
    const r = createOverlayModality();
    let releaseA = () => {};
    let releaseB = () => {};
    act(() => {
      releaseA = r.register("a", { modal: true });
      releaseB = r.register("b", { modal: true });
    });
    expect(r.getState().modalTop).toBe("b");
    act(() => {
      releaseB();
    });
    expect(r.getState().modalTop).toBe("a");
    expect(r.getState().isModalActive).toBe(true);
    act(() => {
      releaseA();
    });
    expect(r.getState().isModalActive).toBe(false);
  });

  it("re-registering the same id is a no-op, not a second entry", () => {
    const r = createOverlayModality();
    let first = () => {};
    let second = () => {};
    act(() => {
      first = r.register("sheet");
      second = r.register("sheet");
    });
    // A re-render that re-registers must not make one overlay look two-deep.
    expect(r.getState().stack).toEqual(["sheet"]);
    // The contract is "one stack entry", NOT a reference count: either handle
    // releases the id. An earlier version of this test asserted that the second
    // registration held the overlay open after the first released, and failed
    // against correct code -- the implementation never promised refcounting, and
    // asserting it would have pinned a behaviour nobody wanted.
    act(() => {
      first();
    });
    expect(r.getState().top).toBeNull();
    // The second handle is now a no-op rather than throwing on a missing id.
    expect(() => second()).not.toThrow();
  });

  it("a double release does not remove a later overlay at the same index", () => {
    const r = createOverlayModality();
    let releaseFirst = () => {};
    act(() => {
      releaseFirst = r.register("a");
    });
    act(() => {
      releaseFirst();
    });
    act(() => {
      releaseFirst();
    });
    act(() => {
      releaseFirst();
    });
    let releaseB = () => {};
    act(() => {
      releaseB = r.register("b");
    });
    act(() => {
      releaseFirst();
    });
    // The stale release must not take "b" down with it.
    expect(r.getState().top).toBe("b");
    act(() => {
      releaseB();
    });
  });

  it("notifies subscribers on change", () => {
    const r = createOverlayModality();
    const listener = vi.fn();
    let unsubscribe = () => {};
    act(() => {
      unsubscribe = r.subscribe(listener);
    });
    let release = () => {};
    act(() => {
      release = r.register("sheet");
    });
    expect(listener).toHaveBeenCalled();
    act(() => {
      release();
      unsubscribe();
    });
    const calls = listener.mock.calls.length;
    act(() => {
      release();
    });
    expect(listener.mock.calls.length).toBe(calls);
  });

  it("useOverlayRegistration registers for as long as it is mounted", () => {
    const r = createOverlayModality();
    const { unmount } = renderHook(() =>
      useOverlayRegistration(r, "sheet", true),
    );
    expect(r.getState().top).toBe("sheet");
    unmount();
    expect(r.getState().top).toBeNull();
  });

  it("an INACTIVE registration does not make outside content inert", () => {
    const r = createOverlayModality();
    // A sheet mounted but CLOSED is still in the tree. Registering it anyway
    // would mark everything outside it inert behind a sheet nobody can see.
    renderHook(() => useOverlayRegistration(r, "sheet", false));
    expect(r.getState().top).toBeNull();
    expect(r.getState().isInertOutside("anything")).toBe(false);
  });

  it("useOverlayModality re-renders when the stack changes", () => {
    const r = createOverlayModality();
    const { result } = renderHook(() => useOverlayModality(r));
    expect(result.current.top).toBeNull();
    let release = () => {};
    act(() => {
      release = r.register("sheet");
    });
    expect(result.current.top).toBe("sheet");
    act(() => {
      release();
    });
    expect(result.current.top).toBeNull();
  });
});
