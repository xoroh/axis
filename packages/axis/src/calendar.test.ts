import { describe, expect, it } from "vitest";
import {
  buildCalendarGrid,
  daysInCalendarMonth,
  isCalendarDateDisabled,
  leadingBlankCount,
  parseCalendarDate,
  parseCalendarMonth,
  resolveCalendarFocus,
  resolveCalendarMonthNames,
  resolveCalendarSelection,
  resolveCalendarWeekdayNames,
  resolveLocaleFirstDay,
  shiftCalendarMonth,
  toCalendarDate,
  toCalendarMonth,
} from "./calendar";

/**
 * Calendar model: month-grid math moved from the removed component
 * (ADR-012) plus the new grid/key/selection surface — observed here,
 * not assumed. Ports the component suite's behavior assertions
 * (structure, ISO selection, min/max disabling, month navigation)
 * to the function level.
 */

describe("calendar parsing", () => {
  it("parses valid ISO dates and rejects the impossible", () => {
    expect(parseCalendarDate("2026-03-15")).toEqual({
      year: 2026,
      monthIndex: 2,
      day: 15,
    });
    // 2026-02-30 constructs to March: the round-trip guard rejects it.
    expect(parseCalendarDate("2026-02-30")).toBeNull();
    expect(parseCalendarDate("not-a-date")).toBeNull();
    expect(parseCalendarDate(null)).toBeNull();
  });

  it("parses month keys and rejects the out-of-range", () => {
    expect(parseCalendarMonth("2026-03")).toEqual({
      year: 2026,
      monthIndex: 2,
    });
    expect(parseCalendarMonth("2026-13")).toBeNull();
    expect(parseCalendarMonth("junk")).toBeNull();
  });

  it("round-trips ISO dates and month keys", () => {
    expect(toCalendarDate(2026, 2, 4)).toBe("2026-03-04");
    expect(toCalendarMonth(2025, 11)).toBe("2025-12");
    expect(daysInCalendarMonth(2026, 1)).toBe(28);
    expect(daysInCalendarMonth(2024, 1)).toBe(29);
  });

  it("shifts months across year boundaries", () => {
    expect(shiftCalendarMonth(2026, 0, -1)).toEqual({
      year: 2025,
      monthIndex: 11,
    });
    expect(shiftCalendarMonth(2025, 11, 1)).toEqual({
      year: 2026,
      monthIndex: 0,
    });
  });
});

