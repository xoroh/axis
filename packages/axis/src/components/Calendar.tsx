import { type ElementRef, type Ref, useCallback, useMemo } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * Calendar — an unstyled month-grid date picker.
 *
 * Structure only: a header row (previous-month / title / next-month),
 * a seven-cell weekday header, and a weeks-by-seven grid of day cells.
 * No default visuals — every visual value (`style`, `dayStyle`) is
 * caller-provided. Selection follows the `useControllableState`
 * pattern: `value` (+ `onValueChange`) for controlled use,
 * `defaultValue` for uncontrolled. The visible month is independently
 * controllable via `month` (+ `onMonthChange`); selecting a day never
 * moves the grid — pass `month` to move it.
 *
 * Date math uses plain `Date` UTC construction only
 * (`new Date(Date.UTC(y, m, d))`; no date library). The grid starts on
 * Sunday: leading blanks pad from the first-day-of-month weekday
 * (`getUTCDay`, 0 = Sunday) so every week row holds seven cells.
 * Day cells carry `accessibilityRole="button"` with
 * `accessibilityState` `{ selected, disabled }` and their ISO date as
 * the accessible name. Invalid date strings are ignored (parsed to
 * `null`) — the component never throws on bad input.
 */

export type CalendarState = {
  /** Currently selected date (ISO `yyyy-mm-dd`, `null` for none). */
  value: string | null;
  /** Visible month key (ISO `yyyy-mm`). */
  month: string;
  /** Whether the whole calendar is disabled. */
  disabled: boolean;
};

export type CalendarProps = {
  /** Controlled selected date (ISO `yyyy-mm-dd`). Wins over `defaultValue` when defined. */
  value?: string | null;
  /** Uncontrolled initial date. No selection when omitted. Invalid strings select nothing. */
  defaultValue?: string | null;
  /** Fires with the next ISO date on every committed selection. Never fires with `null` (no deselect). */
  onValueChange?: (value: string | null) => void;
  /** Controlled visible month (ISO `yyyy-mm`). Wins over the initial month when defined. */
  month?: string;
  /** Fires with the next month key on every committed navigation. */
  onMonthChange?: (month: string) => void;
  /** Earliest selectable date (ISO `yyyy-mm-dd`). Earlier days render disabled. No default. */
  minDate?: string;
  /** Latest selectable date (ISO `yyyy-mm-dd`). Later days render disabled. No default. */
  maxDate?: string;
  /** Terminal: no selection, no navigation, no callbacks, announced as disabled. Default `false`. */
  disabled?: boolean;
  /** Accessible name source for the calendar container. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style: value or function of calendar state. */
  style?: StateStyle<CalendarState, StyleProp<ViewStyle>>;
  /** Day-cell style (every day pressable), caller-provided. */
  dayStyle?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the whole grid; selection
   * and navigation wiring travel in the props.
   */
  render?: RenderProp<CalendarState, SlotProps>;
  /** Forwarded to the root view. */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: CalendarProps["ref"],
  value: ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // A frozen ref object cannot take the write — leave it alone
      // rather than failing the render over it.
    }
  }
}

type DateParts = { year: number; monthIndex: number; day: number };
type MonthParts = { year: number; monthIndex: number };

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

/** Sunday-first weekday header labels, matching `getUTCDay` order. */
const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Strict ISO date parse with a UTC round-trip guard (`2026-02-30`
 * constructs to March, so the mismatch rejects it). Returns `null`
 * for anything invalid — never throws.
 */
function parseISODate(value: string | null | undefined): DateParts | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE_PATTERN.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, monthIndex: month - 1, day };
}

/** Strict month-key parse. Returns `null` for anything invalid — never throws. */
function parseMonthKey(value: string | null | undefined): MonthParts | null {
  if (typeof value !== "string") return null;
  const match = MONTH_PATTERN.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, monthIndex: month - 1 };
}

