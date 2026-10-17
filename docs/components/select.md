## Select

Source of truth: `SelectProps`, `SelectItemProps`, `SelectRootProps`, `SelectTriggerProps`, `SelectValueProps`, `SelectPortalProps`, `SelectBackdropProps`, `SelectPositionerProps`, `SelectPopupProps`, `SelectArrowProps`, `SelectItemTextProps`, `SelectItemIndicatorProps`, `SelectGroupProps`, `SelectGroupLabelProps`, `SelectSeparatorProps` in `@xoroh/axis`.

Single-select dropdown: `value?: string | null`,
`defaultValue?`, `onValueChange?`, `open?`, `defaultOpen?`,
`onOpenChange?`, `placeholder?` (ReactNode, shown when empty),
`disabled?`, `accessibilityLabel?`, `testID?`, `style?` (trigger),
`listStyle?`, `children` (SelectItems, required), `ref`.
Trigger shows current label or placeholder with expanded state;
list positioned with floating placement + scrim dismiss; option
press selects + closes (re-press keeps, no extra fire). No
filtering (that's Combobox), no multi. All optional except
`children`.

`SelectItemProps`: `value: string` (required), `label?` (display
label for the trigger lookup — defaults to string children,
direct or in one `SelectItemText`, else the raw value),
`disabled?`, `accessibilityLabel?`, `testID?`, `style?`
(value-or-function of `{selected, disabled, highlighted}`),
`children?`, `render?`; role `option` with selected state where
supported, else button with selected state (verified per platform
types, documented in-file).

Compound form (Base UI parity — same names, same state
semantics): `SelectRoot` (`value?`/`defaultValue?`/
`onValueChange?`, `open?`/`defaultOpen?`/`onOpenChange?`/
`onDismiss?`, `modal?` (default true), `disablePointerDismissal?`,
`disabled?` (terminal — forces the list closed), `items?`
(value-label table for closed-list display — items unmount with
a closed list, so pass `items` for the label to show; live
registrations win while mounted); renders no element) with
`SelectTrigger` (button role, expanded state,
anchor-registering), `SelectValue` (`placeholder?`, function
children for formatting), `SelectPortal` (RN `Modal` host, in-box
when non-modal), `SelectBackdrop` (scrim), `SelectPositioner`
(`side?`/`align?`/`sideOffset?`/`alignOffset?`, measured against
the trigger), `SelectPopup` (listbox role), `SelectArrow`
(caller-positioned marker), `SelectItem` (shared with the
monolith), `SelectItemText`, `SelectItemIndicator` (renders only
while selected), `SelectGroup`/`SelectGroupLabel`,
`SelectSeparator`. Every part takes `render` (element or
`(props, state)` function) and value-or-function `style`;
`data-*` attributes are deliberately absent on native (contract
§11). Base UI pieces omitted with reason in the parity record:
no `Label` (trigger `accessibilityLabel`), no `Icon` (compose
into `Trigger`), no `List` (the popup is the list container), no
scroll arrows (Base hides them on touch), no
`alignItemWithTrigger` (Base disables it for touch), no
`multiple`/form props, no hardware-keyboard typeahead (registry
exists for adoption; none yet). Example:

```tsx
<SelectRoot items={[{ value: "date", label: "Date" }]}>
  <SelectTrigger accessibilityLabel="Sort by">
    <SelectValue placeholder="Sort by" />
  </SelectTrigger>
  <SelectPortal>
    <SelectBackdrop />
    <SelectPositioner side="bottom" align="start">
      <SelectPopup>
        <SelectItem value="date" testID="sort-date">
          <SelectItemText>Date</SelectItemText>
          <SelectItemIndicator><Text>✓</Text></SelectItemIndicator>
        </SelectItem>
      </SelectPopup>
    </SelectPositioner>
  </SelectPortal>
</SelectRoot>
```
