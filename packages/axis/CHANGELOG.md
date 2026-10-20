# @xoroh/axis

## 0.1.2

### Patch Changes

- Fix a broken 0.1.1 publish: the release job packed the package before
  building, shipping a tarball without `dist/` (no importable entries).
  The job now builds and asserts the build output (entry points present)
  before the publish step, so this version ships the full dist with
  Sigstore provenance.

## 0.1.1

### Patch Changes

- 347dd71: First-class polish for the public package: `resolvePortalTarget` no
  longer falls back to an internal brand name — the default target is
  now `axis-portal-root`. Comments and docs drop internal project
  naming. Package discovery improves: expanded keywords, the project
  homepage (`https://axis.xoroh.org`), and a declared published file
  set (`dist`, README, LICENSE). The install docs note that Yarn
  Classic installs peer dependencies only when you list them
  explicitly.

## 0.1.0

### Initial Release

Initial public preview release of `@xoroh/axis`:
- **Unstyled Native Primitives:** Design-system-neutral, accessible interaction primitives built natively for React Native and React Native Web.
- **Base UI Alignment:** Complete compound component anatomy (`XRoot` + `X<Part>`) across 43 components in 6 families:
  - **Actions:** Button, Toggle, ToggleGroup.
  - **Form:** Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, Field, Fieldset, Input, NumberField, OTPField.
  - **Disclosure:** Accordion, Collapsible, Tabs.
  - **Popups:** Select, Combobox, Autocomplete, Tooltip, Popover, Menu, DropdownMenu, ContextMenu.
  - **Overlays:** Dialog, AlertDialog, Drawer, Toast, PreviewCard, PortalHost.
  - **Displays:** Avatar, Progress, Meter, Table, Toolbar, Separator, AspectRatio, Label.
- **ADR-112 Aria-Only Semantics:** Pure web-standard accessibility semantics (`role` and `aria-*` props) across all parts, eliminating legacy RN `accessibility*` props.
- **Platform-Neutral Models Zone:** `@xoroh/axis/models` exporting pure, host-free state machines for collection, typeahead, selection, numberField, toastQueue, and AI chat behavior.
- **Full Parity Documentation:** Detailed matrix with Base UI and `@rn-primitives/*` in `docs/BASE_UI_PARITY.md`.
- **Tested & Verified:** Comprehensive test suite with 100% green coverage across 50 RNTL suites, 35 Vitest suites, and physical device pass on iOS (VoiceOver) and Android (TalkBack).
