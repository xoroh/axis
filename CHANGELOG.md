# Changelog

Notable changes to Axis will be documented here.

## Unreleased

Pre-1.0 scope cuts (ADR-012; no version bump, publish, or tag — release hold stands).
Each line is the migration for the removed/renamed export:

- `Search` removed — Kern rebuilds it on `Input` + `Field` + `Button`; no Axis replacement.
- `Loader` removed — use `Progress` with `value={null}` (indeterminate: busy announced, no value).
- `Text` removed — use RN `Text` directly with caller styles.
- `Trigger` removed — use `Button` for labelled actions, `Switch` for binary state, or RN `Pressable` for caller-owned semantics; `usePress`, `mergeSlotProps`, `SlotProps` stay exported.
- `Progress` `indeterminate` boolean removed — pass `value={null}` (Base UI exact semantics).
- `Textarea` removed — use `Input` with `multiline` (plus `autoGrow`, `minRows`/`maxRows`, `onHeightChange`); `<Textarea … />` migrates to `<Input multiline … />`.
- `Sheet` removed — use `Drawer` with `side="bottom"` and `snapPoints`; `<Sheet detents={d} snapIndex={i} onSnapIndexChange={f} title={t} … />` migrates to `<Drawer side="bottom" snapPoints={d} snapPoint={d[i]} onSnapPointChange={…} … />` with the title in `children`. `Drawer` also gains `modal` and `top` side.
- `Calendar` removed — use the `./models` `calendar` model (`buildCalendarGrid`, `resolveCalendarFocus`, `resolveCalendarSelection`, `isCalendarDateDisabled`, `parseCalendarDate`, locale/`firstDayOfWeek`/`dir` support); state stays with the consumer via `useControllableState`.
- `TimePicker` removed — the `time` model stays, and `TimePickerValue`/`TimePickerFormat` stay exported from it.
- `OtpField` capture input is now behavior-hidden but focusable (invisible 1×1); override with the new `inputStyle` prop.
- `Accordion` + `AccordionItem` (monoliths) removed — use compound `AccordionRoot` + `AccordionItem` (value identity) + `AccordionHeader` + `AccordionTrigger` + `AccordionPanel`; `multiple` (default `false`), `orientation` (default `"vertical"`).
- `Checkbox` (monolith) removed — use compound `CheckboxRoot` + `CheckboxIndicator`; `indeterminate` supported (`mixed` checked mapping).
- `Avatar` (monolith) removed — use compound `AvatarRoot` + `AvatarImage` + `AvatarFallback`; loading status `idle | loading | loaded | error`, fallback `delay`.
- `Meter` (monolith) removed — use compound `MeterRoot` + `MeterTrack` + `MeterIndicator` + `MeterLabel` + `MeterValue`; `value` is now required.
- `ToggleGroup` gains `multiple` (default `false` — single-press now replaces instead of accumulating; pass `multiple` for the old behavior) and `orientation` (default `"horizontal"`); `ToggleGroupState` gains both fields.
- `NumberField` monolith removed — use the compound `NumberFieldRoot` + `NumberFieldGroup` + `NumberFieldInput` + `NumberFieldDecrement`/`NumberFieldIncrement` (+ optional `NumberFieldScrubArea`); see `docs/components/number-field.md`.
- `calendar` model gains locale-aware names and week start (`resolveCalendarMonthNames`, `resolveLocaleFirstDay`), cross-month DST-safe arrow navigation, and the `time` model gains localized display parts (`formatTimeParts`) plus wrapping clock stepping (`addTimeMinutes`); see `docs/models/calendar.md` and `docs/models/time.md`.
- `Slider` (monolith) removed — use compound `SliderRoot` + `SliderLabel` + `SliderValue` + `SliderControl` + `SliderTrack` + `SliderIndicator` + `SliderThumb`; RN math moved to `./models` (`slider.ts`: `clampSliderValue`, `snapSliderValue`, `sliderValuePercent`, `normalizeSliderValues`, `resolveSliderCommit`, `nearestSliderThumbIndex`, `sliderRatioFromLocation`, `sliderValueFromRatio`).