function toISODate(year: number, monthIndex: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toMonthKey(year: number, monthIndex: number): string {
  return `${String(year).padStart(4, "0")}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/** Month length via UTC overflow: day 0 of the next month is the last day of this one. */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Weekday of the first of the month (0 = Sunday), fixing the grid's leading blanks. */
function firstWeekday(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
}

/** Month arithmetic without date construction — plain year/month rollover. */
function shiftMonth(
  year: number,
  monthIndex: number,
  delta: 1 | -1,
): MonthParts {
  const total = year * 12 + monthIndex + delta;
  const nextYear = Math.floor(total / 12);
  return { year: nextYear, monthIndex: total - nextYear * 12 };
}

export function Calendar({
  value,
  defaultValue = null,
  onValueChange,
  month,
  onMonthChange,
  minDate,
  maxDate,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  dayStyle,
  render,
  ref,
}: CalendarProps): React.ReactNode {
  const [selected, setSelected] = useControllableState<string | null>(
    value,
    defaultValue,
    onValueChange,
  );

  // Frozen at mount: the fallback month for invalid stored keys must
  // not drift mid-session, and a stable reference keeps `goMonth`
  // honestly memoized below.
  const nowParts: MonthParts = useMemo(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), monthIndex: now.getUTCMonth() };
  }, []);
  const selectedParts = parseISODate(selected ?? null);
  const fallbackMonth = toMonthKey(nowParts.year, nowParts.monthIndex);
  const initialMonth =
    month ??
    (selectedParts !== null
      ? toMonthKey(selectedParts.year, selectedParts.monthIndex)
      : fallbackMonth);

  const [visibleMonth, setVisibleMonth] = useControllableState<string>(
    month,
    initialMonth,
    onMonthChange,
  );

  const visibleParts = parseMonthKey(visibleMonth) ?? nowParts;
  const visibleKey = toMonthKey(visibleParts.year, visibleParts.monthIndex);
  const selectedISO = selectedParts !== null ? selected : null;

  const minISO =
    parseISODate(minDate) !== null && typeof minDate === "string"
      ? minDate
      : null;
  const maxISO =
    parseISODate(maxDate) !== null && typeof maxDate === "string"
      ? maxDate
      : null;

  const goMonth = useCallback(
    (delta: 1 | -1) => {
      if (disabled) return;
      setVisibleMonth((previous) => {
        const parts = parseMonthKey(previous ?? null) ?? nowParts;
        const next = shiftMonth(parts.year, parts.monthIndex, delta);
        return toMonthKey(next.year, next.monthIndex);
      });
    },
    // `nowParts` is mount-frozen above, so depending on the whole
    // object is both honest and stable.
    [disabled, nowParts, setVisibleMonth],
  );

  const goPrevious = useCallback(() => {
    goMonth(-1);
  }, [goMonth]);

  const goNext = useCallback(() => {
    goMonth(1);
  }, [goMonth]);

  const selectDay = useCallback(
    (iso: string, dayDisabled: boolean) => {
      if (disabled || dayDisabled) return;
      setSelected(iso);
    },
    [disabled, setSelected],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const dayCount = daysInMonth(visibleParts.year, visibleParts.monthIndex);
  const leadingBlanks = firstWeekday(
    visibleParts.year,
    visibleParts.monthIndex,
  );
  const cells: (string | null)[] = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(toISODate(visibleParts.year, visibleParts.monthIndex, day));
  }

  const state: CalendarState = {
    value: selectedISO ?? null,
    month: visibleKey,
    disabled,
  };
  // Substitution entry point: `disabled` stays terminal (contract
  // §7); range clamping is the default grid's concern — a substituted
  // grid owns its own day enablement.
  const selectSubstitutedDay = (iso: string) => {
    selectDay(iso, false);
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      value: selectedISO ?? null,
      month: visibleKey,
      onValueChange: selectSubstitutedDay,
      onMonthChange: setVisibleMonth,
      onPreviousMonth: goPrevious,
      onNextMonth: goNext,
      dayStyle,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          accessibilityLabel="Previous month"
          testID={testID ? `${testID}-prev` : undefined}
          disabled={disabled}
          onPress={goPrevious}
        >
          <Text>{"<"}</Text>
        </Pressable>
        <Text testID={testID ? `${testID}-title` : undefined}>
          {visibleKey}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          accessibilityLabel="Next month"
          testID={testID ? `${testID}-next` : undefined}
          disabled={disabled}
          onPress={goNext}
        >
          <Text>{">"}</Text>
        </Pressable>
      </View>
      <View>
        {WEEKDAY_NAMES.map((name, index) => (
          <Text
            key={name}
            testID={testID ? `${testID}-weekday-${index}` : undefined}
          >
            {name}
          </Text>
        ))}
      </View>
      <View>
        {cells.map((iso, index) => {
          if (iso === null) {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: stateless positional placeholder.
              <View key={`blank-${index}`} accessible={false} />
            );
          }
          const dayNumber = Number(iso.slice(8, 10));
          const outOfRange =
            (minISO !== null && iso < minISO) ||
            (maxISO !== null && iso > maxISO);
          const dayDisabled = disabled || outOfRange;
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityState={{
                selected: iso === selectedISO,
                disabled: dayDisabled,
              }}
              accessibilityLabel={iso}
              testID={testID ? `${testID}-day-${iso}` : undefined}
              disabled={dayDisabled}
              onPress={() => {
                selectDay(iso, dayDisabled);
              }}
              style={dayStyle}
            >
              <Text>{dayNumber}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
