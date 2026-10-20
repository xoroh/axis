---
"@xoroh/axis": minor
---

0.1.0 Preview release:
- Complete ADR-112 `aria-only` accessibility contract rollout across all component families (TASK-128): zero legacy `accessibility*` props emitted; pure `role` and `aria-*` semantics.
- Compound anatomy for ContextMenu (`ContextMenuRoot`, `ContextMenuTrigger`, `ContextMenuPortal`, `ContextMenuPositioner`, `ContextMenuPopup`, `ContextMenuItem`, `ContextMenuSeparator`, `ContextMenuGroup`, `ContextMenuGroupLabel`, `ContextMenuCheckboxItem`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSubmenuRoot`, `ContextMenuSubmenuTrigger`) eliminating monolithic props (TASK-135).
- Compound anatomy for Toast (`ToastProvider`, `ToastPortal`, `ToastRoot`, `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`) with `toastQueue` imperative API and `onPress` dismissal handling (TASK-136).
- New `PreviewCard` compound family (`PreviewCardRoot`, `PreviewCardTrigger`, `PreviewCardPortal`, `PreviewCardBackdrop`, `PreviewCardPositioner`, `PreviewCardPopup`, `PreviewCardArrow`) with hover/tap delays and positioning offsets (TASK-105).
- Parity with `@rn-primitives/*` documented across all component tables in `docs/BASE_UI_PARITY.md` (TASK-97).
- Full device smoke CI validation on iOS simulator and Android emulator (TASK-134).
