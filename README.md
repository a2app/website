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
npm run demos     # rebuild the live Makepad demos into public/demos (see below)
```

## Layout

- `src/pages/index.astro` — the front page, section by section
- `src/layouts/Base.astro` — head tags, fonts, the ambient layers (shader canvas, vignette, noise, cursor halo, progress bar)
- `src/components/` — one component per section; `Hero`, `HowItWorks` and `Devices` are the pinned scroll stages
- `src/scripts/` — `field.ts` (WebGL shader), `hero.ts` (assembly sequence), `stages.ts` (rail + devices), `reveal.ts` (progress bar, fade-up, palette drift), `nav.ts`, `demo.ts`
- `src/styles/` — `global.css` (tokens, ambient layers, nav), `hero.css` (stages, ported from the prototype), `sections.css` (content sections)
- `src/pages/background.astro` — AOSF, the software factory and Why Now; all three sit behind the product
  rather than in front of it, so they were moved off the front page
- `src/pages/demos.astro` — the live demos page; `src/data/demos.json` is the demo manifest
- `src/components/DemoEmbed.astro` + `src/scripts/embed.ts` — poster with a Run button that swaps in an iframe on demand
- `public/demos/` — the staged Makepad wasm apps and the shared host page `run.html`
- `tests/parity.test.mjs` — every visible string, section id and external link from `tests/fixtures/legacy-index.html` must survive in `dist/index.html`
- `tests/demos.test.mjs` — every demo in the manifest has its wasm, poster and host-page entry, and appears on the built `/demos` page
- `brand/` — logo geometry and the export script; `public/` holds its generated output plus `CNAME`
- `_prototypes/` — the throwaway design-direction prototypes the site was built from

## Motion model

Below 960px, or with `prefers-reduced-motion`, `html.static` is set: nothing
pins or scrubs and every stage renders its finished state. Otherwise
ScrollTrigger reports progress for the pinned stages; the hero build and the
device fan-out are time-driven tweens that fire once a trigger point is reached
and never rewind.

## Live demos

The demos are real Makepad apps (from `examples/` and `apps/`) compiled to WebAssembly.
`scripts/build-demos.sh` builds each one from a Makepad checkout (`MAKEPAD_DIR`, default
`~/git/mp/makepad-webdemos`) with

```bash
cargo makepad wasm build -p makepad-example-<name> --release --no-threads --strip
```

The checkout has to be the webdemos snapshot, commit `5a9eed960`. Makepad's `dev`
branch builds wasm that panics at init on an empty window pool, and `work` does not
compile, so neither can produce a working demo. The script also builds cargo-makepad
from that same checkout and uses it instead of the one on `PATH`, which may disagree
with the tree about the font-asset manifest and refuse to package.

then gzips the wasm into `public/demos/wasm/<name>.wasm.gz` and stages the runtime
JS, the widget fonts (shared by every app) and any app resources next to it.
`public/demos/run.html?app=<name>` is the one host page: it fetches the gzip,
inflates it with `DecompressionStream`, compiles it and hands the module to the
Makepad web runtime. Because the build is single-threaded it needs no
`Cross-Origin-*` headers, so it works on GitHub Pages and inside iframes. The
trade-off is no audio output and no background threads in the demos.

To add a demo: append `<id>=<crate dir>` to `DEMOS` in `scripts/build-demos.sh`,
add an entry to `src/data/demos.json` and to `APPS` in `public/demos/run.html`,
run `npm run demos`, and capture a poster into `public/demos/posters/<id>.webp`.

A demo that needs one small change to the upstream source keeps it in
`scripts/patches/<id>.patch`. The build applies it before compiling and reverts it
on the way out, so the Makepad checkout is left as it was found. The data grid uses
one to open on its charts tab rather than the spreadsheet.

Apps whose `[[bin]]` name differs from the crate name (finance, sheets, task,
image) trip cargo-makepad's packaging step, which looks for `<crate>.wasm`. The
script works around it by copying the freshly built `<bin>.wasm` under the
crate name and running the packaging pass again.

Web builds are single-threaded, so apps that spawn threads log a harmless
"spawn_thread is unsupported" error. The script also leaves out the two CJK faces
and the emoji font the widget package ships, because they are 46 MB between them
and nothing on the site shows anything but Latin text; apps that ask for them 404
and fall back to IBM Plex.

Posters are screenshots of the running apps at 2x; `tests/demos.test.mjs`
fails if one is missing.
