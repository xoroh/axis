import { describe, expect, it } from "vitest";
import { createDismissPolicy, dismissTriggersFor } from "./dismissPolicy";

describe("createDismissPolicy", () => {
  it("infers dismissible from the presence of a handler", () => {
    const p = createDismissPolicy({ hasDismissHandler: true });
    expect(p.canDismiss).toBe(true);
    expect(p.showClose).toBe(true);
  });

  it("a surface with no handler cannot be dismissed", () => {
    const p = createDismissPolicy({ hasDismissHandler: false });
    expect(p.canDismiss).toBe(false);
    expect(p.showClose).toBe(false);
  });

  // The scrim-only shell defect: it could declare a dismissal path and render
  // no control for it, so the declared path was unreachable.
  it("derives showClose from the same value the triggers read", () => {
    for (const hasDismissHandler of [true, false]) {
      const p = createDismissPolicy({ hasDismissHandler });
      expect(p.showClose).toBe(p.canDismiss);
    }
  });

  // `false` is a real answer and must beat an absent-or-present handler, or a
  // mandatory surface would show a close button because it was handed one.
  it("honours an explicit dismissible:false over the handler", () => {
    const p = createDismissPolicy({
      dismissible: false,
      hasDismissHandler: true,
    });
    expect(p.canDismiss).toBe(false);
    expect(p.showClose).toBe(false);
  });

  it("honours an explicit dismissible:true with no handler present", () => {
    const p = createDismissPolicy({
      dismissible: true,
      hasDismissHandler: false,
    });
    expect(p.canDismiss).toBe(true);
    expect(p.showClose).toBe(true);
  });

  describe("shouldDismiss", () => {
    it("dismisses on every trigger while open", () => {
      const p = createDismissPolicy({ hasDismissHandler: true });
      const all = { scrim: true, escape: true, closeButton: true };
      expect(p.shouldDismiss("scrim", true, all)).toBe(true);
      expect(p.shouldDismiss("escape", true, all)).toBe(true);
      expect(p.shouldDismiss("closeButton", true, all)).toBe(true);
    });

    // This is what the lint rule was pointing at. `dismissTriggersFor` used to
    // be decorative: a renderer could declare a docked surface to have no scrim
    // and the policy never consulted the declaration, so a live scrim would
    // still dismiss it. Now the declaration is what the decision reads.
    it("refuses a trigger the renderer did not declare", () => {
      const p = createDismissPolicy({ hasDismissHandler: true });
      const docked = dismissTriggersFor({
        modal: false,
        hasVisibleClose: true,
      });
      expect(p.shouldDismiss("scrim", true, docked)).toBe(false);
      expect(p.shouldDismiss("escape", true, docked)).toBe(false);
      expect(p.shouldDismiss("closeButton", true, docked)).toBe(true);
    });

    // A trigger on a closed surface must do nothing whatever the policy says.
    it("does nothing while closed, even for a dismissible surface", () => {
      const p = createDismissPolicy({ hasDismissHandler: true });
      const all = { scrim: true, escape: true, closeButton: true };
      expect(p.shouldDismiss("escape", false, all)).toBe(false);
      expect(p.shouldDismiss("scrim", false, all)).toBe(false);
    });

    it("does nothing for a mandatory surface", () => {
      const p = createDismissPolicy({
        dismissible: false,
        hasDismissHandler: true,
      });
      const all = { scrim: true, escape: true, closeButton: true };
      expect(p.shouldDismiss("escape", true, all)).toBe(false);
    });
  });
});

describe("dismissTriggersFor", () => {
  // A docked surface is persistent, not modal: no scrim, no Escape — and
  // binding handlers that can never fire is how a surface ends up looking
  // dismissible without being so.
  it("a modal surface offers scrim and escape", () => {
    expect(dismissTriggersFor({ modal: true, hasVisibleClose: true })).toEqual({
      scrim: true,
      escape: true,
      closeButton: true,
    });
  });

  it("a non-modal surface offers neither scrim nor escape", () => {
    expect(dismissTriggersFor({ modal: false, hasVisibleClose: true })).toEqual(
      {
        scrim: false,
        escape: false,
        closeButton: true,
      },
    );
  });

  it("a surface with no visible close binds no closeButton trigger", () => {
    expect(
      dismissTriggersFor({ modal: true, hasVisibleClose: false }).closeButton,
    ).toBe(false);
  });
});
