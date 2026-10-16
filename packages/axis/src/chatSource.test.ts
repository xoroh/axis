import { describe, expect, it } from "vitest";
import { normalizeChatSources, resolveChatSourceLabel } from "./chatSource";

describe("normalizeChatSources", () => {
  it("trims, drops empties, and dedupes first-wins", () => {
    expect(
      normalizeChatSources([
        { href: " https://a.dev ", title: "A" },
        { href: "https://a.dev", title: "A duplicate" },
        { href: "   " },
        { href: "https://b.dev" },
      ]),
    ).toEqual([
      { href: "https://a.dev", title: "A" },
      { href: "https://b.dev" },
    ]);
  });

  it("reads [] for missing sources", () => {
    expect(normalizeChatSources(undefined)).toEqual([]);
  });
});

describe("resolveChatSourceLabel", () => {
  it("prefers the title, else the trimmed href", () => {
    expect(
      resolveChatSourceLabel({ href: "https://a.dev", title: "  Docs  " }),
    ).toBe("Docs");
    expect(resolveChatSourceLabel({ href: "  https://a.dev  " })).toBe(
      "https://a.dev",
    );
    expect(resolveChatSourceLabel({ href: "https://a.dev", title: "" })).toBe(
      "https://a.dev",
    );
  });
});
