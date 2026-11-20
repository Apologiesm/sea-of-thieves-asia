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

## Current asset register (Milestone 10 audit)

| File | Use | Source | License / status |
|---|---|---|---|
| `public/media/sot1-hero.mp4` | Hero background loop | Provided by the project owner from a Sea of Thieves trailer (`reference/sot1.mp4`) | **Rights not documented.** Owner must confirm permission before public launch. |
| `public/media/sot1-hero.jpg` | Poster for hero loop | Frame extracted from the same owner-provided clip | Same status as above. |
| `public/media/sot2-page.mp4` | Page background loop | Provided by the project owner from a Sea of Thieves trailer (`reference/sot2.mp4`) | **Rights not documented.** Owner must confirm permission before public launch. |
| `public/media/sot2-page.jpg` | Poster for page loop | Frame extracted from the same owner-provided clip | Same status as above. |
| `public/backgrounds/night-ocean.png` | Unused fallback image | Wikimedia Commons, "Moonlight Glints off the Barents Sea (CIRA 2024-03-18)" | Public domain. Source recorded in `public/backgrounds/SOURCE.md`. |
| `public/backgrounds/trailer-loop.mp4`, `trailer-poster.jpg` | Unused earlier loop | Derived from the downloaded official trailer | Rights not documented. |

### Required action before launch
The two video loops currently drive the background. Because their source is
copyrighted game footage supplied by the owner, **written confirmation of the
right to publish them is required**, or they must be replaced with licensed or
original footage. Until then they should be treated as beta-only placeholders.
No Sea of Thieves logo, model, texture, or font is used.

### Reference site note
The community site `https://www.seaofthievesau.com/` was reviewed for **layout
and feature ideas only**. No images, logos, fonts, copy, event data, or code from
that site were copied into this project. All illustrations in the feature board
are original hand-authored SVG line art in `src/components/content/VoyageArt.tsx`.
