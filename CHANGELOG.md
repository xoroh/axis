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
