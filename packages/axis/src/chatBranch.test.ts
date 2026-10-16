import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  nextBranchIndex,
  normalizeBranchIndex,
  previousBranchIndex,
  shouldHideBranchPicker,
  useBranch,
} from "./chatBranch";

describe("normalizeBranchIndex", () => {
  it("clamps into range and floors", () => {
    expect(normalizeBranchIndex(1, 3)).toBe(1);
    expect(normalizeBranchIndex(9, 3)).toBe(2);
    expect(normalizeBranchIndex(-2, 3)).toBe(0);
    expect(normalizeBranchIndex(1.7, 3)).toBe(1);
  });

  it("reads 0 for empty or non-finite input", () => {
    expect(normalizeBranchIndex(0, 0)).toBe(0);
    expect(normalizeBranchIndex(2, -1)).toBe(0);
    expect(normalizeBranchIndex(Number.NaN, 3)).toBe(0);
    expect(normalizeBranchIndex(Number.POSITIVE_INFINITY, 3)).toBe(0);
  });
});

describe("nextBranchIndex / previousBranchIndex", () => {
  it("steps within the list", () => {
    expect(nextBranchIndex(0, 3)).toBe(1);
    expect(nextBranchIndex(1, 3)).toBe(2);
    expect(previousBranchIndex(2, 3)).toBe(1);
    expect(previousBranchIndex(1, 3)).toBe(0);
  });

  it("stops at the last variant: Next there is a no-op", () => {
    expect(nextBranchIndex(2, 3)).toBe(2);
    expect(nextBranchIndex(9, 3)).toBe(2);
    expect(nextBranchIndex(0, 1)).toBe(0);
  });

  it("stops at the first variant: Previous there is a no-op", () => {
    expect(previousBranchIndex(0, 3)).toBe(0);
    expect(previousBranchIndex(-4, 3)).toBe(0);
    expect(previousBranchIndex(0, 1)).toBe(0);
  });

  it("reads 0 with no branches", () => {
    expect(nextBranchIndex(0, 0)).toBe(0);
    expect(previousBranchIndex(0, 0)).toBe(0);
  });
});

describe("shouldHideBranchPicker", () => {
  it("hides single-branch pagers by default", () => {
    expect(shouldHideBranchPicker(1)).toBe(true);
    expect(shouldHideBranchPicker(0)).toBe(true);
    expect(shouldHideBranchPicker(2)).toBe(false);
    expect(shouldHideBranchPicker(1, false)).toBe(false);
  });
});

describe("useBranch", () => {
  it("steps and stops at both ends", () => {
    const { result } = renderHook(() => useBranch({ count: 3 }));
    expect(result.current.index).toBe(0);
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => result.current.previous());
    expect(result.current.index).toBe(0);
    // Previous on the first variant is a no-op.
    act(() => result.current.previous());
    expect(result.current.index).toBe(0);
    // Next on the last variant is a no-op.
    act(() => result.current.goTo(2));
    expect(result.current.index).toBe(2);
    act(() => result.current.next());
    expect(result.current.index).toBe(2);
  });

  it("jumps and clamps", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useBranch({ count: 3, onChange }));
    act(() => result.current.goTo(9));
    expect(result.current.index).toBe(2);
    expect(onChange).toHaveBeenLastCalledWith(2);
    act(() => result.current.goTo(-4));
    expect(result.current.index).toBe(0);
  });

  it("normalises immediately when the count shrinks", () => {
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useBranch({ count, defaultValue: 2 }),
      { initialProps: { count: 3 } },
    );
    expect(result.current.index).toBe(2);
    rerender({ count: 2 });
    expect(result.current.index).toBe(1);
    rerender({ count: 0 });
    expect(result.current.index).toBe(0);
  });

  it("follows the controlled index", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useBranch({ count: 3, value }),
      { initialProps: { value: 1 } },
    );
    expect(result.current.index).toBe(1);
    rerender({ value: 2 });
    expect(result.current.index).toBe(2);
  });
});
