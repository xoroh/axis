---
"@xoroh/axis": minor
---

Base UI parity for Select, Combobox, Tooltip, and Menu: new `collection` model (registry + match, consumed by Combobox filtering, menu filter parts, and select label lookup) and `typeahead` match model with key event plumbing (`onKeyDown`/`onKeyPress`) in `SelectPopup` and `MenuPopup`; compound `SelectRoot`/`Trigger`/`Value`/`Portal`/`Backdrop`/`Positioner`/`Popup`/`Arrow`/`Item`(+`label`)/`ItemText`/`ItemIndicator`/`Group`/`GroupLabel`/`Separator` with root `items` label table and viewport edge flip; compound `TooltipRoot`/`Trigger`/`Portal`/`Positioner`/`Popup`/`Arrow` with viewport edge flip and `TooltipProvider` delay groups (`delay`/`closeDelay`); Menu filter parts (`MenuInput`/`MenuClear`/`MenuEmpty`) with `filterText` and compound submenu cascade (`MenuSubmenuRoot`/`MenuSubmenuTrigger`/`MenuSubmenuContent`). Demos cover every part. Not published.
