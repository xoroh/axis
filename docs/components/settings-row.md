## Settings Row

Source of truth: `SettingsRowProps` in `@xoroh/axis`.

Labeled row with a trailing control slot: `title` (required),
`description?`, `control?` (caller-owned Switch, value, chevron),
`onPress?` (detail navigation — absence renders a static row whose
control stays independently operable), `selected?`, `disabled?`,
`accessibilityLabel?` (defaults to the title when pressable),
`testID?`, `style?`, `titleStyle?`, `descriptionStyle?`, `ref`.
Pressable rows carry the button role with selected/disabled
states. Example: `<SettingsRow title="Wi-Fi"
description="Home network" onPress={openWifi} />`.
