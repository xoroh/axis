import { describe, expect, it } from "vitest";
import {
  clampNumberValue,
  formatNumberValue,
  parseNumberValue,
  stepNumberValue,
} from "./number";

/**
 * Number model: locale-aware parse/format and step math as pure
 * logic — observed here, not assumed.
 */

describe("formatNumberValue", () => {
  it("formats with the runtime locale by default", () => {
    expect(formatNumberValue(42)).toBe("42");
    expect(formatNumberValue(1234.5, { locale: "en-US" })).toBe("1,234.5");
  });

  it("formats German grouping and decimals", () => {
    expect(formatNumberValue(1234.5, { locale: "de-DE" })).toBe("1.234,5");
  });

  it("renders null as empty", () => {
    expect(formatNumberValue(null)).toBe("");
    expect(formatNumberValue(Number.NaN)).toBe("");
  });

  it("honors format options", () => {
    expect(
      formatNumberValue(42, {
        format: { minimumFractionDigits: 2 },
      }),
    ).toBe("42.00");
  });
});

describe("parseNumberValue", () => {
  it("parses plain input", () => {
    expect(parseNumberValue("42")).toBe(42);
    expect(parseNumberValue("-12.5")).toBe(-12.5);
    expect(parseNumberValue("1e3")).toBe(1000);
  });

  it("returns null for empty or garbage", () => {
    expect(parseNumberValue("")).toBeNull();
    expect(parseNumberValue("   ")).toBeNull();
    expect(parseNumberValue("abc")).toBeNull();
    expect(parseNumberValue("12abc")).toBeNull();
    expect(parseNumberValue(null)).toBeNull();
  });

  it("strips grouping and maps the locale decimal", () => {
    expect(parseNumberValue("1,234.5", { locale: "en-US" })).toBe(1234.5);
    expect(parseNumberValue("1.234,5", { locale: "de-DE" })).toBe(1234.5);
  });

  it("round-trips formatted values", () => {
    for (const locale of ["en-US", "de-DE", "fr-FR"] as const) {
      const formatted = formatNumberValue(1234.5, { locale });
      expect(parseNumberValue(formatted, { locale })).toBe(1234.5);
    }
  });
});

describe("clampNumberValue", () => {
  it("clamps to closed bounds, open when unset", () => {
    expect(clampNumberValue(5, 0, 10)).toBe(5);
    expect(clampNumberValue(-5, 0, 10)).toBe(0);
    expect(clampNumberValue(50, 0, 10)).toBe(10);
    expect(clampNumberValue(-50)).toBe(-50);
  });
});

describe("stepNumberValue", () => {
  it("steps by the increment within bounds", () => {
    expect(stepNumberValue(1, 1, { step: 1, min: 0, max: 10 })).toBe(2);
    expect(stepNumberValue(0, -1, { step: 1, min: 0, max: 10 })).toBe(0);
    expect(stepNumberValue(10, 1, { step: 1, min: 0, max: 10 })).toBe(10);
  });

  it("falls back to a step of 1 on garbage", () => {
    expect(stepNumberValue(1, 1, { step: 0 })).toBe(2);
    expect(stepNumberValue(1, 1, { step: Number.NaN })).toBe(2);
  });

  it("snaps to the grid only with snapOnStep", () => {
    expect(stepNumberValue(1.2, 1, { step: 1 })).toBeCloseTo(2.2);
    expect(stepNumberValue(1.2, 1, { step: 1, snapOnStep: true })).toBe(2);
    expect(stepNumberValue(1.7, 1, { step: 0.5, snapOnStep: true })).toBe(2);
  });
});
