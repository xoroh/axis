# What Kern M3 needs from @xoroh/axis
Read-only analysis. kern main f887255 (#58), axis main 7c97560 (#51). Date: 2026-10-16.

## Headline findings
1. **Kern pins a stale Axis.** All three consumers use `vendor/axis/axis-bed35547.tgz`, which is Axis PR #11, 77 commits behind main: packages/kern/package.json:119, packages/kern-native/package.json:64, apps/site/package.json:51, and kern-cli/src/init.ts:156 writes it into user projects. Kern can't use ./models, the chat models or anything later until this is fixed.
2. **Kern uses Axis only for low-level helpers, never for its components.** There are 44 imports, all of them hooks or pure functions (useControllableState ×20, useSelection, useRovingModel, dismiss*, overlayModality, positioning, portal, press, presence, slot, time). Axis already ships Dialog, Select, Menu, Toast, Slider, Tooltip, Calendar, TimePicker and more (axis/packages/axis/src/components), and Kern uses none of them.
3. **Web Kern is built on Base UI, not Axis.** There are about 50 `@base-ui/react/*` imports across 36 parts (menu, dialog, toast, select, combobox, slider, tooltip and others). Native Kern rebuilds overlays itself with RN `<Modal>` in 13 files.
4. libs/kern-primitives is no longer imported by any code. Only comments mention it (kern/src/components/web-behavior.ts:4, kern/src/utils/assignRef.ts:14, kern-native/src/components/pressable.tsx:46), plus apps/site/scripts/check-primitives-docs.mjs. **That means deleting it is not blocked on the Kern side.**

## P0: blocks Kern M3 from building on Axis at all
### P0-1 Shared overlay/portal host for native, with a dismissable layer (PortalHost + Overlay root)
- Why: every M3 menu, dialog, sheet, select, combobox and FAB menu needs the same modal, dismiss, focus-return and stacking behavior on both platforms.
- Call sites: RN `<Modal>` at kern-native sheet-surface.tsx:189, combobox.tsx:238, overlay-surfaces.tsx:252, select.tsx:101, fab-menu.tsx:122, navigation-drawer.tsx:93, context-menu.tsx:66, split-button.tsx:225, alert-dialog.tsx:74, sheet.tsx:63, menu.tsx:71, menubar.tsx:80, dialog.tsx:94. Portal registry built by hand: kern-native presentation.tsx:23,90,106 and kern/presentation.tsx:21,130,175 (react-dom createPortal).
- Workaround: each file wires createDismissPolicy, shouldDismissOn and useOverlayRegistration itself, and sets focus manually with AccessibilityInfo.setAccessibilityFocus (sheet-surface.tsx:155).
- Proposed API: `<PortalHost name?>` plus `<Overlay.Root open onOpenChange modal dismiss={{escape,outsidePress,back}} initialFocus finalFocus>` and `<Overlay.Portal host?>`. Native uses BackHandler and accessibility focus; web uses inert and scroll lock. Return a stack index for z-order and scrim.
### P0-2 Toast queue + viewport (both platforms)
- Why: an M3 snackbar shows one at a time and needs a queue, auto-dismiss timing, pause on hover/focus/screen reader, an action and swipe.
- Call sites: web kern/snackbar.tsx:1 and kern/sonner.tsx:1 (Base UI Toast). Native kern-native/snackbar.tsx has no queue and no timer at all; it's a static Pressable view (lines 1-4).
- Proposed API: `createToastManager({limit:1, timeout})` → `{add, update, close, promise}` + `useToastQueue()` + `<Toast.Viewport>`/`<Toast.Root>` with `render`. The queue model is pure, so it can be shared by web and native.
### P0-3 Base UI-aligned `render` prop on every Axis part (Axis #53)
- Why: Kern styles parts by passing the M3 element and reads state such as data-pressed and data-open. Without this, Kern can't move off Base UI on web.
- Workaround: casts in kern/button.tsx:568 (`anchorProps as unknown as ComponentPropsWithRef<"a">`) and kern/command.tsx:69 (`options as unknown as CommandOption[]`). The native button uses mergeSlotProps/SlotProps (kern-native button.tsx:1, icon-button.tsx:1-5).
- Proposed API: `render?: ReactElement | (props, state) => ReactElement`, `className`/`style` as `(state)=>…`, state prop names matching Base UI (decision 6).
### P0-4 Republish/pin process for Axis main
- Proposed: publish @xoroh/axis to a local registry/tarball per Axis release, with Kern Renovate-style bumps. Remove the hard-coded tarball in kern-cli init.ts:156.

## P1: M3 components with no Axis behavior today
### P1-1 Slider model (drag, keyboard, steps, range, RTL)
- Native kern-native/slider.tsx:131-139 does its own responder math (`locationX / width`). It has no RTL handling, no thumb hit target and only a limited accessibilityAction. Web uses Base UI slider (kern/slider.tsx:1).
- Proposed: `useSliderModel({value, min, max, step, minStepsBetween, dir})` → `{thumbs, getValueFromPosition, keyHandlers, a11yProps}` + Axis Slider parts with `render`.
### P1-2 Date model / calendar grid
- Both calendars are hand-rolled with local state: kern/calendar.tsx:1-4, kern-native/calendar.tsx:62-65. There's no shared month grid, week start, locale, min/max, range, or roving grid focus.
- Proposed: `useCalendarGrid({value, defaultValue, locale, weekStartsOn, min, max, mode:'single'|'range'})` → weeks/cells/keyboard (grid roving), plus a DateField segment model.
### P1-3 Time-picker dial
- Web kern/time-picker.tsx:302-585 does rAF focus juggling and getBoundingClientRect angle math by hand (lines 302, 327, 537, 574, 585). Native time-picker.tsx:1-10 already uses Axis time helpers.
- Proposed: `useClockDial({mode:'hour'|'minute', format})` → angle↔value, pointer and keyboard handlers, focus-target management.
### P1-4 Select/Combobox/Menu/Tooltip parity (planned Axis work)
- Web uses Base UI: kern/menu-family.tsx, select.tsx, combobox.tsx, tooltip.tsx:1, context-menu, menubar. Native hand-builds these: select.tsx:101, combobox.tsx:238, menu.tsx:71, menubar.tsx:80, context-menu.tsx:66, tooltip.tsx:1-5 (only controllable state; no delay group, long-press or anchoring).
- Needs: typeahead, a collection model with virtualization hooks, anchored positioning with flip/shift on native (measureInWindow), submenus, and tooltip delay groups plus long-press on native.
### P1-5 Press/hover/focus-visible state source for M3 state layers
- The M3 state layer reads hovered, focused (keyboard only), pressed and dragged. Native components derive this from Pressable state; only 4 files handle hover or focus. Web keeps the key list in web-behavior.ts:14 (isPressActivationKey).
- Proposed: `usePress` returns `{hovered, pressed, focusVisible, dragged}` on both platforms, plus `data-*` attributes through render.
### P1-6 Presence/animation on native
- Web uses usePresence (kern/presentation.tsx:33). Native animates with Animated.timing directly (loading-indicator, linear-progress, circular-progress, success-transform) and has no exit-animation presence for overlays.
- Proposed: native `usePresence` with an `onExitComplete` contract and a reduced-motion flag (currently read by hand in loading-indicator.tsx via AccessibilityInfo.isReduceMotionEnabled).

## P2: polish and newer work
- P2-1 Carousel: web kern/carousel.tsx doesn't use Axis; native uses useRovingModel only. Proposed: `useCarousel` (snap index, keyboard, autoplay with pause).
- P2-2 Sheet and drawer gestures: drag-to-dismiss and snap points for the M3 bottom sheet (kern/sheet-family.tsx:1 uses Base UI Dialog plus Axis dismiss; native sheet-surface.tsx).
- P2-3 VisuallyHidden: VISUALLY_HIDDEN_STYLE in kern web-behavior.ts:21. Fine to keep in Kern, but Axis could export a cross-platform `<VisuallyHidden>`.
- P2-4 AI chat: Kern doesn't use any of the new ./models chat hooks yet because of P0-4. Once the pin is fixed, Kern M3 chat parts need a `render` prop on chat parts and a native-compatible useStickToBottom.
- P2-5 Scroll area: web uses Base UI scroll-area; Axis has no equivalent.

## Suggested order for Axis
P0-4 (unpin) → P0-3 (#53 render) → P0-1 (PortalHost/Overlay) → P0-2 (Toast) → P1-4 parity → P1-1 Slider → P1-5 press state → P1-2/3 date/time → P2.
