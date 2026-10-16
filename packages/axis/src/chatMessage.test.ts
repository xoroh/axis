import { describe, expect, it } from "vitest";
import {
  isUserMessage,
  resolveChatMessageLabel,
  resolveChatMessageSpeaker,
} from "./chatMessage";

describe("resolveChatMessageSpeaker", () => {
  it("prefers the explicit author name", () => {
    expect(
      resolveChatMessageSpeaker({ role: "assistant", authorName: "  M3  " }),
    ).toBe("M3");
    expect(resolveChatMessageSpeaker({ role: "user", authorName: "Ada" })).toBe(
      "Ada",
    );
  });

  it("falls back per role, never empty", () => {
    expect(resolveChatMessageSpeaker({ role: "user" })).toBe("You");
    expect(resolveChatMessageSpeaker({ role: "assistant" })).toBe("Assistant");
    expect(resolveChatMessageSpeaker({ role: "system" })).toBe("System");
    expect(resolveChatMessageSpeaker({ role: "tool" })).toBe("Tool");
    expect(
      resolveChatMessageSpeaker({ role: "assistant", authorName: "   " }),
    ).toBe("Assistant");
  });
});

describe("resolveChatMessageLabel", () => {
  it("prefixes the text preview with the speaker", () => {
    expect(resolveChatMessageLabel({ role: "user", text: "  hello  " })).toBe(
      "You: hello",
    );
    expect(
      resolveChatMessageLabel({
        role: "assistant",
        authorName: "M3",
        text: "hi",
      }),
    ).toBe("M3: hi");
  });

  it("labels content-free turns with the bare speaker", () => {
    expect(resolveChatMessageLabel({ role: "assistant" })).toBe("Assistant");
    expect(resolveChatMessageLabel({ role: "tool", text: "   " })).toBe("Tool");
  });
});

describe("isUserMessage", () => {
  it("is true only for user turns", () => {
    expect(isUserMessage({ role: "user" })).toBe(true);
    expect(isUserMessage({ role: "assistant" })).toBe(false);
    expect(isUserMessage({ role: "system" })).toBe(false);
    expect(isUserMessage({ role: "tool" })).toBe(false);
  });
});
