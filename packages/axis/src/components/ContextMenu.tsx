import {
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useRef,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { Placement } from "../positioning";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { Portal } from "./Portal";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * ContextMenuRoot — a long-press popup menu.
 *
 * Structure mirrors `Tooltip` (anchor wrapper + measured floating
 * box + scrim, the box and scrim presenting through `Portal` at the
 * app's `PortalHost`), not `MenuRoot`: menu items here are caller content, not
 * `MenuItem` parts (those require `MenuRoot` context). Long-press opens;
 * scrim press or a second long-press dismisses through `onDismiss` +
 * `onOpenChange(false)` (the `Dialog` dismissal precedent). The box
 * positions below the anchor — press-point positioning is deferred,
 * documented, and not faked. No submenus, no animation.
 */

export type ContextMenuRootState = {
  /** Whether the menu is currently open. */
  open: boolean;
};

export type ContextMenuRootProps = {
  /** Anchor content. Long-press opens the menu. */
  children: ReactNode;
  /** Menu body content. */
  content: ReactNode;
  /** Controlled visibility. */
  open?: boolean;
  /** Uncontrolled initial visibility. Default `false`. */
  defaultOpen?: boolean;
  /** Fires on every visibility change. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /** Preferred side. Default `"bottom"`. Clamped into the viewport. */
  placement?: Placement;
  /** Accessible name source for the menu region (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Anchor wrapper style: value or function of menu state. */
  style?: StateStyle<ContextMenuRootState, StyleProp<ViewStyle>>;
  /** Menu box style, caller-provided. */
  menuStyle?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the anchor wrapper (anchor
   * plus menu); long-press and dismissal wiring travel in the props.
   */
  render?: RenderProp<ContextMenuRootState, SlotProps>;
  /** Forwarded to the anchor wrapper host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

function assignRef(
  ref: ContextMenuRootProps["ref"],
  value: ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // A frozen ref object cannot take the write — leave it alone
      // rather than failing the render over it.
    }
  }
}

export function ContextMenuRoot({
  children,
  content,
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  placement,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  menuStyle,
  render,
  ref,
}: ContextMenuRootProps): React.ReactNode {
  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      anchorHostRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const floating = useFloatingPlacement({
    anchorRef: anchorHostRef,
    placement,
    active: isOpen ?? false,
  });

  const dismiss = useCallback(() => {
    onDismiss?.();
    setOpen(false);
  }, [onDismiss, setOpen]);

  const toggle = useCallback(() => {
    setOpen((previous) => !(previous ?? false));
  }, [setOpen]);

  const state: ContextMenuRootState = { open: isOpen ?? false };
  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      onLongPress: toggle,
      onDismiss: dismiss,
      open: isOpen ?? false,
      content,
      menuStyle,
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {}),
      children,
      ref: setAnchorRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setAnchorRef} style={resolveStyle(style, state)} testID={testID}>
      <Pressable onLongPress={toggle}>{children}</Pressable>
      {isOpen ? (
        <Portal>
          <Pressable
            aria-label="Dismiss menu"
            onPress={dismiss}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            }}
            testID={testID ? `${testID}-scrim` : undefined}
          />
          <View
            accessible
            role="menu"
            {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
            {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
            onLayout={floating.onContentLayout}
            style={[floating.style, menuStyle]}
          >
            {content}
          </View>
        </Portal>
      ) : null}
    </View>
  );
}
