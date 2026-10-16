import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createPresenceModel,
  nextPresenceState,
  usePresence,
} from "./presence";

describe("nextPresenceState", () => {
  it("mounts on open from any state", () => {
    expect(nextPresenceState("unmounted", true)).toBe("mounted");
    expect(nextPresenceState("exiting", true)).toBe("mounted");
    expect(nextPresenceState("mounted", true)).toBe("mounted");
  });

  // Exit-animation suspension: closing suspends in `exiting` rather than
  // unmounting, so the renderer keeps painting through the exit animation.
  it("suspends in exiting on close instead of unmounting", () => {
    expect(nextPresenceState("mounted", false)).toBe("exiting");
    expect(nextPresenceState("exiting", false)).toBe("exiting");
  });

  it("stays unmounted when already unmounted", () => {
    expect(nextPresenceState("unmounted", false)).toBe("unmounted");
  });
});

describe("createPresenceModel", () => {
  it("starts mounted or unmounted from the initial open value", () => {
    expect(createPresenceModel(true).getState()).toBe("mounted");
    expect(createPresenceModel(false).getState()).toBe("unmounted");
  });

  it("unmounts only via finishExit, never via setOpen(false) alone", () => {
    const model = createPresenceModel(true);
    model.setOpen(false);
    expect(model.getState()).toBe("exiting");
    expect(model.isPresent()).toBe(true);
    model.finishExit();
    expect(model.getState()).toBe("unmounted");
    expect(model.isPresent()).toBe(false);
  });

  it("reopening from exiting restores mounted without unmounting", () => {
    const model = createPresenceModel(true);
    model.setOpen(false);
    model.setOpen(true);
    expect(model.getState()).toBe("mounted");
    // A late finishExit for the cancelled exit must not unmount the surface.
    model.finishExit();
    expect(model.getState()).toBe("mounted");
  });

  it("finishExit is a no-op unless exiting", () => {
    const model = createPresenceModel(true);
    model.finishExit();
    expect(model.getState()).toBe("mounted");
  });

  it("notifies subscribers on change only", () => {
    const model = createPresenceModel(true);
    const listener = vi.fn();
    model.subscribe(listener);
    model.setOpen(true);
    expect(listener).not.toHaveBeenCalled();
    model.setOpen(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("usePresence", () => {
  it("tracks open and reports presence through the exit", () => {
    const { result, rerender } = renderHook(({ open }) => usePresence(open), {
      initialProps: { open: true },
    });
    expect(result.current.present).toBe(true);
    rerender({ open: false });
    expect(result.current.state).toBe("exiting");
    expect(result.current.present).toBe(true);
    act(() => result.current.finishExit());
    expect(result.current.present).toBe(false);
  });
});
