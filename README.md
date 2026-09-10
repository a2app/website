# a2app.ai

The A2App landing page: an Astro static site with Tailwind and GSAP. The hero
assembles a dashboard from a typed prompt as you scroll; the content sections
below are ported verbatim from the previous single-file site.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve dist/
npm run check     # astro check (types)
npm test          # content parity against the legacy page (build first)
npm run brand     # regenerate public/ icons from brand/export.py
```

## Layout

- `src/pages/index.astro` — the one page, section by section
- `src/layouts/Base.astro` — head tags, fonts, the ambient layers (shader canvas, vignette, noise, cursor halo, progress bar)
- `src/components/` — one component per section; `Hero`, `HowItWorks` and `Devices` are the pinned scroll stages
- `src/scripts/` — `field.ts` (WebGL shader), `hero.ts` (assembly sequence), `stages.ts` (rail + devices), `reveal.ts` (progress bar, fade-up, palette drift), `nav.ts`, `demo.ts`
- `src/styles/` — `global.css` (tokens, ambient layers, nav), `hero.css` (stages, ported from the prototype), `sections.css` (content sections)
- `tests/parity.test.mjs` — every visible string, section id and external link from `tests/fixtures/legacy-index.html` must survive in `dist/index.html`
- `brand/` — logo geometry and the export script; `public/` holds its generated output plus `CNAME`
- `_prototypes/` — the throwaway design-direction prototypes the site was built from

## Motion model

Below 960px, or with `prefers-reduced-motion`, `html.static` is set: nothing
pins or scrubs and every stage renders its finished state. Otherwise
ScrollTrigger reports progress for the pinned stages; the hero build and the
device fan-out are time-driven tweens that fire once a trigger point is reached
and never rewind.
