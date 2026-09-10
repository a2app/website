// Page-wide scroll plumbing: the progress bar, the fade-up reveal the content
// sections use, and the shader palette drifting with the section in view.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STATIC } from './motion';
import { setPalette } from './field';

export function initProgress(): void {
  const bar = document.getElementById('prog');
  if (!bar) return;
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
}

export function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (STATIC) return; // html.static renders them visible
  els.forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: .9, ease: 'power3.out',
      delay: parseFloat(el.dataset.delay ?? '0'),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

export function initPalettes(): void {
  const marks = Array.from(document.querySelectorAll<HTMLElement>('[data-palette]'));
  marks.forEach((el, i) => {
    const mine = parseInt(el.dataset.palette ?? '0', 10);
    const prev = i > 0 ? parseInt(marks[i - 1].dataset.palette ?? '0', 10) : 0;
    ScrollTrigger.create({
      trigger: el, start: 'top center',
      onEnter: () => setPalette(mine),
      onLeaveBack: () => setPalette(prev),
    });
  });
}
