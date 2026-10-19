# Changelog

Notable changes to Axis will be documented here.

## Unreleased

Naming rule (contract §2; Base UI 1.9.0 anatomy — no version bump, publish, or tag; release hold stands).
Every export follows one rule: `XRoot` plus `X<Part>` where Base UI has `X.Root` with siblings (no bare `X`
monoliths — composites belong in Kern); bare where Base UI is bare; types follow their component
(`XRootProps`/`XRootState`). One line per rename (`old` → `new`; `—` means removed outright, no replacement
export — move call sites onto the listed compound parts):

- `Tabs` → `TabsRoot` (+`TabsRootProps`/`TabsRootState`), `Collapsible` → `CollapsibleRoot` (+Root types), `NavigationMenu` → `NavigationMenuRoot` (+Root types), `DropdownMenu` → `DropdownMenuRoot` (+Root types), `ContextMenu` → `ContextMenuRoot` (+Root types), `Table` → `TableRoot` (+`TableRootProps`), `Toast` → `ToastRoot` (+Root types; `ToastProvider`/`ToastViewport`/`useToast` unchanged).
- `Switch` → `SwitchRoot` (+Root types) + new `SwitchThumb` (+`SwitchThumbProps`/`SwitchThumbState`); `Progress` → `ProgressRoot` (+Root types) + new `ProgressTrack`/`ProgressIndicator`/`ProgressLabel`/`ProgressValue` (+their Props/State); `Field` → `FieldRoot` (+Root types) + new `FieldLabel`/`FieldControl`/`FieldDescription`/`FieldError` (+Props); `Fieldset` → `FieldsetRoot` (+`FieldsetRootProps`) + new `FieldsetLegend` (+Props); `Toolbar` → `ToolbarRoot` (+Root types; state gains `orientation`) + new `ToolbarButton`/`ToolbarLink`/`ToolbarGroup`/`ToolbarInput`/`ToolbarSeparator` (+their Props/State).
- `Dialog` — (+`DialogProps`, never in the barrel), `Popover` + `PopoverProps`, `Select` + `SelectProps`, `Tooltip` + `TooltipProps` + `TooltipState`, `Menu` + `MenuProps` — use the compound `DialogRoot`/`PopoverRoot`/`SelectRoot`/`TooltipRoot`/`MenuRoot` parts instead (same names as Base UI).
- `RadioGroupItem` → `RadioRoot` (+`RadioRootProps`/`RadioRootState`) + new `RadioIndicator` (+Props/State); `ToggleGroupItem` (+Props/State) → `Toggle` with `value` (group joins; valueless `Toggle` stays standalone); `CheckboxState` → `CheckboxRootState`.
- Bare stays bare (rule b): `Button`, `Input`, `Toggle`, `ToggleGroup`, `RadioGroup`, `CheckboxGroup`, `Separator`, `Menubar` (with `MenubarMenu`), `Label`, `Portal`, `AspectRatio`. Untouched lanes: `Slider`, `AlertDialog`, `Drawer`, `Combobox`, `Autocomplete`, `OtpField`.

Pre-1.0 scope cuts (ADR-012; no version bump, publish, or tag — release hold stands).
Each line is the migration for the removed/renamed export:

- `Search` removed — Kern rebuilds it on `Input` + `FieldRoot` + `Button`; no Axis replacement.
- `Loader` removed — use `ProgressRoot` with `value={null}` (indeterminate: busy announced, no value).
- `Text` removed — use RN `Text` directly with caller styles.
- `Trigger` removed — use `Button` for labelled actions, `SwitchRoot` for binary state, or RN `Pressable` for caller-owned semantics; `usePress`, `mergeSlotProps`, `SlotProps` stay exported.
- `ProgressRoot` `indeterminate` boolean removed — pass `value={null}` (Base UI exact semantics).
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
- `SelectRoot` + `SelectValue` gain `multiple` (default `false` — choosing toggles membership without closing; `onValueChange` reports the full array, the trigger joins the labels); `SelectPositioner` aligns the selected item over the trigger by default (`alignItemWithTrigger`, Base UI parity — falls back to trigger anchoring with no selection); new `SelectScrollUpArrow`/`SelectScrollDownArrow` parts jump a caller-provided scroller to either end of a long list; see `docs/components/select.md`.
