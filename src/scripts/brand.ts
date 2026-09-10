// The footer lockup draws itself once, as it scrolls into view: the A first,
// then the crossbar running through the connector curves into the two p's.
// That stroke order is the mark's own story, "A to App", so the motion says
// what the logo means rather than decorating it.
import gsap from 'gsap';
import { STATIC } from './motion';

export function initBrandDraw(): void {
  const svg = document.querySelector<SVGSVGElement>('.footer-logo .wordmark');
  if (!svg || STATIC) return; // static mode renders it drawn, like every other reveal

  const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path[data-draw]'))
    .sort((a, b) => Number(a.dataset.draw) - Number(b.dataset.draw));
  if (!paths.length) return;

  // The after-image is the residue of a letter that has already arrived, so it
  // cannot precede the letter. Hold it back until the A itself is drawn.
  const ghost = svg.querySelector<SVGGElement>('.ghost');

  // The undrawn state is set here and never in CSS, so a script that fails to
  // run leaves the logo visible rather than blank.
  for (const path of paths) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
  }

  if (ghost) ghost.style.opacity = '0';

  const draw = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 92%', once: true } });
  draw.to(paths, { strokeDashoffset: 0, duration: .5, ease: 'power2.out', stagger: .1 });
  if (ghost) draw.to(ghost, { opacity: 1, duration: .45, ease: 'power1.out' }, .5);
}
