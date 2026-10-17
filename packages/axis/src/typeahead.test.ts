import { describe, expect, it } from "vitest";
import {
  appendTypeaheadQuery,
  isTypeaheadExpired,
  matchTypeaheadKey,
} from "./typeahead";

const items = [
  { key: "apple", text: "Apple" },
  { key: "apricot", text: "Apricot" },
  { key: "banana", text: "Banana" },
];

describe("appendTypeaheadQuery", () => {
  it("starts the buffer on first key and appends within timeout", () => {
    expect(appendTypeaheadQuery(null, "a", 1000)).toEqual({
      text: "a",
      at: 1000,
    });
    expect(appendTypeaheadQuery({ text: "a", at: 1000 }, "p", 1200)).toEqual({
      text: "ap",
      at: 1200,
    });
  });

  it("restarts the buffer after the timeout", () => {
    expect(appendTypeaheadQuery({ text: "ap", at: 1000 }, "b", 1600)).toEqual({
      text: "b",
      at: 1600,
    });
    expect(
      appendTypeaheadQuery({ text: "ap", at: 1000 }, "b", 1500, 500),
    ).toEqual({ text: "apb", at: 1500 });
  });

  it("ignores non-single inputs", () => {
    expect(appendTypeaheadQuery({ text: "a", at: 1000 }, "pp", 1100)).toEqual({
      text: "a",
      at: 1000,
    });
  });
});

describe("isTypeaheadExpired", () => {
  it("expires empty, missing, and stale buffers only", () => {
    expect(isTypeaheadExpired(null, 2000)).toBe(true);
    expect(isTypeaheadExpired({ text: "", at: 1000 }, 1100)).toBe(true);
    expect(isTypeaheadExpired({ text: "a", at: 1000 }, 1600)).toBe(true);
    expect(isTypeaheadExpired({ text: "a", at: 1000 }, 1200)).toBe(false);
  });
});

describe("matchTypeaheadKey", () => {
  it("prefix-matches case-insensitively from the start", () => {
    expect(matchTypeaheadKey(items, "ap")).toBe("apple");
    expect(matchTypeaheadKey(items, "APR")).toBe("apricot");
    expect(matchTypeaheadKey(items, "ban")).toBe("banana");
  });

  it("reads undefined for empty queries, empty lists, and misses", () => {
    expect(matchTypeaheadKey(items, "")).toBeUndefined();
    expect(matchTypeaheadKey([], "a")).toBeUndefined();
    expect(matchTypeaheadKey(items, "zzz")).toBeUndefined();
  });

  it("cycles same-character buffers forward from the current key", () => {
    expect(matchTypeaheadKey(items, "aa", "apple")).toBe("apricot");
    expect(matchTypeaheadKey(items, "aa", "apricot")).toBe("apple");
    // Unknown current key searches from the start.
    expect(matchTypeaheadKey(items, "bb", "gone")).toBe("banana");
    expect(matchTypeaheadKey(items, "bb", null)).toBe("banana");
  });
});
