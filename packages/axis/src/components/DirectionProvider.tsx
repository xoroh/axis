import { createContext, type ReactNode, useContext } from "react";
import { I18nManager } from "react-native";

/**
 * DirectionProvider — the Base UI direction counterpart for React Native.
 *
 * Groups a subtree under one reading direction (`"ltr"` or `"rtl"`,
 * default `"ltr"`). `useDirection()` reads the nearest provider;
 * with no provider it falls back to the native locale
 * (`I18nManager.isRTL ? "rtl" : "ltr"`). Consumers that mirror
 * horizontal geometry or keys (Slider arrow handling) read the hook
 * instead of taking per-part `dir` props — one owner per tree.
 *
 * Renders no host element: this is pure context plumbing
 * (the `TooltipProvider` precedent — timing/group state without a
 * view). No `dir` DOM attribute is set; web direction stays the
 * caller's document concern.
 */

export type Direction = "ltr" | "rtl";

export type DirectionProviderProps = {
  /** Reading direction for the subtree. Default `"ltr"`. */
  direction?: Direction;
  /** Content sharing this direction. */
  children?: ReactNode;
};

const DirectionContext = createContext<{ direction: Direction } | null>(null);

export function DirectionProvider({
  direction = "ltr",
  children,
}: DirectionProviderProps): React.ReactNode {
  return (
    <DirectionContext.Provider value={{ direction }}>
      {children}
    </DirectionContext.Provider>
  );
}

/**
 * Read the nearest `DirectionProvider`'s direction. Outside any
 * provider, falls back to the native locale
 * (`I18nManager.isRTL ? "rtl" : "ltr"`).
 */
export function useDirection(): Direction {
  const context = useContext(DirectionContext);
  if (context) return context.direction;
  return I18nManager.isRTL ? "rtl" : "ltr";
}