describe("calendar grid", () => {
  it("builds seven-cell weeks with Sunday-first blanks by default", () => {
    // 2026-03-01 is a Sunday: no leading blanks, 31 days, trailing pad.
    const { weeks, weekdayNames } = buildCalendarGrid("2026-03");
    expect(weekdayNames).toHaveLength(7);
    for (const week of weeks) expect(week).toHaveLength(7);
    expect(weeks[0]?.[0]?.iso).toBe("2026-03-01");
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
  });

  it("rotates blanks and names to firstDayOfWeek", () => {
    const sunday = buildCalendarGrid("2026-03");
    const monday = buildCalendarGrid("2026-03", { firstDayOfWeek: 1 });
    // March 2026 starts Sunday: Monday-first grids lead with 6 blanks.
    expect(leadingBlankCount(2026, 2, 0)).toBe(0);
    expect(leadingBlankCount(2026, 2, 1)).toBe(6);
    expect(monday.weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(monday.weekdayNames).toHaveLength(7);
    expect(monday.weekdayNames[0]).toBe(sunday.weekdayNames[1]);
  });

  it("flags min/max and custom-disabled days", () => {
    const { weeks } = buildCalendarGrid("2026-03", {
      minDate: "2026-03-10",
      maxDate: "2026-03-20",
      isDateDisabled: (iso) => iso === "2026-03-15",
    });
    const cell = (iso: string) =>
      weeks.flat().find((c) => c?.iso === iso) ?? null;
    expect(cell("2026-03-09")?.disabled).toBe(true);
    expect(cell("2026-03-21")?.disabled).toBe(true);
    expect(cell("2026-03-10")?.disabled).toBe(false);
    expect(cell("2026-03-15")?.disabled).toBe(true);
  });

  it("marks single selection and range positions", () => {
    const single = buildCalendarGrid("2026-03", { selected: "2026-03-04" });
    const picked = single.weeks.flat().find((c) => c?.iso === "2026-03-04");
    expect(picked?.selected).toBe(true);
    const ranged = buildCalendarGrid("2026-03", {
      range: { start: "2026-03-04", end: "2026-03-06" },
    });
    const at = (iso: string) => ranged.weeks.flat().find((c) => c?.iso === iso);
    expect(at("2026-03-04")?.range).toBe("start");
    expect(at("2026-03-05")?.range).toBe("inside");
    expect(at("2026-03-06")?.range).toBe("end");
    expect(at("2026-03-07")?.range).toBeNull();
  });

  it("builds an empty grid for invalid month keys without throwing", () => {
    expect(buildCalendarGrid("not-a-month").weeks).toEqual([]);
    expect(buildCalendarGrid("2026-13").weeks).toEqual([]);
  });
});

describe("calendar focus keys", () => {
  it("moves arrows by day and week", () => {
    expect(resolveCalendarFocus("2026-03-15", "ArrowLeft")).toBe("2026-03-14");
    expect(resolveCalendarFocus("2026-03-15", "ArrowRight")).toBe("2026-03-16");
    expect(resolveCalendarFocus("2026-03-15", "ArrowUp")).toBe("2026-03-08");
    expect(resolveCalendarFocus("2026-03-15", "ArrowDown")).toBe("2026-03-22");
  });

  it("swaps Left/Right in rtl", () => {
    expect(
      resolveCalendarFocus("2026-03-15", "ArrowLeft", { dir: "rtl" }),
    ).toBe("2026-03-16");
    expect(
      resolveCalendarFocus("2026-03-15", "ArrowRight", { dir: "rtl" }),
    ).toBe("2026-03-14");
  });

  it("jumps Home/End to the visual row edges", () => {
    // 2026-03-18 is a Wednesday; Sunday-first row runs 15–21.
    expect(resolveCalendarFocus("2026-03-18", "Home")).toBe("2026-03-15");
    expect(resolveCalendarFocus("2026-03-18", "End")).toBe("2026-03-21");
    // Monday-first row containing 2026-03-18 runs 16–22.
    expect(
      resolveCalendarFocus("2026-03-18", "Home", { firstDayOfWeek: 1 }),
    ).toBe("2026-03-16");
    expect(
      resolveCalendarFocus("2026-03-18", "End", { firstDayOfWeek: 1 }),
    ).toBe("2026-03-22");
  });

  it("moves PageUp/PageDown across months, clamping the day", () => {
    expect(resolveCalendarFocus("2026-03-15", "PageUp")).toBe("2026-02-15");
    expect(resolveCalendarFocus("2026-01-15", "PageUp")).toBe("2025-12-15");
    // March 31 has no April 31: clamps to April 30.
    expect(resolveCalendarFocus("2026-03-31", "PageDown")).toBe("2026-04-30");
  });

  it("returns null for invalid input without throwing", () => {
    expect(resolveCalendarFocus("junk", "ArrowLeft")).toBeNull();
    expect(resolveCalendarFocus(null, "Home")).toBeNull();
  });
});

describe("calendar selection", () => {
  it("selects a single date", () => {
    expect(resolveCalendarSelection("2026-03-15")).toEqual({
      value: "2026-03-15",
      range: null,
    });
  });

  it("anchors, completes, and re-anchors ranges", () => {
    const anchored = resolveCalendarSelection("2026-03-10", { mode: "range" });
    expect(anchored).toEqual({
      value: "2026-03-10",
      range: { start: "2026-03-10", end: "2026-03-10" },
    });
    // Second tap completes, ordered regardless of tap direction.
    expect(
      resolveCalendarSelection("2026-03-05", {
        mode: "range",
        range: anchored?.range ?? null,
      }),
    ).toEqual({
      value: "2026-03-05",
      range: { start: "2026-03-05", end: "2026-03-10" },
    });
    // A tap with a complete range re-anchors.
    expect(
      resolveCalendarSelection("2026-03-20", {
        mode: "range",
        range: { start: "2026-03-05", end: "2026-03-10" },
      }),
    ).toEqual({
      value: "2026-03-20",
      range: { start: "2026-03-20", end: "2026-03-20" },
    });
  });

  it("ignores taps on disabled dates and garbage", () => {
    expect(
      resolveCalendarSelection("2026-03-09", {
        minDate: "2026-03-10",
      }),
    ).toBeNull();
    expect(resolveCalendarSelection("junk", { mode: "range" })).toBeNull();
  });

  it("exposes the disable predicate directly", () => {
    expect(
      isCalendarDateDisabled("2026-03-09", { minDate: "2026-03-10" }),
    ).toBe(true);
    expect(
      isCalendarDateDisabled("2026-03-10", { minDate: "2026-03-10" }),
    ).toBe(false);
    expect(
      isCalendarDateDisabled("2026-03-15", {
        isDateDisabled: (iso) => iso.endsWith("15"),
      }),
    ).toBe(true);
  });
});

describe("calendar weekday names", () => {
  it("returns seven names rotated to firstDayOfWeek", () => {
    const names = resolveCalendarWeekdayNames("en-US", 0);
    expect(names).toHaveLength(7);
    const monday = resolveCalendarWeekdayNames("en-US", 1);
    expect(monday[0]).toBe(names[1]);
    expect(monday[6]).toBe(names[0]);
  });
});

describe("calendar locale names", () => {
  it("names twelve months in calendar order", async () => {
    const long = resolveCalendarMonthNames("en-US", "long");
    expect(long).toHaveLength(12);
    expect(long[0]).toBe("January");
    expect(long[11]).toBe("December");
    expect(resolveCalendarMonthNames("en-US", "short")[0]).toBe("Jan");
  });

  it("localizes month names", async () => {
    expect(resolveCalendarMonthNames("de-DE")[0]).toBe("Januar");
  });

  it("resolves the locale week start", async () => {
    expect(resolveLocaleFirstDay("en-US")).toBe(0);
    expect(resolveLocaleFirstDay("de-DE")).toBe(1);
  });

  it("prefers live weekInfo when the runtime provides it", async () => {
    const RealLocale = Intl.Locale;
    try {
      const withWeekInfo = (firstDay: number) =>
        class {
          constructor(public tag: string) {}
          getWeekInfo() {
            return { firstDay };
          }
        };
      (Intl as unknown as Record<string, unknown>).Locale = withWeekInfo(6);
      expect(resolveLocaleFirstDay("xx-YY")).toBe(6);
      (Intl as unknown as Record<string, unknown>).Locale = withWeekInfo(1);
      expect(resolveLocaleFirstDay("xx-YY")).toBe(1);
      // weekInfo as a data property (no getWeekInfo method).
      (Intl as unknown as Record<string, unknown>).Locale = class {
        weekInfo = { firstDay: 7 };
        constructor(public tag: string) {}
      };
      expect(resolveLocaleFirstDay("xx-YY")).toBe(0);
    } finally {
      (Intl as unknown as Record<string, unknown>).Locale = RealLocale;
    }
  });

  it("falls back to the region table without weekInfo", async () => {
    const RealLocale = Intl.Locale;
    try {
      // No Intl.Locale at all: plain BCP-47 parse drives the table.
      (Intl as unknown as Record<string, unknown>).Locale = undefined;
      expect(resolveLocaleFirstDay("en-US")).toBe(0);
      expect(resolveLocaleFirstDay("de-DE")).toBe(1);
      expect(resolveLocaleFirstDay("ar-EG")).toBe(6);
      expect(resolveLocaleFirstDay("dv-MV")).toBe(5);
      expect(resolveLocaleFirstDay("fr")).toBe(1);
      expect(resolveLocaleFirstDay("zh-Hant-TW")).toBe(0);
      expect(resolveLocaleFirstDay("not-a-locale!!")).toBe(1);
    } finally {
      (Intl as unknown as Record<string, unknown>).Locale = RealLocale;
    }
  });

  it("uses maximize() for the region when weekInfo is absent", async () => {
    const RealLocale = Intl.Locale;
    try {
      // maximize() without getWeekInfo: region drives the table.
      (Intl as unknown as Record<string, unknown>).Locale = class {
        constructor(public tag: string) {}
        maximize() {
          return { region: "EG" };
        }
      };
      expect(resolveLocaleFirstDay("ar")).toBe(6);
      // maximize() throwing falls through to the subtag parse.
      (Intl as unknown as Record<string, unknown>).Locale = class {
        constructor(public tag: string) {}
        maximize(): never {
          throw new Error("no maximize");
        }
      };
      expect(resolveLocaleFirstDay("ar-EG")).toBe(6);
    } finally {
      (Intl as unknown as Record<string, unknown>).Locale = RealLocale;
    }
  });

  it("builds a Monday-first grid from the locale default", async () => {
    const firstDay = resolveLocaleFirstDay("de-DE");
    const { weeks, weekdayNames } = buildCalendarGrid("2026-03", {
      firstDayOfWeek: firstDay,
    });
    expect(weekdayNames).toHaveLength(7);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
  });
});

describe("calendar cross-month focus", () => {
  it("moves arrows across month ends", async () => {
    expect(resolveCalendarFocus("2026-01-31", "ArrowRight")).toBe("2026-02-01");
    expect(resolveCalendarFocus("2026-03-01", "ArrowLeft")).toBe("2026-02-28");
    expect(resolveCalendarFocus("2026-01-30", "ArrowDown")).toBe("2026-02-06");
    expect(resolveCalendarFocus("2026-03-02", "ArrowUp")).toBe("2026-02-23");
  });

  it("moves arrows across year ends", async () => {
    expect(resolveCalendarFocus("2025-12-31", "ArrowRight")).toBe("2026-01-01");
    expect(resolveCalendarFocus("2026-01-01", "ArrowLeft")).toBe("2025-12-31");
  });

  it("holds the correct days across a DST weekend", async () => {
    // US DST 2026 starts Sunday March 8: UTC date math has no DST, so
    // Saturday -> Sunday -> Monday resolve exactly.
    expect(resolveCalendarFocus("2026-03-07", "ArrowRight")).toBe("2026-03-08");
    expect(resolveCalendarFocus("2026-03-09", "ArrowLeft")).toBe("2026-03-08");
    expect(resolveCalendarFocus("2026-03-08", "ArrowDown")).toBe("2026-03-15");
  });

  it("keeps Home and End grid-local", async () => {
    // April 2026 starts Wednesday: Home on the 2nd clamps to the 1st.
    expect(resolveCalendarFocus("2026-04-02", "Home")).toBe("2026-04-01");
    expect(resolveCalendarFocus("2026-04-30", "End")).toBe("2026-04-30");
  });

  it("marks range cells even when disabled", async () => {
    const { weeks } = buildCalendarGrid("2026-03", {
      range: { start: "2026-03-04", end: "2026-03-06" },
      isDateDisabled: (iso) => iso === "2026-03-05",
    });
    const at = (iso: string) => weeks.flat().find((c) => c?.iso === iso);
    expect(at("2026-03-05")?.disabled).toBe(true);
    expect(at("2026-03-05")?.range).toBe("inside");
  });
});
