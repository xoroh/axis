## Carousel

Source of truth: `CarouselProps` in `@xoroh/axis`.

Paged content: `index?`, `defaultIndex?` (default 0),
`onIndexChange?`, `loop?` (default `false`, wraps at ends),
`testID?`, `style?`, `children` (pages, required), `ref`. Only the
active page mounts; Previous/Next controls clamp (or loop) at
bounds. No swipe — gesture paging deferred. All optional except
`children`.
