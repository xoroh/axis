import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createPressModel, isPressActivationKey, usePress } from "./press";

describe("isPressActivationKey", () => {
  it("accepts Enter and Space only", () => {
    expect(isPressActivationKey("Enter")).toBe(true);
    expect(isPressActivationKey(" ")).toBe(true);
    expect(isPressActivationKey("Tab")).toBe(false);
    expect(isPressActivationKey("Escape")).toBe(false);
    expect(isPressActivationKey("a")).toBe(false);
  });
});

describe("createPressModel", () => {
  it("tracks pressed between begin and end", () => {
    const onPress = vi.fn();
    const model = createPressModel({ onPress });
    expect(model.isPressed()).toBe(false);
    model.begin();
    expect(model.isPressed()).toBe(true);
    model.end();
    expect(model.isPressed()).toBe(false);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("reports no press on cancel", () => {
    const onPress = vi.fn();
    const model = createPressModel({ onPress });
    model.begin();
    model.cancel();
    expect(model.isPressed()).toBe(false);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("ignores end without begin", () => {
    const onPress = vi.fn();
    const model = createPressModel({ onPress });
    model.end();
    expect(onPress).not.toHaveBeenCalled();
  });

  it("accepts no input when disabled", () => {
    const onPress = vi.fn();
    const model = createPressModel({ disabled: true, onPress });
    expect(model.isDisabled()).toBe(true);
    model.begin();
    expect(model.isPressed()).toBe(false);
    model.end();
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("usePress", () => {
  it("exposes pressed plus platform-free begin/end/cancel", () => {
    const onPress = vi.fn();
    const { result } = renderHook(() => usePress({ onPress }));
    expect(result.current.pressed).toBe(false);
    act(() => result.current.begin());
    expect(result.current.pressed).toBe(true);
    act(() => result.current.end());
    expect(result.current.pressed).toBe(false);
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.begin();
      result.current.cancel();
    });
    expect(result.current.pressed).toBe(false);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
