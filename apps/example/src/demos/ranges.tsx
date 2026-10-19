import {
  buildCalendarGrid,
  type CalendarRange,
  DirectionProvider,
  parseCalendarMonth,
  resolveCalendarFocus,
  resolveCalendarSelection,
  SliderControl,
  SliderIndicator,
  SliderLabel,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  SliderValue,
  shiftCalendarMonth,
  toCalendarDate,
  toCalendarMonth,
} from "@xoroh/axis";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../theme";
import type { Demo } from "./registry";

/**
 * Ranges demo: drag slider, plus a UTC month grid driven by the
 * Axis calendar model (buildCalendarGrid + focus/selection helpers).
 * The grid is unstyled Axis behavior; every visual value below is
 * demo-owned caller style.
 */
export const RangesDemo: Demo = {
  slug: "ranges",
  title: "Ranges",
  components: [
    "SliderRoot",
    "SliderControl",
    "SliderTrack",
    "SliderIndicator",
    "SliderThumb",
    "SliderValue",
    "SliderLabel",
    "DirectionProvider",
  ],
  render: function RangesScreen() {
    const [volume, setVolume] = useState(60);
    const [price, setPrice] = useState<readonly number[]>([25, 75]);
    const [vertical, setVertical] = useState(40);
    const now = new Date();
    const thisMonth = toCalendarMonth(now.getUTCFullYear(), now.getUTCMonth());
    const [month, setMonth] = useState(thisMonth);
    const [range, setRange] = useState<CalendarRange>(null);
    const [focused, setFocused] = useState<string | null>(null);
    const { theme } = useTheme();

    const grid = useMemo(
      () =>
        buildCalendarGrid(month, {
          range,
          selected: focused,
        }),
      [month, range, focused],
    );

    const goMonth = (delta: 1 | -1) => {
      const parts = parseCalendarMonth(month) ?? {
        year: now.getUTCFullYear(),
        monthIndex: now.getUTCMonth(),
      };
      const next = shiftCalendarMonth(parts.year, parts.monthIndex, delta);
      setMonth(toCalendarMonth(next.year, next.monthIndex));
    };

    const stepDay = (key: "ArrowLeft" | "ArrowRight") => {
      const anchor =
        focused ?? toCalendarDate(now.getUTCFullYear(), now.getUTCMonth(), 1);
      const next = resolveCalendarFocus(anchor, key, { dir: "ltr" });
      if (next !== null) {
        setFocused(next);
        const selection = resolveCalendarSelection(next, {
          mode: "range",
          range,
        });
        if (selection !== null) setRange(selection.range);
      }
    };

    const tapDay = (iso: string) => {
      setFocused(iso);
      const selection = resolveCalendarSelection(iso, {
        mode: "range",
        range,
      });
      if (selection !== null) setRange(selection.range);
    };

    const rangeLabel =
      range === null
        ? "None"
        : range.start === range.end
          ? range.start
          : `${range.start} → ${range.end}`;

    return (
      <View style={{ gap: 20 }}>
        {/* Slider */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <SliderRoot
            value={volume}
            onValueChange={(v) => typeof v === "number" && setVolume(v)}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <SliderLabel
                testID="demo-volume-label"
                style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
              >
                Slider Control
              </SliderLabel>
              <SliderValue
                testID="demo-volume-value"
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: theme.primary,
                }}
              >
                {(values) => `${values[0]}%`}
              </SliderValue>
            </View>
            <View style={{ paddingVertical: 10 }}>
              <SliderControl>
                <SliderTrack
                  testID="demo-volume-track"
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <SliderIndicator
                    style={{
                      backgroundColor: theme.primary,
                      borderRadius: 4,
                    }}
                  />
                  <SliderThumb
                    accessibilityLabel="Demo volume slider"
                    testID="demo-volume-thumb"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: theme.surface,
                      borderWidth: 2,
                      borderColor: theme.primary,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                    }}
                  />
                </SliderTrack>
              </SliderControl>
            </View>
          </SliderRoot>
        </View>

        {/* Range slider: two thumbs, minimum gap, committed values */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <SliderRoot
            value={price}
            onValueChange={(v) => {
              if (Array.isArray(v)) setPrice([...v]);
            }}
            minStepsBetweenValues={5}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <SliderLabel
                testID="demo-range-label"
                style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
              >
                Price range
              </SliderLabel>
              <SliderValue
                testID="demo-range-value"
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: theme.primary,
                }}
              >
                {(values) => `$${values[0]} – $${values[1]}`}
              </SliderValue>
            </View>
            <View style={{ paddingVertical: 10 }}>
              <SliderControl>
                <SliderTrack
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <SliderIndicator
                    style={{
                      backgroundColor: theme.accent,
                      borderRadius: 4,
                    }}
                  />
                  <SliderThumb
                    index={0}
                    accessibilityLabel="Demo minimum price"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: theme.surface,
                      borderWidth: 2,
                      borderColor: theme.accent,
                    }}
                  />
                  <SliderThumb
                    index={1}
                    accessibilityLabel="Demo maximum price"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: theme.surface,
                      borderWidth: 2,
                      borderColor: theme.accent,
                    }}
                  />
                </SliderTrack>
              </SliderControl>
            </View>
          </SliderRoot>
        </View>

        {/* Vertical + disabled sliders */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: "row", gap: 24 }}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <DirectionProvider direction="rtl">
                <SliderRoot
                  value={vertical}
                  onValueChange={(v) => typeof v === "number" && setVertical(v)}
                  orientation="vertical"
                >
                  <SliderValue
                    testID="demo-vertical-value"
                    style={{ fontSize: 13, color: theme.text }}
                  >
                    {(values) => `${values[0]}`}
                  </SliderValue>
                  <SliderControl>
                    <SliderTrack
                      testID="demo-vertical-track"
                      style={{
                        width: 8,
                        height: 140,
                        borderRadius: 4,
                        backgroundColor: theme.surfaceSubtle,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <SliderIndicator
                        style={{
                          backgroundColor: theme.primary,
                          borderRadius: 4,
                        }}
                      />
                      <SliderThumb
                        accessibilityLabel="Demo vertical slider"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: theme.surface,
                          borderWidth: 2,
                          borderColor: theme.primary,
                        }}
                      />
                    </SliderTrack>
                  </SliderControl>
                </SliderRoot>
              </DirectionProvider>
              <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                Vertical
              </Text>
            </View>
            <View style={{ alignItems: "center", gap: 8, opacity: 0.7 }}>
              <SliderRoot value={30} disabled orientation="vertical">
                <SliderValue
                  testID="demo-disabled-value"
                  style={{ fontSize: 13, color: theme.text }}
                >
                  {(values) => `${values[0]}`}
                </SliderValue>
                <SliderControl>
                  <SliderTrack
                    style={{
                      width: 8,
                      height: 140,
                      borderRadius: 4,
                      backgroundColor: theme.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <SliderIndicator
                      style={{ backgroundColor: theme.textSubtle }}
                    />
                    <SliderThumb
                      accessibilityLabel="Demo disabled slider"
                      testID="demo-disabled-thumb"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: theme.surface,
                        borderWidth: 2,
                        borderColor: theme.textSubtle,
                      }}
                    />
                  </SliderTrack>
                </SliderControl>
              </SliderRoot>
              <Text style={{ fontSize: 13, color: theme.textSubtle }}>
                Disabled
              </Text>
            </View>
          </View>
        </View>

        {/* Calendar-model grid */}
        <View
          style={{
            backgroundColor: theme.surface,
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
            gap: 12,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
            >
              Calendar Grid (model):
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSubtle }}>
              Range: {rangeLabel}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => goMonth(-1)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text }}>{"<"}</Text>
            </Pressable>
            <Text
              style={{ fontSize: 15, fontWeight: "700", color: theme.text }}
            >
              {month}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => goMonth(1)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text }}>{">"}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row" }}>
            {grid.weekdayNames.map((name) => (
              <Text
                key={name}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: "700",
                  color: theme.textSubtle,
                }}
              >
                {name}
              </Text>
            ))}
          </View>
          {grid.weeks.map((week, row) => (
            // Week rows are positional and fixed-length: the index IS the
            // stable identity (no reorder/insert/remove exists).
            // biome-ignore lint/suspicious/noArrayIndexKey: positional fixed-length week rows.
            <View key={`week-${row}`} style={{ flexDirection: "row" }}>
              {week.map((cell, col) =>
                cell === null ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional fixed-length blanks.
                  <View key={`blank-${col}`} style={{ flex: 1 }} />
                ) : (
                  <Pressable
                    key={cell.iso}
                    accessibilityRole="button"
                    accessibilityLabel={cell.iso}
                    onPress={() => tapDay(cell.iso)}
                    onFocus={() => setFocused(cell.iso)}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      backgroundColor:
                        cell.range === "start" || cell.range === "end"
                          ? theme.primary
                          : cell.range === "inside"
                            ? theme.surfaceSubtle
                            : "transparent",
                      borderWidth: focused === cell.iso ? 2 : 0,
                      borderColor:
                        focused === cell.iso ? theme.text : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color:
                          cell.range === "start" || cell.range === "end"
                            ? theme.primaryFg
                            : theme.text,
                      }}
                    >
                      {cell.day}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous day"
              onPress={() => stepDay("ArrowLeft")}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text }}>{"<"} day</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next day"
              onPress={() => stepDay("ArrowRight")}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text }}>day {">"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  },
};
