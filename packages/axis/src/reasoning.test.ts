import { describe, expect, it } from "vitest";
import { resolveReasoningOpen } from "./reasoning";

describe("resolveReasoningOpen", () => {
  it("auto-opens while streaming regardless of caller state", () => {
    expect(resolveReasoningOpen(false, "streaming")).toBe(true);
    expect(resolveReasoningOpen(undefined, "streaming")).toBe(true);
    expect(resolveReasoningOpen(true, "streaming")).toBe(true);
  });

  it("follows the caller once settled, defaulting closed", () => {
    expect(resolveReasoningOpen(true, "idle")).toBe(true);
    expect(resolveReasoningOpen(false, "idle")).toBe(false);
    expect(resolveReasoningOpen(undefined, "idle")).toBe(false);
    expect(resolveReasoningOpen(true, "error")).toBe(true);
    expect(resolveReasoningOpen(undefined, "submitted")).toBe(false);
  });
});
