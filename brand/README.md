# A2App brand assets

Everything in `../public/` is **generated**. Don't hand-edit it — change
`export.py` and re-run:

```bash
python3 brand/export.py
```

Requires `rsvg-convert` (`brew install librsvg`) and Pillow.

## What ships

| File | Use |
|---|---|
| `favicon.svg` | primary favicon — modern browsers, scales to any size |
| `favicon.ico` | legacy fallback, 16/32/48 in one file |
| `favicon-16/32/48.png` | explicit raster sizes if you need them |
| `apple-touch-icon.png` | 180×180, **fully opaque** (iOS composites transparency onto white) |
| `icon-192.png`, `icon-512.png` | PWA manifest icons, transparent |
| `icon-512-maskable.png` | Android adaptive icon — art sits inside the central 80% safe zone |
| `og-image.png` | 1200×630 social card |
| `wordmark.svg` / `.png` / `@2x.png` | the full lockup |
| `mark.svg` | square mark, for nav and tight spaces |
| `*-on-light.svg` | dark-ground variants for light backgrounds |
| `site.webmanifest` | PWA manifest |

## Two weights, on purpose

The display mark uses an 11-unit stroke. The **icons use 13** with tighter
margins, because at 16px an 11-unit stroke renders about 1.7px and goes mushy.
That's why `favicon.svg` is not simply `mark.svg` on a plate.

## Colour

Accent ramp is **mint → sky**, `#6EE7B7 → #38BDF8`.

Chosen over the original mint → indigo (`#818CF8`) because that travelled 78° of
hue and sRGB interpolates straight through the low-saturation middle — it sagged
42%, and the dip landed on the connector stroke. Mint → sky travels 43° and sags
23%.

On light grounds use the darkened pair: `#0D9668 → #0284C7`.

## In the page

`head-snippet.html` has the exact tags. For the nav, inline `mark.svg` rather
than using `<img>` so it can inherit colour and be animated.

## Note on gradients

The letterform is white/ink; only the crossbar, connectors and `pp` carry the
ramp. If you ever need a **one-colour** version (embroidery, engraving, single-
colour print), use flat `#6EE7B7` for those strokes — the mark is designed to
survive it.
