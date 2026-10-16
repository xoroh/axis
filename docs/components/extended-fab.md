## Extended Fab

Source of truth: `ExtendedFabProps` in `@xoroh/axis`.

Extended floating action button: leading `icon?` beside visible
text `children`, same press/disabled/busy semantics as `Fab`.
The visible text names the control, so `accessibilityLabel?` is
optional (provide one only when the text is not the name).
Example: `<ExtendedFab onPress={create}>Create note</ExtendedFab>`.
