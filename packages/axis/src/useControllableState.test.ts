import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "./useControllableState";

/**
 * The shared kernel had 21 consumers and ZERO tests when it moved here, and
 * existed as two byte-identical copies — one per renderer. That is the risk this
 * file closes: if web and native each had their own copy, a behaviour difference
 * between them would be invisible until a consumer misbehaved in the field.
 *
 * These assert BEHAVIOUR, not implementation: what a consumer observes. Nothing
 * here names a renderer, a token, or a React internal, so it survives a primitive
 * ruling — the same discipline the parity contract follows.
 */
describe("useControllableState", () => {
  it("starts at defaultValue when uncontrolled", () => {
    const { result } = renderHook(() =>
      useControllableState<boolean>(undefined, false),
    );
    expect(result.current[0]).toBe(false);
  });

  it("follows the controlled value when one is supplied", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: boolean }) =>
        useControllableState<boolean>(value, false),
      { initialProps: { value: true } },
    );
    expect(result.current[0]).toBe(true);

    rerender({ value: false });
    expect(result.current[0]).toBe(false);
  });

  it("updates internal state when uncontrolled", () => {
    const { result } = renderHook(() =>
      useControllableState<boolean>(undefined, false),
    );
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });

  it("does NOT write internal state when controlled — the prop is the truth", () => {
    const { result } = renderHook(() =>
      useControllableState<boolean>(true, false),
    );
    act(() => result.current[1](false));
    // The setter ran, but the controlled value still governs the render.
    expect(result.current[0]).toBe(true);
  });

  /**
   * The test above is NOT sufficient on its own, and mutation testing is why.
   * Removing `if (!controlled)` from the setter leaves this hook observably
   * identical while controlled, because `current` reads the controlled `value`
   * prop and never consults `internal` — so the naive assertion passes against
   * a broken implementation. The write only becomes observable when the parent
   * later drops the prop and the hook falls back to internal state, which is
   * exactly the uncontrolled-after-controlled case the warning exists for.
   */
  it("does not retain a controlled setter's write after becoming uncontrolled", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: boolean | undefined }) =>
        useControllableState<boolean>(value, false),
      { initialProps: { value: true as boolean | undefined } },
    );

    // Controlled: the prop governs, so this write is not reflected.
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);

    // The parent drops the prop. Correct behaviour falls back to the internal
    // default (`false`); a setter that wrote unconditionally leaks `true`.
    rerender({ value: undefined });
    expect(result.current[0]).toBe(false);
  });

  it("calls onChange with the next value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<boolean>(undefined, false, onChange),
    );
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does NOT call onChange when the value did not actually change", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<boolean>(undefined, false, onChange),
    );
    act(() => result.current[1](false));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports an updater function receiving the previous value", () => {
    const { result } = renderHook(() =>
      useControllableState<number>(undefined, 1),
    );
    act(() => result.current[1]((previous) => (previous ?? 0) + 1));
    expect(result.current[0]).toBe(2);

    act(() => result.current[1]((previous) => (previous ?? 0) * 10));
    expect(result.current[0]).toBe(20);
  });

  it("does not call onChange when an updater resolves to the same value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<number>(undefined, 5, onChange),
    );
    act(() => result.current[1]((previous) => previous ?? 0));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("warns when a component changes from uncontrolled to controlled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = renderHook(
      ({ value }: { value: boolean | undefined }) =>
        useControllableState<boolean>(value, false),
      { initialProps: { value: undefined as boolean | undefined } },
    );

    rerender({ value: true });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("controlled"));
    warn.mockRestore();
  });

  it("warns when a component changes from controlled to uncontrolled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = renderHook(
      ({ value }: { value: boolean | undefined }) =>
        useControllableState<boolean>(value, false),
      { initialProps: { value: true as boolean | undefined } },
    );

    rerender({ value: undefined });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("controlled"));
    warn.mockRestore();
  });

  it("warns only once per mode change, not on every render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = renderHook(
      ({ value }: { value: boolean | undefined }) =>
        useControllableState<boolean>(value, false),
      { initialProps: { value: undefined as boolean | undefined } },
    );

    rerender({ value: true });
    const afterFirst = warn.mock.calls.length;
    rerender({ value: false });
    rerender({ value: false });
    expect(warn.mock.calls.length).toBe(afterFirst);
    warn.mockRestore();
  });

  it("returns a stable setter identity when the controlled value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: boolean }) =>
        useControllableState<boolean>(value, false),
      { initialProps: { value: false } },
    );
    const first = result.current[1];
    rerender({ value: true });
    expect(result.current[1]).toBe(first);
  });

  /**
   * A NEW `onChange` closure DOES change the setter identity — `onChange` is a
   * real dependency of the `useCallback`, and it must be: a stale `onChange` would
   * call a consumer's handler after their state moved on. Recorded here because the
   * naive expectation ("the setter is always stable") is wrong, and the mutation
   * run is what surfaced it.
   */
  it("changes setter identity when onChange changes — onChange is a real dep", () => {
    const { result, rerender } = renderHook(
      ({ onChange }: { onChange: () => void }) =>
        useControllableState<boolean>(undefined, false, onChange),
      { initialProps: { onChange: () => {} } },
    );
    const first = result.current[1];
    rerender({ onChange: () => {} });
    expect(result.current[1]).not.toBe(first);
  });

  it("handles an undefined default without treating it as controlled", () => {
    const { result } = renderHook(() =>
      useControllableState<string>(undefined, undefined),
    );
    expect(result.current[0]).toBeUndefined();
    act(() => result.current[1]("set"));
    expect(result.current[0]).toBe("set");
  });
});
