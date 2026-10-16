import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { mergeSlotProps, type SlotProps } from "./slot";

/**
 * The `render`-prop composition model — Base UI parity for element
 * substitution on React Native.
 *
 * Base UI parts accept `render` (an element or a function of props
 * and state) plus `className`/`style` as values or functions of
 * state. The merge itself is the shared `slot` model
 * (`mergeSlotProps`: part handler first, consumer style winning);
 * what lives here is the native-renderer application: resolving the
 * prop into a node.
 *
 * Rules, mirroring Base UI semantics where the platform allows:
 * - `render` absent → `null`, and the part renders its default host.
 * - element form → cloned with the part props merged UNDER the
 *   element's own props (consumer wins, except composed handlers).
 * - function form → called with `(props, state)`, where `props` are
 *   the part props to spread and `state` is the part's state object.
 * - `className` never reaches a host with a value: React Native warns
 *   on unknown props, and there is no stylesheet engine to consume
 *   it. It is overridden to `undefined` on the clone (documented
 *   deviation — state styling flows through function `style`/`render`
 *   props instead). `undefined` props are skipped by the renderer,
 *   so no warning fires.
 * - `style` accepts a value or a function of state (Base UI parity);
 *   `resolveStyle` applies it. Arrays merge caller-last, matching
 *   the slot rule.
 */

export type RenderProp<State, Props extends SlotProps> =
  | ReactElement
  | ((props: Props, state: State) => ReactNode);

export type StateStyle<State, Style> = Style | ((state: State) => Style);

/**
 * Apply a value-or-function style prop against part state.
 */
export function resolveStyle<State, Style>(
  style: StateStyle<State, Style> | undefined,
  state: State,
): Style | undefined {
  if (typeof style === "function") {
    return (style as (state: State) => Style)(state);
  }
  return style;
}

/**
 * Resolve a part's `render` prop into a node, or `null` when absent
 * (the part renders its default host). Never spreads `className`
 * onto the clone — see the module note.
 */
export function resolveRender<State, Props extends SlotProps>(
  render: RenderProp<State, Props> | undefined | null,
  partProps: Props,
  state: State,
): ReactNode {
  if (render === undefined || render === null) return null;
  if (typeof render === "function") {
    return render(partProps, state);
  }
  if (isValidElement(render)) {
    const merged = mergeSlotProps(
      partProps,
      (render.props ?? {}) as Partial<Props>,
    );
    // cloneElement re-merges the element's own props under the config,
    // so the className override must ride along explicitly — otherwise
    // the consumer's stylesheet class reaches the host and warns.
    const element = render as ReactElement<Record<string, unknown>>;
    return cloneElement(element, {
      ...(merged as Record<string, unknown>),
      className: undefined,
    });
  }
  return null;
}
