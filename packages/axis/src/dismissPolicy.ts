/**
 * The dismissal POLICY for a kern surface — what closes it, and whether a
 * visible close affordance must be rendered.
 *
 * ## Why this is a primitive
 *
 * P2c-2 §3 Wave 1: give behaviour that exists on BOTH renderers with
 * independent implementations one owner. Dismissal is that behaviour.
 *
 * The native `SheetSurface` already encodes the rule in one line, with a
 * comment recording the defect it fixed:
 *
 *     // a sheet that declares `dismissible` but renders no close control for it
 *     const showClose = dismissible ?? Boolean(onDismiss);
 *
 * The web `SheetSurface` encodes the same decision differently — the close
 * button is rendered when `onClose` is passed. Both are one rule wearing two
 * renderers, which is the `useControllableState` failure mode repeating: a fix
 * to one silently does not reach the other.
 *
 * ## What is genuinely shared, and what is not
 *
 * The POLICY is shared and belongs here: which triggers dismiss, and whether a
 * close affordance must exist. The TRIGGERS are not — a scrim `Pressable` and a
 * `Portal`/`Backdrop` are DOM, `onRequestClose` and hardware back are RN. So
 * this returns the decisions, and each renderer wires its own triggers to them.
 *
 * That split is what keeps it a primitive rather than contract data: a rule both
 * renderers must apply identically, with no platform type in sight.
 */

/** How a surface is dismissed. Each renderer binds its own triggers to these. */
export type DismissTriggers = {
  /** The scrim/backdrop outside the surface was pressed. */
  scrim?: boolean;
  /** Escape (web) or the hardware/gesture back (native). */
  escape?: boolean;
  /** A visible close affordance was activated. */
  closeButton?: boolean;
};

export type DismissPolicyOptions = {
  /**
   * Whether the surface can be dismissed at all. `undefined` means "follow
   * whether a dismiss handler was supplied" — which is how a mandatory surface
   * (a dialog the user must answer) is expressed without a separate API.
   */
  dismissible?: boolean;
  /**
   * Whether the surface declares a dismissal path at all. A surface with no
   * handler cannot show a close control: the control would render and do nothing,
   * which is worse than not rendering it.
   */
  hasDismissHandler: boolean;
};

export type DismissPolicy = {
  /** True when at least one trigger may dismiss. */
  canDismiss: boolean;
  /**
   * A visible close affordance MUST be rendered.
   *
   * This is the part the scrim-only shell got wrong: it could render a surface
   * that declared a dismissal path and showed no control for it, so the declared
   * path was unreachable. Deriving `showClose` from the same value the triggers
   * use means a sheet cannot declare dismissal and render nothing.
   */
  showClose: boolean;
  /**
   * Bind to a platform trigger. `enabled` is the caller's current OPEN state:
   * a trigger on a closed surface must do nothing, whatever the policy says.
   *
   * `triggers` is what `dismissTriggersFor()` returned. It is REQUIRED rather
   * than optional: while it was absent this parameter was accepted and ignored,
   * which made `dismissTriggersFor` decorative — a docked surface could declare
   * no scrim and still be dismissed by one, because the declaration was never
   * consulted. The lint rule that caught it (`noUnusedFunctionParameters`) was
   * right and this is the fix it was pointing at.
   */
  shouldDismiss: (
    trigger: keyof DismissTriggers,
    enabled: boolean,
    triggers: DismissTriggers,
  ) => boolean;
};

/**
 * Resolve the dismissal policy. Pure — the caller supplies the current open
 * state as `enabled`.
 */
export function createDismissPolicy(
  options: DismissPolicyOptions,
): DismissPolicy {
  // `??` rather than `||`: `dismissible: false` is a real answer that must win
  // over an absent-or-present handler, or a mandatory surface would show a close
  // button because it happens to have been handed an `onDismiss`.
  const dismissible = options.dismissible ?? options.hasDismissHandler;

  return {
    canDismiss: dismissible,
    // A close control is derived from the SAME value the triggers read, so the
    // two can never disagree.
    showClose: dismissible,
    shouldDismiss: (trigger, enabled, triggers) =>
      enabled && dismissible && triggers[trigger] === true,
  };
}

/**
 * The triggers a renderer should wire, given what it can actually offer.
 *
 * A docked surface has no scrim and no Escape — it is persistent, not modal — so
 * it declares those `false` rather than binding handlers that can never fire. That
 * is the `DockSheet` reasoning (role="region", no elevation token) expressed as a
 * data decision instead of scattered conditionals.
 */
export function dismissTriggersFor(surface: {
  modal: boolean;
  hasVisibleClose: boolean;
}): DismissTriggers {
  return {
    scrim: surface.modal,
    escape: surface.modal,
    closeButton: surface.hasVisibleClose,
  };
}
