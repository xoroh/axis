import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  isSelected,
  normalizeSelection,
  toggleSelection,
  useSelection,
} from "./selection";

/**
 * Behaviour only. Nothing here names a platform, a token, or a component, so
 * these assertions survive any primitive ruling — the same discipline the parity
 * contract follows, and the reason this can live in the primitives layer at all.
 */
describe("normalizeSelection", () => {
  it("wraps a single string into an array in single mode", () => {
    expect(normalizeSelection("a", "single")).toEqual(["a"]);
  });

  it("keeps an array as an array in multiple mode", () => {
    expect(normalizeSelection(["a", "b"], "multiple")).toEqual(["a", "b"]);
  });

  it("returns empty for undefined", () => {
    expect(normalizeSelection(undefined, "multiple")).toEqual([]);
    expect(normalizeSelection(undefined, "single")).toEqual([]);
  });

  it("truncates to one entry in single mode", () => {
    expect(normalizeSelection(["a", "b", "c"], "single")).toEqual(["a"]);
  });

  it("deduplicates in multiple mode so length never lies", () => {
    expect(normalizeSelection(["a", "a", "b"], "multiple")).toEqual(["a", "b"]);
  });

  it("returns a fresh array, never the caller's reference", () => {
    // Mutating the returned array must not reach back into the caller's props —
    // the input often comes straight from component state.
    const input = ["a", "b"];
    const out = normalizeSelection(input, "multiple");
    expect(out).not.toBe(input);
    expect([...out]).toEqual(["a", "b"]);
  });
});

describe("toggleSelection", () => {
  it("replaces in single mode", () => {
    expect(toggleSelection(["a"], "b", "single")).toEqual(["b"]);
  });

  it("replaces even when re-activating the current value in single mode", () => {
    // A radio group does not deselect on re-activation; doing so would leave the
    // group with nothing selected, which M3 does not describe.
    expect(toggleSelection(["a"], "a", "single")).toEqual(["a"]);
  });

  it("adds in multiple mode", () => {
    expect(toggleSelection(["a"], "b", "multiple")).toEqual(["a", "b"]);
  });

  it("removes in multiple mode when already selected", () => {
    expect(toggleSelection(["a", "b"], "a", "multiple")).toEqual(["b"]);
  });

  it("does not mutate its input", () => {
    const input = ["a"];
    toggleSelection(input, "b", "multiple");
    expect(input).toEqual(["a"]);
  });
});

describe("isSelected", () => {
  it("reports membership", () => {
    expect(isSelected(["a", "b"], "a")).toBe(true);
    expect(isSelected(["a", "b"], "c")).toBe(false);
  });
});

/**
 * Accordion selects by INDEX and `expanded: number[]` is public API, so the key
 * type is generic rather than `string`. These pin that the selection rules never
 * inspect the key — otherwise the generic would be a silent lie.
 */
describe("numeric keys (Accordion)", () => {
  it("normalises a number to a single-entry array", () => {
    expect(normalizeSelection(2, "single")).toEqual([2]);
  });

  it("toggles numeric keys in multiple mode", () => {
    expect(toggleSelection([0, 2], 1, "multiple")).toEqual([0, 2, 1]);
    expect(toggleSelection([0, 2], 0, "multiple")).toEqual([2]);
  });

  it("replaces on re-activation in single mode", () => {
    expect(toggleSelection([1], 1, "single")).toEqual([1]);
    expect(toggleSelection([1], 3, "single")).toEqual([3]);
  });

  it("does not confuse the number 1 with the string '1'", () => {
    // A Set-based dedupe that stringified keys would merge them and report one
    // selected item where there are two.
    const mixed = normalizeSelection([1, "1"], "multiple");
    expect(mixed).toEqual([1, "1"]);
    expect(isSelected(mixed, 1 as never)).toBe(true);
    expect(isSelected(mixed, "1")).toBe(true);
  });
});

/**
 * Accordion / disclosure: the ONE open item collapses when activated again.
 *
 * Distinct from radio semantics, and the distinction was found by a failing test
 * rather than by reading the spec — applying radio rules to Accordion removed the
 * collapse that component exists to provide.
 */
describe("single-toggle mode (Accordion / disclosure)", () => {
  it("collapses when the open item is activated again", () => {
    expect(toggleSelection([1], 1, "single-toggle")).toEqual([]);
  });

  it("moves the selection when a different item is activated", () => {
    expect(toggleSelection([1], 2, "single-toggle")).toEqual([2]);
  });

  it("opens from empty", () => {
    expect(toggleSelection([], 3, "single-toggle")).toEqual([3]);
  });

  it("never holds more than one entry", () => {
    const out = toggleSelection([1, 2], 3, "single-toggle");
    expect(out).toHaveLength(1);
  });

  it("normalises an over-long list to one entry, like single mode", () => {
    expect(normalizeSelection([1, 2, 3], "single-toggle")).toEqual([1]);
  });
});

describe("useSelection", () => {
  it("starts uncontrolled at defaultValue", () => {
    const { result } = renderHook(() =>
      useSelection({ defaultValue: "a", mode: "single" }),
    );
    expect(result.current[0]).toEqual(["a"]);
  });

  it("follows the controlled value", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useSelection({ value, mode: "single" }),
      { initialProps: { value: "a" } },
    );
    expect(result.current[0]).toEqual(["a"]);
    rerender({ value: "b" });
    expect(result.current[0]).toEqual(["b"]);
  });

  it("reports the normalised array to onChange, not the raw value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      // Explicit `<string>`: without it the key type infers as the literal "a"
      // from `defaultValue`, and selecting "b" is a type error — which it was,
      // in this file, until now.
      useSelection<string>({
        defaultValue: "a",
        mode: "single",
        onChange,
      }),
    );
    act(() => result.current[1]("b"));
    expect(onChange).toHaveBeenCalledWith(["b"]);
  });

  it("narrows immediately when the mode tightens to single", () => {
    // Widening single -> multiple keeps the selection; narrowing must keep only
    // the first entry, so a control never reports more selected items than its
    // mode permits.
    const { result, rerender } = renderHook(
      ({ mode }: { mode: "single" | "multiple" }) =>
        useSelection({ value: ["a", "b", "c"], mode }),
      { initialProps: { mode: "multiple" as "single" | "multiple" } },
    );
    expect(result.current[0]).toEqual(["a", "b", "c"]);
    rerender({ mode: "single" });
    expect(result.current[0]).toEqual(["a"]);
  });

  it("keeps a stable select identity across re-renders", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useSelection({ value, mode: "single" }),
      { initialProps: { value: "a" } },
    );
    const first = result.current[1];
    rerender({ value: "b" });
    expect(result.current[1]).toBe(first);
  });

  it("does not call onChange when a multiple-mode toggle returns to the same set", () => {
    // Activating the only selected item empties the set — a real change — but
    // activating it twice in single mode must not fire, because the selection is
    // unchanged. Pinned here because `useControllableState` skips equal values.
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useSelection({ defaultValue: "a", mode: "single", onChange }),
    );
    act(() => result.current[1]("a"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
