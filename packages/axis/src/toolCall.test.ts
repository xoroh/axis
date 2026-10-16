import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  isToolCallApproval,
  isToolCallComplete,
  isToolCallError,
  isToolCallRunning,
  resolveToolCallLabel,
  type ToolCallState,
  useToolCall,
} from "./toolCall";

describe("tool-call predicates", () => {
  it("runs while arguments stream or queue", () => {
    expect(isToolCallRunning("input-streaming")).toBe(true);
    expect(isToolCallRunning("input-available")).toBe(true);
    expect(isToolCallRunning("output-available")).toBe(false);
    expect(isToolCallRunning("approval-requested")).toBe(false);
    expect(isToolCallRunning("output-error")).toBe(false);
    expect(isToolCallRunning("output-denied")).toBe(false);
  });

  it("completes on output or denial", () => {
    expect(isToolCallComplete("output-available")).toBe(true);
    expect(isToolCallComplete("output-denied")).toBe(true);
    expect(isToolCallComplete("input-available")).toBe(false);
    expect(isToolCallComplete("approval-requested")).toBe(false);
  });

  it("errors only on output-error and approves only on request", () => {
    expect(isToolCallError("output-error")).toBe(true);
    expect(isToolCallError("output-denied")).toBe(false);
    expect(isToolCallApproval("approval-requested")).toBe(true);
    expect(isToolCallApproval("input-available")).toBe(false);
  });
});

describe("resolveToolCallLabel", () => {
  it("names the tool and its phase", () => {
    expect(
      resolveToolCallLabel({ name: "get_weather", state: "input-streaming" }),
    ).toBe("Tool get_weather running");
    expect(
      resolveToolCallLabel({ name: "get_weather", state: "output-available" }),
    ).toBe("Tool get_weather completed");
    expect(
      resolveToolCallLabel({
        name: "get_weather",
        state: "approval-requested",
      }),
    ).toBe("Tool get_weather needs approval");
  });

  it("appends the error detail on failure", () => {
    expect(
      resolveToolCallLabel({
        name: "get_weather",
        state: "output-error",
        errorText: " timed out ",
      }),
    ).toBe("Tool get_weather failed: timed out");
    expect(
      resolveToolCallLabel({ name: "get_weather", state: "output-error" }),
    ).toBe("Tool get_weather failed");
  });
});

describe("useToolCall", () => {
  it("starts streaming by default", () => {
    const { result } = renderHook(() => useToolCall());
    expect(result.current.state).toBe("input-streaming");
  });

  it("approves from a request: resumes the run and reports", () => {
    const onApprove = vi.fn();
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useToolCall({
        defaultState: "approval-requested",
        onApprove,
        onStateChange,
      }),
    );
    act(() => result.current.approve());
    expect(result.current.state).toBe("input-available");
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenLastCalledWith("input-available");
  });

  it("denies from a request: settles as denied and reports", () => {
    const onDeny = vi.fn();
    const { result } = renderHook(() =>
      useToolCall({ defaultState: "approval-requested", onDeny }),
    );
    act(() => result.current.deny());
    expect(result.current.state).toBe("output-denied");
    expect(onDeny).toHaveBeenCalledTimes(1);
  });

  it("is terminal outside approval: no transitions, no callbacks", () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useToolCall({
        defaultState: "output-available",
        onApprove,
        onDeny,
        onStateChange,
      }),
    );
    act(() => {
      result.current.approve();
      result.current.deny();
    });
    expect(result.current.state).toBe("output-available");
    expect(onApprove).not.toHaveBeenCalled();
    expect(onDeny).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("follows the controlled state", () => {
    const { result, rerender } = renderHook(
      ({ state }: { state: ToolCallState }) => useToolCall({ state }),
      { initialProps: { state: "input-streaming" as ToolCallState } },
    );
    expect(result.current.state).toBe("input-streaming");
    rerender({ state: "approval-requested" });
    expect(result.current.state).toBe("approval-requested");
  });
});
