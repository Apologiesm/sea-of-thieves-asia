# docs/assets.md — Sea of Thieves Asia Asset Management

> Beta status: no real asset library exists yet. Use placeholders only.

## Layout (planned)
```
assets/
  brand/       # logos, wordmarks — REPLACE_BEFORE_LAUNCH
  images/      # screenshots, banners — EMPTY_FOR_BETA
  icons/       # UI icons — EMPTY_FOR_BETA
  fonts/       # licensed typefaces — REPLACE_BEFORE_LAUNCH
```

## Image specifications
- Banner / hero: `REPLACE_BEFORE_LAUNCH`
- Thumbnail: `REPLACE_BEFORE_LAUNCH`
- Avatar: `REPLACE_BEFORE_LAUNCH`
- Allowed formats: `REPLACE_BEFORE_LAUNCH`

## Icon usage
- Icon set: `REPLACE_BEFORE_LAUNCH`
- Do not mix icon styles.
- Do not draw new icons as a stand-in for the real set.

## Optimization
- Compress before commit; target sizes: `REPLACE_BEFORE_LAUNCH`.
- Prefer modern formats where supported.
- Keep source files out of the built output.

## Copyright and licensing
- All assets must be owned by the project or licensed for use.
- Record the source and license for every asset in a manifest.
- Do not use third-party art, screenshots, or logos as filler.

## Rules
- `EMPTY_FOR_BETA` directories render an empty state; never seed fake images.
- Every unknown value stays `REPLACE_BEFORE_LAUNCH`.
- No invented assets, and no placeholder images styled to look real.
