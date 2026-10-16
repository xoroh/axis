import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  defaultCollectionMatch,
  filterCollectionKeys,
  findCollectionText,
  useCollectionRegistry,
} from "./collection";

describe("defaultCollectionMatch", () => {
  it("matches trimmed case-insensitive substrings", () => {
    expect(defaultCollectionMatch("man", "Mango")).toBe(true);
    expect(defaultCollectionMatch("  MAN ", "mango")).toBe(true);
    expect(defaultCollectionMatch("berry", "Mango")).toBe(false);
  });

  it("matches everything on an empty query", () => {
    expect(defaultCollectionMatch("", "Mango")).toBe(true);
    expect(defaultCollectionMatch("   ", "Mango")).toBe(true);
  });
});

describe("filterCollectionKeys", () => {
  const items = [
    { key: "a", text: "Apple" },
    { key: "m", text: "Mango" },
    { key: "b", text: "Banana" },
  ];

  it("returns matching keys in registration order", () => {
    expect(filterCollectionKeys(items, "an")).toEqual(["m", "b"]);
    expect(filterCollectionKeys(items, "")).toEqual(["a", "m", "b"]);
    expect(filterCollectionKeys(items, "zzz")).toEqual([]);
  });

  it("accepts a custom match", () => {
    expect(
      filterCollectionKeys(items, "Apple", (query, text) => query === text),
    ).toEqual(["a"]);
  });
});

describe("findCollectionText", () => {
  it("reads text by key, undefined when absent", () => {
    const items = [{ key: "a", text: "Apple" }];
    expect(findCollectionText(items, "a")).toBe("Apple");
    expect(findCollectionText(items, "missing")).toBeUndefined();
  });
});

describe("useCollectionRegistry", () => {
  it("registers in order, replaces text in place, unregisters by key", () => {
    const { result } = renderHook(() => useCollectionRegistry());
    act(() => {
      result.current.register({ key: "a", text: "Apple" });
      result.current.register({ key: "m", text: "Mango" });
    });
    expect(result.current.items).toEqual([
      { key: "a", text: "Apple" },
      { key: "m", text: "Mango" },
    ]);
    act(() => {
      result.current.register({ key: "a", text: "Apricot" });
    });
    expect(result.current.items).toEqual([
      { key: "a", text: "Apricot" },
      { key: "m", text: "Mango" },
    ]);
    act(() => {
      result.current.unregister("unknown");
    });
    expect(result.current.items).toHaveLength(2);
    act(() => {
      result.current.unregister("a");
    });
    expect(result.current.items).toEqual([{ key: "m", text: "Mango" }]);
  });
});
