/**
 * Dismiss wiring — which platform signal closes which surface.
 *
 * ## Why this is a primitive
 *
 * `dismissPolicy.ts` owns the POLICY (may this surface dismiss; must a close
 * affordance exist). This owns the WIRING: which concrete signal — pointer
 * outside the surface, focus leaving it, the Escape key, the system back
 * gesture — is bound on a given surface. Both renderers bind the same SET of
 * signals for the same surface kind today with independent conditionals, so a
 * surface that gains a binding on web silently keeps the old set natively.
 *
 * ## What is genuinely shared, and what is not
 *
 * The DECLARATION is shared: a modal surface wires outside-pointer, focus-out
 * and escape; a non-modal one wires none of those and only its visible close
 * control. The BINDING is not — a DOM pointerdown listener and an RN hardware
 * back handler are platform code. So this returns the branch set, and each
 * renderer binds its own listeners to it.
 *
 * Branch/surface language: a BRANCH is one dismiss signal; a SURFACE declares
 * which branches it wires. A branch fires only when declared AND the surface is
 * open AND the policy allows dismissal — the declaration is consulted, never
 * decorative (the `dismissTriggersFor` lesson).
 */

/** One concrete dismiss signal a renderer can bind. */
export type DismissSource =
  /** Pointer contact outside the surface (scrim press, backdrop tap). */
  | "outside-pointer"
  /** Focus moved outside the surface while it is open. */
  | "focus-out"
  /** The Escape key (web) or dismiss key equivalent. */
  | "escape"
  /** The system back affordance (Android hardware back, swipe-back). */
  | "system-back"
  /** A visible close affordance inside the surface was activated. */
  | "close";

export type DismissBranches = Record<DismissSource, boolean>;

export type DismissWiringOptions = {
  /** A modal surface locks interaction outside itself, so outside signals dismiss. */
  modal: boolean;
  /** Whether the surface may dismiss at all (the policy's `canDismiss`). */
  dismissible: boolean;
  /**
   * Whether a visible close affordance is rendered. A surface with no control
   * cannot wire the `close` branch: the branch would be declared and never
   * fire, which is worse than not declaring it.
   */
  hasVisibleClose: boolean;
};

/**
 * The branches a surface wires, given what it is.
 *
 * Modal + dismissible wires every branch; anything else wires only what it can
 * honestly offer. A non-modal surface never wires outside-pointer or focus-out
 * — the content behind it stays interactive by definition, so treating outside
 * contact as dismissal would close a surface the user never left.
 */
export function dismissBranchesFor(
  options: DismissWiringOptions,
): DismissBranches {
  const armed = options.modal && options.dismissible;
  return {
    "outside-pointer": armed,
    "focus-out": armed,
    escape: armed,
    // The system back button exists on native only, but the DECLARATION is
    // platform-free: web simply never binds this branch, the same shape as the
    // parity contract's `dismissalOnlyNative`. Declaring it here keeps the set
    // identical on both sides instead of letting each renderer invent one.
    "system-back": armed,
    close: options.dismissible && options.hasVisibleClose,
  };
}

/**
 * Whether `source` dismisses a surface that is currently `enabled` (open), per
 * the branches the surface declared. An undeclared branch never fires,
 * whatever the open state.
 */
export function shouldDismissOn(
  source: DismissSource,
  enabled: boolean,
  branches: DismissBranches,
): boolean {
  return enabled && branches[source] === true;
}
