import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { type RenderProp, resolveRender } from "../render";
import type { SlotProps } from "../slot";

/**
 * Avatar — an unstyled identity image with fallback, in compound parts.
 *
 * `AvatarRoot` owns the image loading status and paints the
 * positioning container; `AvatarImage` mounts the `Image` and reports
 * loading status; `AvatarFallback` renders caller content (initials,
 * icon) when there is no image, when loading is still inside its
 * `delay`, or when the image failed. No default visuals — sizing,
 * shape, and placeholder art are the caller's.
 *
 * Loading follows the Base UI status domain (`idle` | `loading` |
 * `loaded` | `error`): no source is `idle`; mount with a source
 * starts `loading`; pixels resolve to `loaded`; a load error
 * resolves to `error` and unmounts the image (a broken-image icon
 * painted over the fallback helps nobody). While `loading` the
 * image stays mounted but hidden from assistive tech so the
 * fallback provides the accessible name on its own (the Base UI
 * stacking guidance, automatic here — React Native paints nothing
 * until pixels arrive, so the fallback shows through by
 * construction). There is no `keepMounted` prop: it is N/A — the
 * image must mount to load, and unmount-on-error is the only
 * question it answers.
 *
 * Identity state, not decoration: the loaded image carries the
 * image role and label; the fallback is plain content.
 */

export type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error";

export type AvatarRootState = {
  /** The image loading status. */
  imageLoadingStatus: ImageLoadingStatus;
};

export type AvatarImageState = {
  /** The image loading status. */
  imageLoadingStatus: ImageLoadingStatus;
};

export type AvatarFallbackState = {
  /** The image loading status. */
  imageLoadingStatus: ImageLoadingStatus;
};

export type AvatarRootProps = {
  /** Root content (`AvatarImage` + `AvatarFallback`). */
  children?: ReactNode;
  testID?: string;
  /** Root container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<AvatarRootState, SlotProps>;
  /** Forwarded to the root container host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type AvatarImageProps = {
  /** Image source (required — without one the root stays `idle`). */
  source: ImageSourcePropType;
  /** Accessible name source (ADR-112, e.g. the person's name). Announced only while loaded. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Image style, caller-provided. */
  style?: StyleProp<ImageStyle>;
  /** Fires with the next loading status on every transition. */
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<AvatarImageState, SlotProps>;
  /** Forwarded to the `Image` host element. */
  ref?: Ref<ElementRef<typeof Image>>;
};

export type AvatarFallbackProps = {
  /** Fallback content (initials, icon). */
  children?: ReactNode;
  /**
   * Milliseconds to wait before showing the fallback while loading.
   * Default `0` (no flash suppression). The fallback always shows
   * immediately when `idle` or `error`.
   */
  delay?: number;
  testID?: string;
  /** Fallback container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<AvatarFallbackState, SlotProps>;
};

type AvatarDisclosure = {
  imageLoadingStatus: ImageLoadingStatus;
  reportStatus: (status: ImageLoadingStatus) => void;
  registerImage: () => void;
};

/**
 * Shared loading status. Internal to this module (not exported):
 * image and fallback must render inside an `AvatarRoot` to
 * participate; outside one the image never loads and the fallback
 * always shows.
 */
const AvatarDisclosureContext = createContext<AvatarDisclosure | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignViewRef(
  ref: AvatarRootProps["ref"],
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

function assignImageRef(
  ref: AvatarImageProps["ref"],
  value: ElementRef<typeof Image> | null,
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

export function AvatarRoot({
  children,
  testID,
  style,
  render,
  ref,
}: AvatarRootProps): React.ReactNode {
  const [imageLoadingStatus, setImageLoadingStatus] =
    useState<ImageLoadingStatus>("idle");
  const [hasImage, setHasImage] = useState(false);

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignViewRef(ref, node);
    },
    [ref],
  );

  const reportStatus = useCallback((status: ImageLoadingStatus) => {
    setImageLoadingStatus(status);
  }, []);

  const registerImage = useCallback(() => {
    setHasImage(true);
  }, []);

  useEffect(() => {
    if (hasImage) {
      setImageLoadingStatus((previous) =>
        previous === "idle" ? "loading" : previous,
      );
    }
  }, [hasImage]);

  const disclosure = {
    imageLoadingStatus: hasImage ? imageLoadingStatus : "idle",
    reportStatus,
    registerImage,
  } as AvatarDisclosure;

  const state: AvatarRootState = {
    imageLoadingStatus: disclosure.imageLoadingStatus,
  };
  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setHostRef} testID={testID} style={style}>
      <AvatarDisclosureContext.Provider value={disclosure}>
        {children}
      </AvatarDisclosureContext.Provider>
    </View>
  );
}

export function AvatarImage({
  source,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  onLoadingStatusChange,
  render,
  ref,
}: AvatarImageProps): React.ReactNode {
  const disclosure = useContext(AvatarDisclosureContext);

  useEffect(() => {
    disclosure?.registerImage();
  }, [disclosure]);

  const setHostRef = useCallback(
    (node: ElementRef<typeof Image> | null) => {
      assignImageRef(ref, node);
    },
    [ref],
  );

  const report = useCallback(
    (status: ImageLoadingStatus) => {
      disclosure?.reportStatus(status);
      onLoadingStatusChange?.(status);
    },
    [disclosure, onLoadingStatusChange],
  );

  // Outside a root there is no status owner: never load, never announce.
  if (!disclosure) return null;
  if (disclosure.imageLoadingStatus === "error") return null;

  const loaded = disclosure.imageLoadingStatus === "loaded";
  const state: AvatarImageState = {
    imageLoadingStatus: disclosure.imageLoadingStatus,
  };
  const substituted = resolveRender(
    render,
    {
      // Hidden from assistive tech until loaded, so the fallback
      // provides the accessible name on its own (the Base UI
      // stacking guidance).
      accessible: loaded,
      role: "img",
      ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
      ...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {}),
      testID,
      style,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Image
      ref={setHostRef}
      source={source}
      accessible={loaded}
      role="img"
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
      testID={testID}
      style={style}
      onLoadStart={() => report("loading")}
      onLoad={() => report("loaded")}
      onError={() => report("error")}
    />
  );
}

export function AvatarFallback({
  children,
  delay = 0,
  testID,
  style,
  render,
}: AvatarFallbackProps): React.ReactNode {
  const disclosure = useContext(AvatarDisclosureContext);
  const [delayElapsed, setDelayElapsed] = useState(delay <= 0);

  useEffect(() => {
    if (delay <= 0) return;
    const timer = setTimeout(() => setDelayElapsed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Outside a root there is no image to wait for: always show.
  const status = disclosure?.imageLoadingStatus ?? "idle";
  const show =
    status === "idle" ||
    status === "error" ||
    (status === "loading" && delayElapsed);
  if (!show) return null;

  const state: AvatarFallbackState = { imageLoadingStatus: status };
  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}
