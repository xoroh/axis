# Device pass checklist

Phone pass for the Axis example app (`apps/example`, demo list on the home
screen under the "Axis examples" header). Run on a physical iPhone
(VoiceOver) and a physical Android phone (TalkBack) — the CI device jobs
(`.github/workflows/device.yml`, artifacts `ios-home` / `android-home`)
prove the app boots and reaches the home screen on simulator/emulator, but
they cannot hear announcements. This checklist is the hearing part.

Build under test: a debug build from the branch under review, with Metro
running (same setup as `device.yml`). Re-run the whole pass after any
announcement change.

> **Aria-only note (ADR-112).** Announcement checks run on the post-ADR-112
> build: parts set state and value ONLY through `aria-*` props
> (`aria-checked`, `aria-selected`, `aria-expanded`, `aria-busy`,
> `aria-valuemin/max/now/text`, `aria-orientation`, `aria-disabled`,
> `aria-label`, `aria-labelledby`, `aria-hidden`, `aria-live`) with `role`,
> never the legacy `accessibilityState` / `accessibilityValue` /
> `accessibilityLabel` / `accessibilityRole` twins. If a check below hears
> no state at all, suspect a missing aria prop before suspecting the OS.
> The Switch `aria-valuetext` `"on"` / `"off"` default (controls-D11,
> TASK-128) lands in the aria-only rollout, not before: until then the
> Switch rows expect checked/unchecked only.

Setup on each phone, before starting:

- Screen reader on (VoiceOver: Settings → Accessibility; TalkBack:
  Settings → Accessibility). Same pass twice, once per reader.
- Font size: run every family once at default size and once at the
  largest accessibility size (VoiceOver: Larger Text max; TalkBack:
  Font size Huge + Display size Large). No clipped labels, no
  overlapped controls.
- RTL: run every family once in an RTL layout (device language
  Arabic/Hebrew, or Force RTL layout direction). Order mirrors, nothing
  clips, Slider/drag directions still match the visual fill.
- Dark mode: run the pass in both appearances at least on the home
  screen and one overlay (Dialog) — text stays legible.

How to mark: put `x` in Pass (heard/saw exactly the expected result) or
in Fail (anything else — note the device, OS version and what was heard
instead).

## Universal checks (every demo screen)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| U1 | Home screen swipe-through | "Axis examples" header, "Select a component family" hint, then each family name as a button ("Open … demo") in list order, no duplicates, no dead ends | | |
| U2 | Focus order | Swipe order follows the visual order top-to-bottom; no focus traps; no invisible focus stops (a stop with no announcement is a fail) | | |
| U3 | Overlay dismissal | Every popup/menu/dialog/toast demo: backdrop tap dismisses; `Esc`/close control dismisses; focus returns to the trigger | | |
| U4 | Android back button | Every overlay dismisses on back; on the home screen back backgrounds the app (never a crash, never a stuck blank screen) | | |
| U5 | Keyboard avoidance | Any screen with a text field (Entry, Menu search, List select search): opening the keyboard never covers the focused field or its label/error | | |
| U6 | RTL layout | Mirrored order, Slider fill and thumb track the finger, no clipped text at default font size | | |
| U7 | Largest font | No clipped labels, no overlapping controls, overlay titles wrap instead of truncating meaning | | |

## 1. Switch demo (`Switch`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| S1 | Toggle on/off | VoiceOver: "… Switch button, on/off" (or "checked/unchecked"); TalkBack: "… Switch, on/off". State change announced on each toggle | | |
| S2 | Disabled switch | Announced dimmed/disabled; activating does nothing, no state change | | |
| S3 | Largest font + RTL | Label and track stay aligned, state still announced | | |

Note: after TASK-128 the switch also reports `aria-valuetext` `"on"` /
`"off"` — then expect the literal words "on"/"off" in the announcement.

## 2. Button demo (`Button`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| B1 | Button name | Each button announces its label + "button" (VoiceOver) / "Button" (TalkBack) | | |
| B2 | Disabled button | Announced disabled; activation does nothing | | |
| B3 | Largest font | Labels wrap, hit targets stay ≥ 44pt | | |

## 3. Dialog demo (`Dialog*`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| D1 | Open | Trigger announces "… button"; popup announces the dialog title + "dialog" on open | | |
| D2 | Focus order | Title → description → actions → close; background content is not reachable while open | | |
| D3 | Dismissal | Backdrop tap, close button and Android back all dismiss; focus returns to the trigger | | |
| D4 | Largest font | Title and actions wrap; no clipped buttons | | |

## 4. Disclosure demo (`Accordion*`, `Collapsible*`, `Tabs*`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| A1 | Accordion trigger | "… button, expanded/collapsed" toggles on activation | | |
| A2 | Accordion panel | Panel content reachable only while expanded; nothing focusable leaks when collapsed (keepMounted hides from AT) | | |
| A3 | Collapsible | Same expanded/collapsed contract as A1 on its trigger | | |
| A4 | Tabs | Tab list announces each tab; selected tab announced "selected"; panel content switches and is announced | | |

