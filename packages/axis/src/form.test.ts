import { describe, expect, it } from "vitest";
import { isEmptyValue, mergeFormErrors, normalizeFieldErrors } from "./form";

/**
 * Form validation plumbing as pure logic: error normalization,
 * server-wins merging, and emptiness — observed here, not assumed.
 */

describe("normalizeFieldErrors", () => {
  it("passes lists through and wraps singles", async () => {
    expect(normalizeFieldErrors(["a", "b"])).toEqual(["a", "b"]);
    expect(normalizeFieldErrors("a")).toEqual(["a"]);
    expect(normalizeFieldErrors(undefined)).toEqual([]);
  });
});

describe("mergeFormErrors", () => {
  it("prefers server errors per field", async () => {
    expect(mergeFormErrors({ name: ["too short"] }, { name: "taken" })).toEqual(
      { name: "taken" },
    );
  });

  it("keeps internal errors where the server is silent", async () => {
    expect(mergeFormErrors({ name: ["too short"] }, {})).toEqual({
      name: ["too short"],
    });
  });

  it("unions disjoint field sets", async () => {
    expect(mergeFormErrors({ a: "x" }, { b: "y" })).toEqual({
      a: "x",
      b: "y",
    });
  });
});

describe("isEmptyValue", () => {
  it("treats undefined, null, and empty string as empty", async () => {
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue("")).toBe(true);
  });

  it("treats zero and content as values", async () => {
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue("Ada")).toBe(false);
  });
});
