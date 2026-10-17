"@xoroh/axis": minor
---

Base UI parity for Select, Combobox, Tooltip, and Menu filter: new `collection` model (registry + match, consumed by Combobox filtering, menu filter parts, and select label lookup) and `typeahead` match model; compound `SelectRoot`/`Trigger`/`Value`/`Portal`/`Backdrop`/`Positioner`/`Popup`/`Arrow`/`Item`(+`label`)/`ItemText`/`ItemIndicator`/`Group`/`GroupLabel`/`Separator` with a root `items` label table; compound `TooltipRoot`/`Trigger`/`Portal`/`Positioner`/`Popup`/`Arrow` plus `TooltipProvider` delay groups and `delayLongPress`; menu `Input`/`Clear`/`Empty` filter parts with `filterText` on all item parts (compound roots only). Demos cover every new part. Not published.
