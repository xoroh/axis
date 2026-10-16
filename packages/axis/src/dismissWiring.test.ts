import { describe, expect, it } from "vitest";
import {
  type DismissBranches,
  dismissBranchesFor,
  shouldDismissOn,
} from "./dismissWiring";

const ALL_ON: DismissBranches = {
  "outside-pointer": true,
  "focus-out": true,
  escape: true,
  "system-back": true,
  close: true,
};

describe("dismissBranchesFor", () => {
  it("wires every branch on a modal dismissible surface", () => {
    expect(
      dismissBranchesFor({
        modal: true,
        dismissible: true,
        hasVisibleClose: true,
      }),
    ).toEqual(ALL_ON);
  });

  // A non-modal surface keeps outside content interactive by definition, so
  // outside contact must never read as dismissal — only its close control.
  it("wires only the close branch on a non-modal surface", () => {
    expect(
      dismissBranchesFor({
        modal: false,
        dismissible: true,
        hasVisibleClose: true,
      }),
    ).toEqual({
      "outside-pointer": false,
      "focus-out": false,
      escape: false,
      "system-back": false,
      close: true,
    });
  });

  it("wires nothing dismissible-off, even when modal", () => {
    expect(
      dismissBranchesFor({
        modal: true,
        dismissible: false,
        hasVisibleClose: true,
      }),
    ).toEqual({
      "outside-pointer": false,
      "focus-out": false,
      escape: false,
      "system-back": false,
      // `dismissible: false` beats the visible control: a mandatory surface
      // must not declare a close branch for a control it must not honour.
      close: false,
    });
  });

  it("never declares a close branch without a visible control", () => {
    const branches = dismissBranchesFor({
      modal: true,
      dismissible: true,
      hasVisibleClose: false,
    });
    expect(branches.close).toBe(false);
    expect(branches.escape).toBe(true);
  });
});

describe("shouldDismissOn", () => {
  it("fires a declared branch while open", () => {
    expect(shouldDismissOn("escape", true, ALL_ON)).toBe(true);
    expect(shouldDismissOn("system-back", true, ALL_ON)).toBe(true);
  });

  // The declaration is consulted, never decorative: a docked surface declares
  // no scrim, so a live outside pointer must not dismiss it.
  it("refuses an undeclared branch whatever the open state", () => {
    const docked: DismissBranches = { ...ALL_ON, "outside-pointer": false };
    expect(shouldDismissOn("outside-pointer", true, docked)).toBe(false);
  });

  it("fires nothing while closed", () => {
    expect(shouldDismissOn("escape", false, ALL_ON)).toBe(false);
    expect(shouldDismissOn("close", false, ALL_ON)).toBe(false);
  });
});
