import { describe, expect, it } from "vitest";
import { isChatBusy, isChatError, isChatStreaming } from "./chatStatus";

describe("chatStatus", () => {
  it("is busy while submitted or streaming only", () => {
    expect(isChatBusy("submitted")).toBe(true);
    expect(isChatBusy("streaming")).toBe(true);
    expect(isChatBusy("idle")).toBe(false);
    expect(isChatBusy("error")).toBe(false);
  });

  it("streams only while streaming", () => {
    expect(isChatStreaming("streaming")).toBe(true);
    expect(isChatStreaming("submitted")).toBe(false);
    expect(isChatStreaming("idle")).toBe(false);
    expect(isChatStreaming("error")).toBe(false);
  });

  it("errors only on error", () => {
    expect(isChatError("error")).toBe(true);
    expect(isChatError("idle")).toBe(false);
    expect(isChatError("streaming")).toBe(false);
    expect(isChatError("submitted")).toBe(false);
  });
});