## 5. Display demo (`Avatar*`, `Meter*`, `Progress`, `Separator`, `Table*`, `Toolbar`, `AspectRatio`, `Label`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| DP1 | Avatar | Loaded avatar announces its accessible name + "image"; fallback announces the fallback text, never a broken-image silence | | |
| DP2 | Meter | Announces label + value ("… 70 percent" or the caller's text); no value announced for indeterminate | | |
| DP3 | Progress | Determinate: label + percent; indeterminate: busy/indeterminate announced, no percent | | |
| DP4 | Separator | Not focusable, never announced (decorative) | | |
| DP5 | Table | Headers announced as headers; row order matches the visual order | | |
| DP6 | Toolbar | Container announces "toolbar"; inner controls keep their own names/roles | | |
| DP7 | Largest font | Meter/Progress labels do not clip; table columns do not overlap | | |

## 6. Dropdown demo (`DropdownMenu*`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| DD1 | Open | Trigger "… button"; menu announces "menu" on open | | |
| DD2 | Items | Each item announces name + "menu item"; submenu trigger hints at the submenu | | |
| DD3 | Dismissal | Backdrop tap, selection and Android back close; focus returns to the trigger | | |

## 7. Entry demo (`Input`, `NumberField*`, `OtpField`, `Field`, `Fieldset`, `Label`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| E1 | Label linkage | Focusing the input announces the label text as its name (via `nativeID` linkage), not "text field" alone | | |
| E2 | Error | Invalid input announces the error text (polite live region) without moving focus | | |
| E3 | NumberField | Field announces "… adjustable" + current value; increment/decrement buttons announce and step the value | | |
| E4 | OtpField | Each cell announces its position; completed code announces the full value | | |
| E5 | Keyboard avoidance | Keyboard never covers the focused field, its label or its error (U5 concretely) | | |
| E6 | Largest font + RTL | Labels, fields and errors do not clip or overlap | | |

## 8. List select demo (`Select*`, `Combobox`, `Autocomplete`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| L1 | Trigger | "… button" + current value (or placeholder) | | |
| L2 | Listbox | List announces "listbox" on open; each option announces name + "selected" only when selected | | |
| L3 | Search (Combobox/Autocomplete) | Typed text filters options; TalkBack/VoiceOver tracks the filtered list, keyboard stays usable (U5) | | |
| L4 | Dismissal | Selection, backdrop tap and Android back close; focus returns to the trigger with the new value announced | | |

## 9. Menu demo (`Menu*`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| M1 | Open | Trigger "… button"; popup announces "menu" | | |
| M2 | Items | Plain items: name + "menu item". Checkbox items: name + checked/unchecked. Radio items: name + checked. Link items: name + "link". Group labels: announced as group context, not focusable | | |
| M3 | Search input | Filtered items tracked by the reader; keyboard usable (U5) | | |
| M4 | Dismissal | Selection, backdrop tap and Android back close; focus returns to the trigger | | |

## 10. Overlays demo (`AlertDialog`, `Drawer`, `Toast*`, `Portal*`, `Overlay*`, `Tooltip*`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| O1 | AlertDialog | Title + "dialog" on open; destructive action distinguishable by name; cancel/backdrop/back dismiss; focus returns to the trigger | | |
| O2 | Drawer | "Dialog" announced on open; swipe/backdrop/back dismiss; background unreachable while open | | |
| O3 | Toast | Message announced politely on appearance without stealing focus; action button (if any) reachable and named | | |
| O4 | Tooltip | Trigger hint announces; tooltip text announced on long-press / focus, never traps focus | | |
| O5 | Portal | Portal content order in the swipe sequence matches the visual order | | |

## 11. Popovers demo (`Popover*`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| P1 | Open | Trigger "… button"; popup announces title + description | | |
| P2 | Focus order | Title → content → close; background unreachable while open | | |
| P3 | Dismissal | Close button, backdrop tap and Android back dismiss; focus returns to the trigger | | |

## 12. Ranges demo (`Slider`, calendar grid)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| R1 | Thumb | "… slider" + current value; VoiceOver swipe up/down (TalkBack equivalent gesture) steps the value and announces each step | | |
| R2 | Range | Minimum thumb announces its name ("Minimum price") + value; maximum thumb likewise; values never cross | | |
| R3 | Disabled slider | Announced disabled; gestures and actions do nothing | | |
| R4 | Vertical + RTL | Vertical thumb tracks the finger; RTL mirrors without breaking the value mapping | | |
| R5 | Calendar grid | Each day cell announces its date; selected range endpoints announced; month navigation buttons named ("Previous/Next month") | | |

## 13. Selection demo (`Checkbox*`, `RadioGroup*`, `Toggle`, `ToggleGroup*`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| SL1 | Checkbox | Name + checked/unchecked; indeterminate announces "mixed" | | |
| SL2 | CheckboxGroup | Group name announced, then each item with its own state | | |
| SL3 | RadioGroup | Group name announced; each item name + checked (only the selected one); selection replaces, never clears to nothing | | |
| SL4 | Toggle | Name + selected/not-selected (pressed-ness is `selected`: RN has no `pressed` state) | | |
| SL5 | ToggleGroup | Each item name + selected; single replaces, multiple toggles membership | | |

## 14. Bars demo (`NavigationMenu*`, `Menubar*`)

| # | Check | Expected result | Pass | Fail |
|---|---|---|---|---|
| N1 | Triggers | Each bar trigger announces name + "button" | | |
| N2 | Panels | Open panel content announced; only one panel open at a time | | |
| N3 | Dismissal | Backdrop tap, re-activation and Android back close; focus returns to the trigger | | |

---

Sign-off: device model + OS version (iOS ___, Android ___), branch + head
SHA ___, date ___. Every Fail gets a follow-up item (component, what was
heard, device/OS) before the release-ready bar is ticked.
