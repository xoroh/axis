import { describe, expect, it } from "vitest";
import { composeEventHandlers, mergeSlotProps } from "./slot";

describe("composeEventHandlers", () => {
  it("runs the part handler first, then the consumer's", () => {
    const order: string[] = [];
    const merged = composeEventHandlers(
      () => order.push("part"),
      () => order.push("consumer"),
    );
    merged?.("event");
    expect(order).toEqual(["part", "consumer"]);
  });

  it("tolerates either side being absent", () => {
    const consumer = () => {};
    expect(composeEventHandlers(undefined, consumer)).toBe(consumer);
    const part = () => {};
    expect(composeEventHandlers(part, undefined)).toBe(part);
    expect(composeEventHandlers(undefined, undefined)).toBeUndefined();
  });
});

describe("mergeSlotProps", () => {
  it("chains on* handlers so neither side swallows the other", () => {
    const seen: string[] = [];
    const merged = mergeSlotProps(
      { onSelect: () => seen.push("part") },
      { onSelect: () => seen.push("consumer") },
    );
    (merged.onSelect as () => void)();
    expect(seen).toEqual(["part", "consumer"]);
  });

  it("concatenates className with the consumer last", () => {
    expect(
      mergeSlotProps({ className: "part" }, { className: "consumer" }),
    ).toEqual({ className: "part consumer" });
  });

  it("merges style shallow with the consumer winning per key", () => {
    expect(
      mergeSlotProps<{ style: { color: string; padding?: number } }>(
        { style: { color: "red", padding: 0 } },
        { style: { color: "blue" } },
      ),
    ).toEqual({ style: { color: "blue", padding: 0 } });
  });

  it("flattens style arrays RN-order with the consumer winning per key", () => {
    // Part arrays apply left to right (later wins); a consumer object
    // then wins per key without resurrecting overridden part keys.
    expect(
      mergeSlotProps<{ style: unknown }>(
        { style: [{ color: "red" }, { color: "green", display: "none" }] },
        { style: { color: "blue" } },
      ),
    ).toEqual({ style: { color: "blue", display: "none" } });
    // Nullish and nested entries contribute nothing.
    expect(
      mergeSlotProps<{ style: unknown }>(
        { style: [{ padding: 4 }, null, [{ margin: 2 }, false]] },
        { style: {} },
      ),
    ).toEqual({ style: { padding: 4, margin: 2 } });
    // A consumer set without style leaves the part array untouched
    // for the host to resolve natively.
    expect(
      mergeSlotProps<{ style: unknown }>({ style: [{ padding: 4 }, null] }, {}),
    ).toEqual({ style: [{ padding: 4 }, null] });
  });

  it("takes the consumer value unless it is undefined", () => {
    expect(
      mergeSlotProps({ label: "part", count: 1 }, { label: undefined }),
    ).toEqual({ label: "part", count: 1 });
    expect(mergeSlotProps({ label: "part" }, { label: "consumer" })).toEqual({
      label: "consumer",
    });
  });

  it("skips null and undefined consumer sets", () => {
    expect(
      mergeSlotProps<{ a?: number; b?: number }>({ a: 1 }, null, undefined, {
        b: 2,
      }),
    ).toEqual({
      a: 1,
      b: 2,
    });
  });
});
