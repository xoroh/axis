import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  type ChatAttachment,
  updateAttachment,
  useAttachments,
  validateAttachment,
} from "./attachments";

const file = (overrides?: Partial<ChatAttachment>): ChatAttachment => ({
  id: "a1",
  name: "photo.png",
  size: 1200,
  mimeType: "image/png",
  state: "uploading",
  ...overrides,
});

describe("validateAttachment", () => {
  it("accepts within limits", () => {
    expect(
      validateAttachment([], file(), { maxFiles: 10, maxFileSize: 5000 }),
    ).toBeNull();
  });

  it("reports identity before size before count", () => {
    expect(validateAttachment([file()], file(), {})).toBe("duplicate");
    expect(
      validateAttachment([], { id: "x", size: 6000 }, { maxFileSize: 5 }),
    ).toBe("too-large");
    expect(validateAttachment([file()], { id: "x" }, { maxFiles: 1 })).toBe(
      "too-many",
    );
  });

  it("treats unknown sizes and absent limits as unbounded", () => {
    expect(validateAttachment([], { id: "x" }, { maxFileSize: 5 })).toBeNull();
    expect(validateAttachment([file()], { id: "x" })).toBeNull();
  });
});

describe("updateAttachment", () => {
  it("patches by id and leaves unknown ids alone", () => {
    const current = [file(), file({ id: "a2", state: "uploading" })];
    expect(updateAttachment(current, "a2", { state: "uploaded" })).toEqual([
      file(),
      file({ id: "a2", state: "uploaded" }),
    ]);
    expect(updateAttachment(current, "nope", { state: "uploaded" })).toEqual(
      current,
    );
  });
});

describe("useAttachments", () => {
  it("starts empty and adds", () => {
    const { result } = renderHook(() => useAttachments());
    expect(result.current.attachments).toEqual([]);
    act(() => result.current.add(file()));
    expect(result.current.attachments).toEqual([file()]);
  });

  it("refuses over-limit candidates through onError, never entering the list", () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAttachments({ maxFiles: 1, onError }),
    );
    act(() => result.current.add(file()));
    act(() => result.current.add(file({ id: "a2" })));
    expect(result.current.attachments).toEqual([file()]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("too-many", file({ id: "a2" }));
  });

  it("adds a multi-file pick in one write", () => {
    const { result } = renderHook(() => useAttachments());
    act(() =>
      result.current.addMany([file(), file({ id: "a2" }), file({ id: "a3" })]),
    );
    expect(result.current.attachments.map((entry) => entry.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
  });

  it("updates, removes, and clears", () => {
    const { result } = renderHook(() => useAttachments());
    act(() => result.current.addMany([file(), file({ id: "a2" })]));
    act(() => result.current.update("a1", { state: "uploaded" }));
    expect(result.current.attachments[0]?.state).toBe("uploaded");
    act(() => result.current.remove("unknown"));
    expect(result.current.attachments).toHaveLength(2);
    act(() => result.current.remove("a1"));
    expect(result.current.attachments.map((entry) => entry.id)).toEqual(["a2"]);
    act(() => result.current.clear());
    expect(result.current.attachments).toEqual([]);
  });

  it("follows the controlled value", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: readonly ChatAttachment[] }) =>
        useAttachments({ value, onChange }),
      { initialProps: { value: [] as readonly ChatAttachment[] } },
    );
    act(() => result.current.add(file()));
    expect(onChange).toHaveBeenCalledWith([file()]);
    rerender({ value: [file({ id: "a9" })] });
    expect(result.current.attachments).toEqual([file({ id: "a9" })]);
  });
});
