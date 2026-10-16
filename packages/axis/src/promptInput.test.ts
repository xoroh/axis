import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  resolveCanSend,
  resolveComposerHeight,
  shouldCancelOnEscapeKey,
  shouldSubmitOnKey,
  usePromptInput,
} from "./promptInput";

describe("resolveCanSend", () => {
  it("needs non-blank text and an idle or failed run", () => {
    expect(resolveCanSend({ text: "hi", status: "idle" })).toBe(true);
    expect(resolveCanSend({ text: "hi", status: "error" })).toBe(true);
    expect(resolveCanSend({ text: "   ", status: "idle" })).toBe(false);
    expect(resolveCanSend({ text: "", status: "idle" })).toBe(false);
    expect(resolveCanSend({ text: "hi", status: "submitted" })).toBe(false);
    expect(resolveCanSend({ text: "hi", status: "streaming" })).toBe(false);
  });

  it("enforces maxLength when set", () => {
    expect(
      resolveCanSend({ text: "hello", status: "idle", maxLength: 5 }),
    ).toBe(true);
    expect(
      resolveCanSend({ text: "hello!", status: "idle", maxLength: 5 }),
    ).toBe(false);
  });
});

describe("shouldSubmitOnKey", () => {
  it("submits on plain Enter in enter mode, never with Shift", () => {
    expect(shouldSubmitOnKey({ key: "Enter", submitMode: "enter" })).toBe(true);
    expect(
      shouldSubmitOnKey({ key: "Enter", shiftKey: true, submitMode: "enter" }),
    ).toBe(false);
    expect(shouldSubmitOnKey({ key: "a", submitMode: "enter" })).toBe(false);
  });

  it("needs Ctrl or Cmd in ctrlEnter mode", () => {
    expect(shouldSubmitOnKey({ key: "Enter", submitMode: "ctrlEnter" })).toBe(
      false,
    );
    expect(
      shouldSubmitOnKey({
        key: "Enter",
        ctrlKey: true,
        submitMode: "ctrlEnter",
      }),
    ).toBe(true);
    expect(
      shouldSubmitOnKey({
        key: "Enter",
        metaKey: true,
        submitMode: "ctrlEnter",
      }),
    ).toBe(true);
  });

  it("never submits by key in none mode", () => {
    expect(
      shouldSubmitOnKey({
        key: "Enter",
        ctrlKey: true,
        metaKey: true,
        submitMode: "none",
      }),
    ).toBe(false);
  });
});

describe("shouldCancelOnEscapeKey", () => {
  it("fires only on Escape with the opt-in", () => {
    expect(shouldCancelOnEscapeKey("Escape", true)).toBe(true);
    expect(shouldCancelOnEscapeKey("Escape", false)).toBe(false);
    expect(shouldCancelOnEscapeKey("Enter", true)).toBe(false);
  });
});

describe("resolveComposerHeight", () => {
  it("scales lines and clamps to min..max", () => {
    expect(resolveComposerHeight({ lineCount: 3, lineHeight: 20 })).toBe(60);
    expect(resolveComposerHeight({ lineCount: 0, lineHeight: 20 })).toBe(20);
    expect(resolveComposerHeight({ lineCount: 9, lineHeight: 20 })).toBe(100);
    expect(
      resolveComposerHeight({
        lineCount: 9,
        lineHeight: 20,
        minLines: 2,
        maxLines: 3,
      }),
    ).toBe(60);
  });
});

describe("usePromptInput", () => {
  it("tracks the draft and gates send", () => {
    const { result } = renderHook(() => usePromptInput());
    expect(result.current.value).toBe("");
    expect(result.current.canSend).toBe(false);
    act(() => result.current.setValue("hello"));
    expect(result.current.value).toBe("hello");
    expect(result.current.canSend).toBe(true);
  });

  it("submits only when sendable and never clears for the caller", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => usePromptInput({ onSubmit }));
    act(() => result.current.submit());
    expect(onSubmit).not.toHaveBeenCalled();
    act(() => result.current.setValue("hello"));
    act(() => result.current.submit());
    expect(onSubmit).toHaveBeenCalledWith("hello");
    expect(result.current.value).toBe("hello");
    act(() => result.current.clear());
    expect(result.current.value).toBe("");
  });

  it("blocks submit while busy", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      usePromptInput({ status: "streaming", defaultValue: "queued" }),
    );
    expect(result.current.canSend).toBe(false);
    act(() => result.current.submit());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("commits on Enter and cancels on Escape with the opt-in", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      usePromptInput({ onSubmit, cancelOnEscape: true }),
    );
    act(() => result.current.setValue("hello"));
    let handled = false;
    act(() => {
      handled = result.current.handleKey({ key: "Enter" });
    });
    expect(handled).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith("hello");
    act(() => {
      handled = result.current.handleKey({ key: "Escape" });
    });
    expect(handled).toBe(true);
    expect(result.current.value).toBe("");
  });

  it("ignores Enter when the draft cannot send", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => usePromptInput({ onSubmit }));
    let handled = false;
    act(() => {
      handled = result.current.handleKey({ key: "Enter" });
    });
    expect(handled).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("follows the controlled value", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => usePromptInput({ value, onChange }),
      { initialProps: { value: "a" } },
    );
    expect(result.current.value).toBe("a");
    act(() => result.current.setValue("b"));
    expect(onChange).toHaveBeenCalledWith("b");
    rerender({ value: "c" });
    expect(result.current.value).toBe("c");
  });
});
